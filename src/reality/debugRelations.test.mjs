import test from 'node:test';
import assert from 'node:assert/strict';
import {
  containsPoint,
  distanceKm,
  buildDebugRelations,
  visibleEvidence,
} from './debugRelations.js';

const polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-5, -5],
      [5, -5],
      [5, 5],
      [-5, 5],
      [-5, -5],
    ],
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ],
  ],
};
test('country scopes preserve holes and do not replace a country with its label anchor', () => {
  assert.equal(containsPoint(polygon, { lon: 0, lat: 0 }), false);
  assert.equal(containsPoint(polygon, { lon: 4, lat: 4 }), true);
  assert.equal(containsPoint(polygon, { lon: 6, lat: 4 }), false);
});
test('dateline country does not accidentally include Greenwich', () => {
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [179, -5],
        [-179, -5],
        [-179, 5],
        [179, 5],
        [179, -5],
      ],
    ],
  };
  assert.equal(containsPoint(geometry, { lon: 179.5, lat: 0 }), true);
  assert.equal(containsPoint(geometry, { lon: -179.5, lat: 0 }), true);
  assert.equal(containsPoint(geometry, { lon: 0, lat: 0 }), false);
});
test('reference routes keep disjoint segments and never become service dependencies', () => {
  const geometry = {
    type: 'MultiLineString',
    coordinates: [
      [
        [3, 3],
        [4, 4],
      ],
      [
        [80, 80],
        [81, 81],
      ],
    ],
  };
  const plan = buildDebugRelations({
    subject: { geometry: polygon },
    references: [{ id: 'cable', geometry, label: 'Cable' }],
  });
  assert.equal(plan.relationships.length, 1);
  assert.equal(plan.relationships[0].state, 'CURRENT_REFERENCE');
  assert.deepEqual(plan.relationships[0].parts, geometry.coordinates);
  assert.match(plan.relationships[0].explanation, /not proof/);
  assert.equal(
    plan.relationships.some((r) => r.state === 'INFERRED'),
    false,
  );
});
test('country overlap does not establish a causal physical link or emit unknown edges', () => {
  const plan = buildDebugRelations({
    subject: { geometry: polygon },
    physical: [
      {
        id: 'q1',
        layerId: 'earthquakes',
        lat: 3,
        lon: 3,
        timeMs: 1000,
        magnitude: 4,
      },
      {
        id: 'q2',
        layerId: 'earthquakes',
        lat: 0,
        lon: 0,
        timeMs: 1000,
        magnitude: 4,
      },
    ],
    now: 2000,
  });
  assert.equal(plan.relationships.length, 1);
  assert.equal(plan.relationships[0].state, 'OBSERVED');
  assert.match(
    plan.relationships[0].explanation,
    /does not establish causation/,
  );
  assert.equal(visibleEvidence('UNKNOWN', 'all'), false);
});

test('the rendered and followed multipart segment is relevant to the selected scope', () => {
  const outside = [
    [80, 40],
    [81, 41],
  ];
  const inside = [
    [3, 3],
    [4, 4],
  ];
  const geometry = { type: 'MultiLineString', coordinates: [outside, inside] };
  const plan = buildDebugRelations({
    subject: { geometry: polygon },
    references: [{ id: 'multipart', geometry }],
  });
  assert.deepEqual(plan.relationships[0].parts[0], inside);
  assert.deepEqual(geometry.coordinates, [outside, inside]);
  assert.equal(plan.relationships[0].parts.length, 2);
});
test('evidence filters hide contextual and inferred world relationships', () => {
  assert.equal(visibleEvidence('CURRENT_REFERENCE', 'observed'), false);
  assert.equal(visibleEvidence('OBSERVED', 'observed'), true);
  assert.equal(visibleEvidence('REPORTED', 'reported'), true);
  assert.equal(visibleEvidence('INFERRED', 'clear_inference'), false);
  assert.equal(visibleEvidence('CURRENT_REFERENCE', 'all'), true);
});
test('proximity radius is explicit and handles the dateline', () => {
  assert.ok(distanceKm({ lon: 179.9, lat: 0 }, { lon: -179.9, lat: 0 }) < 23);
  const plan = buildDebugRelations({
    subject: { lon: 0, lat: 0, radiusKm: 10 },
    physical: [{ id: 'far', layerId: 'earthquakes', lon: 1, lat: 1 }],
  });
  assert.equal(plan.relationships.length, 0);
});

test('a physical-exposure hypothesis requires magnitude, route proximity and subsequent anomaly timing', () => {
  const now = 1800000000000;
  const subject = {
    geometry: polygon,
    events: [{ from: (now - 1000) / 1000 }],
    provenance: { url: 'https://example.test/measurement' },
  };
  const references = [
    {
      id: 'cable',
      label: 'Reference cable',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3, 3.01],
          [4, 4],
        ],
      },
    },
  ];
  const quake = {
    id: 'q',
    layerId: 'earthquakes',
    lat: 3,
    lon: 3,
    magnitude: 6,
    timeMs: now - 3600000,
  };
  const plan = buildDebugRelations({
    subject,
    references,
    physical: [quake],
    now,
  });
  const hypothesis = plan.relationships.find(
    (item) => item.state === 'INFERRED',
  );
  assert.ok(hypothesis);
  assert.match(hypothesis.explanation, /not evidence of a cable fault/);
  assert.equal(hypothesis.provenance.length, 3);
  assert.equal(visibleEvidence(hypothesis.state, 'observed'), false);
  for (const change of [
    { magnitude: 3 },
    { timeMs: now },
    { lat: 4.9, lon: -4.9 },
  ]) {
    assert.equal(
      buildDebugRelations({
        subject,
        references,
        physical: [{ ...quake, ...change }],
        now,
      }).relationships.some((item) => item.state === 'INFERRED'),
      false,
    );
  }
});
