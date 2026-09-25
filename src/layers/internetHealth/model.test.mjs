import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInternetHealth, validateCountryGeometry } from './model.js';
export const countries = {
  features: [
    {
      properties: {
        iso2: 'AA',
        name: 'Fixture country',
        labelLon: 1,
        labelLat: 2,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [3, 0],
            [3, 3],
            [0, 0],
          ],
        ],
      },
    },
  ],
};
export const options = {
  from: 1000,
  until: 2000,
  retrievedAt: 2000000,
  limit: 100,
};
export const event = {
  entity: { code: 'AA', name: 'Fixture country', type: 'country' },
  from: 1200,
  until: 2000,
  score: 12,
  datasource: 'ping-slash24',
  method: 'median',
};
export const snapshot = () =>
  normalizeInternetHealth({ data: [event] }, countries, options);
test('country aggregation preserves multiple measured signals without claiming ongoing status or network membership', () => {
  const value = normalizeInternetHealth(
    { data: [event, { ...event, datasource: 'bgp' }, event] },
    countries,
    options,
  );
  assert.equal(value.records.length, 1);
  const record = value.records[0];
  assert.equal(record.events.length, 2);
  assert.equal(record.events[0].windowClipped, true);
  assert.equal(record.events[0].recoveryEstablished, false);
  assert.equal(record.affectedNetworks, null);
  assert.equal(record.status, 'recent-detections');
  assert.equal(record.geometryState, 'CURRENT_REFERENCE');
  assert.equal(record.displayAnchor.longitude, 1);
  assert.match(record.displayAnchor.basis, /not a measured/);
});
test('GTR, malformed metrics and missing geography are excluded rather than fabricated', () => {
  const value = normalizeInternetHealth(
    {
      data: [
        { ...event, method: 'gtr.test' },
        { ...event, score: '12' },
        { ...event, entity: { ...event.entity, code: 'ZZ' } },
      ],
    },
    countries,
    options,
  );
  assert.deepEqual(value.records, []);
  assert.equal(value.excluded, 3);
  assert.throws(() =>
    normalizeInternetHealth({ data: [], error: 'failed' }, countries, options),
  );
  assert.throws(() =>
    validateCountryGeometry({ type: 'Point', coordinates: [0, 0] }),
  );
});
test('bounded query limitation is exposed and an empty valid response remains empty', () => {
  assert.equal(
    normalizeInternetHealth({ data: [event] }, countries, {
      ...options,
      limit: 1,
    }).sourceLimited,
    true,
  );
  assert.deepEqual(
    normalizeInternetHealth({ data: [] }, countries, options).records,
    [],
  );
});
