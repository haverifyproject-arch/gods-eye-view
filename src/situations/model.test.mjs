import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSituation,
  validateGeometry,
  utcMillis,
  visibleRecords,
} from './model.js';

const range = { start: '2022-01-01T00:00:00Z', end: '2022-03-01T00:00:00Z' };
const after = { start: '2022-01-15T05:30:00Z', end: range.end };
function fixture() {
  const record = (id, status, extras = {}) => ({
    id,
    label: id,
    status,
    evidenceIds: ['evidence'],
    validTime: { ...range },
    ...extras,
  });
  return {
    schemaVersion: 1,
    id: 'test',
    title: 'Validation fixture',
    timeRange: { ...range },
    sources: [
      {
        id: 'source',
        publisher: 'Test publisher',
        url: 'https://example.org/source',
        rights: 'Test-only fixture',
        publishedAt: '2022-02-22',
        retrievedAt: '2026-09-24T00:00:00Z',
      },
    ],
    evidence: [
      {
        id: 'evidence',
        sourceId: 'source',
        summary: 'Synthetic test fixture, not mission evidence.',
        locator: 'Fixture',
      },
    ],
    entities: [
      record('cable', 'CURRENT_REFERENCE', {
        geometry: {
          type: 'LineString',
          coordinates: [
            [-175, -21],
            [178, -18],
          ],
          basis: 'CURRENT_REFERENCE',
          precision: 'SCHEMATIC',
          evidenceIds: ['evidence'],
          description: 'Schematic current cable reference.',
        },
      }),
    ],
    observations: [
      record('traffic', 'OBSERVED', {
        method: 'published-summary',
        metric: 'traffic',
        value: 'near-zero',
        scope: 'Publisher vantage',
        validTime: { ...after },
        observedTime: { ...after },
      }),
    ],
    events: [],
    claims: [record('damage', 'REPORTED', { validTime: { ...after } })],
    relationships: [
      record('dependency', 'REPORTED', {
        from: 'cable',
        to: 'traffic',
        type: 'supports',
        validTime: { ...after },
      }),
    ],
    timeline: [
      { time: range.start, label: 'Before' },
      { time: after.start, label: 'After' },
    ],
  };
}

test('valid source-backed model and qualitative published measurement are accepted', () => {
  assert.equal(validateSituation(fixture()).id, 'test');
});
test('UTC parsing rejects impossible dates and implicit timezone precision', () => {
  for (const value of [
    '2022-02-30T00:00:00Z',
    '2022-01-15',
    '2022-01-15T00:00:00',
    'bad',
  ]) {
    assert.throws(() => utcMillis(value));
  }
});
test('observed lens removes reported edges and current topology, retaining measurements', () => {
  const world = visibleRecords(fixture(), {
    time: after.start,
    lens: 'OBSERVED',
  });
  assert.deepEqual(
    world.records.map((record) => record.id),
    ['traffic'],
  );
  assert.equal(world.relationships.length, 0);
});
test('time and explicit hiding remove effects and their dangling relationships', () => {
  const situation = fixture();
  assert.deepEqual(
    visibleRecords(situation, { time: range.start }).records.map((r) => r.id),
    ['cable'],
  );
  assert.equal(
    visibleRecords(situation, { time: after.start }).relationships.length,
    1,
  );
  assert.equal(
    visibleRecords(situation, { time: after.start, hiddenIds: ['traffic'] })
      .relationships.length,
    0,
  );
  assert.equal(
    visibleRecords(situation, { time: range.end }).records.length,
    0,
  );
});
test('missing sources and missing evidence are rejected', () => {
  const source = fixture();
  source.evidence[0].sourceId = 'missing';
  assert.throws(() => validateSituation(source), /missing source/);
  const missing = fixture();
  missing.claims[0].evidenceIds = ['absent'];
  assert.throws(() => validateSituation(missing), /missing evidence/);
  const empty = fixture();
  empty.claims[0].evidenceIds = [];
  assert.throws(() => validateSituation(empty), /needs evidence/);
});
test('duplicate IDs across record groups and missing endpoints are rejected', () => {
  const duplicate = fixture();
  duplicate.claims[0].id = 'cable';
  assert.throws(() => validateSituation(duplicate), /duplicate ID/);
  const dangling = fixture();
  dangling.relationships[0].from = 'missing';
  assert.throws(() => validateSituation(dangling), /endpoints/);
});
test('reference geometry cannot silently become historical observation', () => {
  const situation = fixture();
  situation.entities[0].status = 'OBSERVED';
  assert.throws(
    () => validateSituation(situation),
    /current-reference geometry/,
  );
});
test('reported assertions cannot be relabeled observed without measurement support', () => {
  const situation = fixture();
  situation.claims[0].status = 'OBSERVED';
  assert.throws(() => validateSituation(situation), /without a measurement/);
});
test('invalid coordinates, empty lines and exact distance-only break geography fail', () => {
  const geometry = fixture().entities[0].geometry;
  assert.throws(() =>
    validateGeometry({
      ...geometry,
      coordinates: [
        [181, -21],
        [178, -18],
      ],
    }),
  );
  assert.throws(() => validateGeometry({ ...geometry, coordinates: [] }));
  assert.throws(
    () =>
      validateGeometry({
        ...geometry,
        type: 'DistanceLocus',
        center: [-175, -21],
        radiusMeters: 37000,
        precision: 'EXACT',
      }),
    /cannot be exact/,
  );
  assert.doesNotThrow(() =>
    validateGeometry({
      ...geometry,
      type: 'DistanceLocus',
      center: [-175, -21],
      radiusMeters: 37000,
      precision: 'APPROXIMATE',
    }),
  );
});
test('inference needs supported premises and cycles cannot justify themselves', () => {
  const missing = fixture();
  missing.claims[0].status = 'INFERRED';
  missing.claims[0].method = 'Reasoned from evidence';
  assert.throws(() => validateSituation(missing), /supported premises/);
  const circular = fixture();
  Object.assign(circular.claims[0], {
    status: 'INFERRED',
    method: 'Inference',
    premiseIds: ['dependency'],
  });
  Object.assign(circular.relationships[0], {
    status: 'INFERRED',
    method: 'Inference',
    premiseIds: ['damage'],
  });
  assert.throws(() => validateSituation(circular), /circular/);
});
test('unknowns need an explicit unanswered question', () => {
  const situation = fixture();
  situation.claims[0].status = 'UNKNOWN';
  situation.claims[0].evidenceIds = [];
  assert.throws(() => validateSituation(situation), /unanswered question/);
  situation.claims[0].question = 'Where exactly did it break?';
  assert.doesNotThrow(() => validateSituation(situation));
});
test('invalid intervals, timeline order and lens names fail loudly', () => {
  const interval = fixture();
  interval.claims[0].validTime.end = range.start;
  assert.throws(() => validateSituation(interval), /positive duration/);
  const order = fixture();
  order.timeline.reverse();
  assert.throws(() => validateSituation(order), /out of order/);
  assert.throws(
    () => visibleRecords(fixture(), { time: after.start, lens: 'made-up' }),
    /unknown evidence lens/,
  );
});

