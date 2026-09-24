import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeKyivstar } from './scenario.js';
import { validateScenario, evidenceForClaims } from './model.js';

const geometry = JSON.parse(
  readFileSync(
    new URL('../../public/cyber/ukraine.geojson', import.meta.url),
    'utf8',
  ).replace(/^\uFEFF/, ''),
).geometry;
const bundle = () => normalizeKyivstar(structuredClone(geometry));
test('verified bundle validates and resolves shared source provenance once', () => {
  const data = validateScenario(bundle());
  const evidence = evidenceForClaims(data, ['c-traffic', 'c-duration']);
  assert.equal(evidence.length, 1);
  assert.equal(
    evidence[0].provenance.publisher,
    'Cloudflare Radar · David Belson',
  );
  assert.equal(
    data.observations[0].value,
    null,
    'No synthetic numeric samples',
  );
});
test('published interval derives 79.5 hours without inventing day precision', () => {
  const data = bundle();
  const t = data.times.find((t) => t.id === 't-disruption');
  assert.equal((Date.parse(t.end) - Date.parse(t.start)) / 3600000, 79.5);
  assert.equal(data.times.find((t) => t.id === 't-mobile').start, '2023-12-15');
  assert.equal(
    data.provenance.find((p) => p.id === 'src-cloudflare').publishedAt,
    '2024-01-22',
  );
});
for (const [name, mutate, expected] of [
  [
    'dangling evidence',
    (d) => {
      d.claims[0].evidenceIds = ['missing'];
    },
    /invalid evidence reference/,
  ],
  [
    'duplicate IDs',
    (d) => {
      d.entities[1].id = d.entities[0].id;
    },
    /duplicate ID/,
  ],
  [
    'promoting a report to observation',
    (d) => {
      d.claims[0].status = 'OBSERVED';
    },
    /missing observations/,
  ],
  [
    'unsourced inference',
    (d) => {
      d.claims.find((c) => c.status === 'INFERRED').premiseIds = [];
    },
    /missing claims/,
  ],
  [
    'current topology presented as historical',
    (d) => {
      d.geometries[0].role = 'EVENT_TIME_OBSERVATION';
    },
    /current reference cannot/,
  ],
  [
    'arbitrary ASN coordinate',
    (d) => {
      d.entities[1].coordinates = [30, 50];
    },
    /geometry requires/,
  ],
  [
    'arbitrary ASN geometry relationship',
    (d) => {
      d.relationships.at(-1).from = 'as15895';
    },
    /non-spatial entity/,
  ],
  [
    'out-of-range geography',
    (d) => {
      d.geometries[0].coordinates[0][0][0] = 999;
    },
    /invalid geometry/,
  ],
  [
    'reversed interval',
    (d) => {
      d.times[1].end = '2023-12-01T00:00:00Z';
    },
    /invalid time/,
  ],
  [
    'unsupported certainty',
    (d) => {
      d.claims[0].status = 'CONFIRMED';
    },
    /epistemic status/,
  ],
  [
    'manufactured dispute',
    (d) => {
      d.claims[0].status = 'DISPUTED';
    },
    /competing sources/,
  ],
])
  test(`rejects ${name}`, () => {
    const data = bundle();
    mutate(data);
    assert.throws(() => validateScenario(data), expected);
  });

test('Colonial reports remain distinct from measurements and event-time geography', () => {
  const data = validateScenario(
    JSON.parse(
      readFileSync(
        new URL('../../public/cyber/colonial.json', import.meta.url),
        'utf8',
      ),
    ),
  );
  assert.equal(data.observations.length, 0);
  assert.ok(data.claims.every((c) => c.status !== 'OBSERVED'));
  assert.equal(data.geometries.length, 3);
  for (const id of ['houston', 'linden']) {
    const g = data.geometries.find((g) => g.id === `geo-${id}`);
    assert.equal(g.type, 'Point');
    assert.equal(g.role, 'REFERENCE_CONTEXT');
    assert.match(
      evidenceForClaims(data, [`c-${id}`])[1].provenance.publisher,
      /Census/,
    );
  }
  assert.equal(
    data.times.find((t) => t.id === data.geometries[0].timeId).basis,
    'CURRENT_REFERENCE',
  );
  const evidence = evidenceForClaims(data, ['c-link']);
  assert.match(evidence[0].provenance.publicationLabel, /2022/);
  assert.equal(data.claims.find((c) => c.id === 'c-link').timeId, 't-attack');
  assert.equal(data.claims.find((c) => c.id === 'c-unknown').status, 'UNKNOWN');
  assert.ok(data.times.every((t) => t.precision === 'day'));
});
