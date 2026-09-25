import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tongaSituation } from './tonga.js';
import { validateSituation, visibleRecords } from './model.js';
import { createSituationRuntime } from './runtime.js';

test('mission validates as a provenance-linked situation', () => {
  assert.equal(validateSituation(tongaSituation).id, 'tonga-2022');
  const all = [
    ...tongaSituation.entities,
    ...tongaSituation.events,
    ...tongaSituation.observations,
  ];
  assert.ok(all.every((record) => record.status !== 'INFERRED'));
  assert.ok(
    tongaSituation.sources.every(
      (source) => source.retrievedAt && source.publishedAt !== undefined,
    ),
  );
});

test('Cloudflare degradation predates NASA main eruption; published summaries are not fabricated samples', () => {
  const decline = tongaSituation.observations.find(
    (r) => r.id === 'traffic-decline',
  );
  const eruption = tongaSituation.events.find((r) => r.id === 'main-eruption');
  assert.ok(
    Date.parse(decline.observedTime.start) <
      Date.parse(eruption.validTime.start),
  );
  assert.equal(decline.method, 'published-summary');
  assert.ok(
    tongaSituation.observations.every((r) => !Number.isFinite(r.value)),
  );
});

test('observed-only lens excludes reported eruption, fault, and present-day cable geometry', () => {
  const visible = visibleRecords(tongaSituation, {
    time: '2022-01-15T05:35:00Z',
    lens: 'OBSERVED',
  });
  assert.ok(visible.records.some((r) => r.id === 'traffic-collapse'));
  assert.ok(visible.records.every((r) => r.status === 'OBSERVED'));
  assert.equal(visible.relationships.length, 0);
});

test('fault is distance-only, and bundled subset preserves separate attribution', () => {
  const fault = tongaSituation.entities.find((r) => r.id === 'fault-unknown');
  assert.equal(fault.geometry.type, 'DistanceLocus');
  assert.equal(fault.geometry.radiusMeters, 37000);
  const bundle = JSON.parse(
    readFileSync(
      new URL('../../public/reality/tonga-cables.geojson', import.meta.url),
    ),
  );
  assert.deepEqual(bundle.features.map((f) => f.properties.id).sort(), [
    'tonga-cable',
    'tonga-domestic-cable-extension-tdce',
  ]);
  assert.match(
    tongaSituation.sources.find((s) => s.id === 'telegeography').rights,
    /CC BY-NC-SA 3\.0/,
  );
});

test('runtime source interrogation resolves actual source URL', () => {
  const runtime = createSituationRuntime(tongaSituation);
  const result = runtime.inspect('traffic-collapse');
  assert.equal(result.sources[0].publisher, 'Cloudflare Radar');
  assert.match(result.sources[0].url, /^https:\/\/blog\.cloudflare\.com\//);
  runtime.destroy();
});

test('recovery expires outage-era observations without inventing an exact onset', () => {
  const visible = visibleRecords(tongaSituation, {
    time: '2022-02-22T02:13:00Z',
    lens: 'OBSERVED',
  });
  assert.ok(visible.records.some((r) => r.id === 'traffic-return'));
  assert.ok(
    !visible.records.some((r) =>
      ['traffic-decline', 'traffic-collapse'].includes(r.id),
    ),
  );
  const recovery = tongaSituation.observations.find(
    (r) => r.id === 'traffic-return',
  );
  assert.equal(recovery.timePrecision, 'APPROXIMATE');
  assert.ok(
    tongaSituation.claims.some((r) => r.id === 'domestic-recovery-unknown'),
  );
});

test('publication and sensor acquisition remain distinct from event time', () => {
  assert.equal(
    tongaSituation.sources.find((r) => r.id === 'nasa-airs').publishedAt,
    '2022-02-28',
  );
  const sensor = tongaSituation.observations.find(
    (r) => r.id === 'airs-acquisition',
  );
  assert.equal(sensor.observedTime.start, '2022-01-15T10:59:00Z');
  assert.match(sensor.metric, /radiance/);
  const fault = tongaSituation.entities.find((r) => r.id === 'fault-unknown');
  assert.match(fault.geometry.description, /not a fault boundary/);
  const visible = visibleRecords(tongaSituation, {
    time: tongaSituation.timeRange.start,
  });
  assert.ok(!visible.records.some((r) => r.id === fault.id));
});

test('network and fallback records use a sourced context anchor, never invented sensor coordinates', () => {
  const anchor = tongaSituation.entities.find((r) => r.id === 'tonga');
  assert.equal(anchor.status, 'CURRENT_REFERENCE');
  assert.equal(anchor.geometry.basis, 'CURRENT_REFERENCE');
  for (const id of [
    'traffic-decline',
    'traffic-collapse',
    'traffic-return',
    'airport',
  ]) {
    const item = [
      ...tongaSituation.entities,
      ...tongaSituation.observations,
    ].find((r) => r.id === id);
    assert.equal(item.anchorId, 'tonga');
    assert.equal(item.geometry, undefined);
    assert.match(item.spatialDescription, /Country context/);
  }
  for (const id of ['traffic-collapse', 'bgp-spike']) {
    const item = tongaSituation.observations.find((r) => r.id === id);
    assert.equal(item.observedTimePrecision, 'CONTAINING_DAY');
    assert.equal(item.observedTime.end, '2022-01-16T00:00:00Z');
    assert.ok(item.observedAt);
  }
});