function anchoredFixture() {
  const situation = fixture();
  situation.entities.push({
    id: 'country-context',
    label: 'Country context, not a sensor',
    status: 'CURRENT_REFERENCE',
    evidenceIds: ['evidence'],
    validTime: { ...range },
    geometry: {
      type: 'Point',
      coordinates: [-175, -21],
      basis: 'CURRENT_REFERENCE',
      precision: 'APPROXIMATE',
      evidenceIds: ['evidence'],
      description: 'Test cartographic anchor, not historical measurement.',
    },
  });
  Object.assign(situation.observations[0], {
    anchorId: 'country-context',
    spatialDescription: 'Country context; not a sensor location.',
  });
  return situation;
}

test('direct point entity anchors retain observation status without leaking filtered reference entities', () => {
  const situation = validateSituation(anchoredFixture());
  const visible = visibleRecords(situation, {
    time: after.start,
    lens: 'OBSERVED',
  });
  assert.equal(visible.records[0].anchorId, 'country-context');
  assert.ok(!visible.records.some((record) => record.id === 'country-context'));
});

test('dangling, non-entity, non-point, self and chained anchors are rejected', () => {
  for (const id of ['missing', 'damage', 'cable', 'traffic']) {
    const situation = anchoredFixture();
    situation.observations[0].anchorId = id;
    assert.throws(
      () => validateSituation(situation),
      /direct point entity anchor/,
    );
  }
  const chain = anchoredFixture();
  chain.entities[1].anchorId = 'country-context';
  assert.throws(() => validateSituation(chain), /direct point entity anchor/);
  const cycle = anchoredFixture();
  cycle.entities.push({
    ...structuredClone(cycle.entities[1]),
    id: 'other-context',
    anchorId: 'country-context',
  });
  cycle.entities[1].anchorId = 'other-context';
  assert.throws(() => validateSituation(cycle), /direct point entity anchor/);
});

test('anchored observations must explain context and cannot claim independent geometry', () => {
  const missing = anchoredFixture();
  delete missing.observations[0].spatialDescription;
  assert.throws(() => validateSituation(missing), /explicit spatial context/);
  const ambiguous = anchoredFixture();
  ambiguous.observations[0].geometry = {
    ...ambiguous.entities[1].geometry,
    basis: 'RECONSTRUCTED',
  };
  assert.throws(
    () => validateSituation(ambiguous),
    /cannot also supply geometry/,
  );
});
