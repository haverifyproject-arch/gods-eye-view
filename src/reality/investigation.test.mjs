import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessInvestigation,
  serializeInvestigation,
} from './investigation.js';

const subject = {
  id: 'country:US',
  label: 'United States',
  events: [{ from: 100, until: 200 }],
  provenance: { url: 'https://ioda.inetintel.cc.gatech.edu/' },
};
const check = (id, comparison, extra = {}) => ({
  id,
  label: id,
  status: 'available',
  stale: false,
  comparison,
  latestSampleAt: 100,
  sourceUrl: 'https://ioda.inetintel.cc.gatech.edu/',
  ...extra,
});
const evidence = (a, b) => ({
  retrievedAt: 100000,
  checks: [check('bgp', a), check('ping-slash24', b)],
});

test('a detection alone remains a lead, not a corroborated incident', () => {
  const result = assessInvestigation({ subject });
  assert.equal(result.verdict, 'pending');
  assert.equal(result.nextCheck.action, 'verify');
  assert.equal(result.revision, null);
});
test('two lower methods corroborate measurements, never nationwide impact or cause', () => {
  const result = assessInvestigation({
    subject,
    signalEvidence: evidence('lower', 'lower'),
  });
  assert.equal(result.verdict, 'corroborated');
  assert.match(result.headline, /routing and active probing/);
  assert.ok(
    result.unknowns.some((text) => text.includes('not independent-provider')),
  );
  assert.equal(result.physical.status, 'unestablished');
});
test('method disagreement revises a previous corroboration only with changed evidence', () => {
  const previous = assessInvestigation({
    subject,
    signalEvidence: evidence('lower', 'lower'),
  });
  const result = assessInvestigation({
    subject,
    signalEvidence: evidence('lower', 'similar'),
    previous,
  });
  assert.equal(result.verdict, 'mixed');
  assert.equal(result.revision.before, previous.headline);
  assert.equal(result.revision.after, result.headline);
  assert.equal(
    assessInvestigation({
      subject,
      signalEvidence: evidence('lower', 'similar'),
      previous: result,
    }).revision,
    null,
  );
});
test('initial check completion and a new subject do not fabricate a revision', () => {
  const previous = assessInvestigation({ subject });
  assert.equal(
    assessInvestigation({
      subject,
      previous,
      signalEvidence: evidence('lower', 'lower'),
    }).revision,
    null,
  );
  const priorCountry = assessInvestigation({
    subject: { id: 'other' },
    signalEvidence: evidence('lower', 'lower'),
  });
  assert.equal(
    assessInvestigation({
      subject,
      previous: priorCountry,
      signalEvidence: evidence('lower', 'similar'),
    }).revision,
    null,
  );
});
test('non-reproduction neither erases earlier event nor asserts recovery', () => {
  const result = assessInvestigation({
    subject,
    signalEvidence: evidence('similar', 'higher'),
  });
  assert.equal(result.verdict, 'not-reproduced');
  assert.match(
    result.established.join(' '),
    /does not disprove an earlier disruption or prove recovery/,
  );
});
for (const extra of [
  { stale: true },
  { status: 'error' },
  { status: 'missing' },
  { comparison: 'insufficient' },
  { stale: undefined },
]) {
  test(`unusable check stays inconclusive: ${JSON.stringify(extra)}`, () => {
    const result = assessInvestigation({
      subject,
      signalEvidence: {
        checks: [check('bgp', 'lower'), check('ping-slash24', 'lower', extra)],
      },
    });
    assert.equal(result.verdict, 'inconclusive');
    assert.equal(result.nextCheck.action, 'verify');
  });
}
test('duplicating BGP does not create independent method corroboration', () => {
  assert.equal(
    assessInvestigation({
      subject,
      signalEvidence: {
        checks: [check('bgp', 'lower'), check('bgp', 'lower')],
      },
    }).verdict,
    'inconclusive',
  );
});
test('physical screening remains unconfirmed and missing physical coverage rules out nothing', () => {
  const result = assessInvestigation({
    subject,
    relationships: [{ kind: 'hypothesis', state: 'INFERRED' }],
  });
  assert.equal(result.physical.status, 'unconfirmed');
  assert.match(result.physical.explanation, /not evidence that this caused/);
  assert.match(
    assessInvestigation({ subject }).physical.explanation,
    /has not been ruled out/,
  );
});
test('takeaway includes source links, explicit method, next check and uncertainty', () => {
  const result = assessInvestigation({
    subject,
    signalEvidence: evidence('lower', 'similar'),
    relationships: [
      { provenance: [{ label: 'bad', url: 'javascript:alert(1)' }] },
    ],
  });
  const markdown = serializeInvestigation(result);
  assert.match(markdown, /https:\/\/ioda/);
  assert.match(markdown, /Next check:/);
  assert.match(markdown, /Still unknown/);
  assert.doesNotMatch(markdown, /javascript:/);
});

test('an observed event after all detections cannot explain their onset', () => {
  const result = assessInvestigation({
    subject,
    relationships: [
      {
        kind: 'physical',
        label: 'Earthquake A',
        provenance: [{ time: '1970-01-01T00:05:00Z' }],
      },
    ],
  });
  assert.match(
    result.established.join(' '),
    /Earthquake A occurred after.*cannot explain their onset/,
  );
  assert.equal(result.physical.status, 'unestablished');
});

test('missing chronology cannot become a rejection of a physical cause', () => {
  const result = assessInvestigation({
    subject,
    relationships: [
      { kind: 'physical', label: 'Earthquake A', provenance: [{ time: null }] },
    ],
  });
  assert.doesNotMatch(
    result.established.join(' '),
    /cannot explain their onset/,
  );
});

test('takeaway accepts the native service wrapper and preserves comparison time', () => {
  const investigation = assessInvestigation({
    subject,
    signalEvidence: {
      ...evidence('similar', 'similar'),
      window: { from: 0, until: 86400 },
    },
  });
  assert.match(
    serializeInvestigation({ subject, investigation, relationships: [] }),
    /Comparison window: 1970-01-01/,
  );
});
