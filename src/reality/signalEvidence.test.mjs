import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSignalEvidenceSource,
  normalizeSignalEvidence,
} from './signalEvidence.js';

const until = 200000;
const from = until - 86400;
const context = {
  countryCode: 'PY',
  from,
  until,
  retrievedAt: until * 1000,
  queryUrl: 'https://example.test',
};
function payload(method = 'bgp', recent = 100) {
  return {
    data: [
      [
        {
          entityType: 'country',
          entityCode: 'PY',
          datasource: method,
          subtype: '',
          from,
          step: 300,
          values: Array.from({ length: 288 }, (_, i) =>
            i >= 264 ? recent : 100,
          ),
        },
      ],
    ],
  };
}

test('compares medians in fixed nonoverlapping windows and preserves actual zero measurements', () => {
  const check = normalizeSignalEvidence(payload('bgp', 0), 'bgp', context);
  assert.equal(check.comparison, 'lower');
  assert.equal(check.changeFraction, -1);
  assert.equal(check.recent.count, 24);
  assert.equal(check.baseline.count, 264);
  assert.equal(check.samples.at(-1).value, 0);
});

test('null, strings and nonfinite values remain missing rather than artificial drops', () => {
  const body = payload();
  body.data[0][0].values.splice(264, 24, ...Array(22).fill(null), '0', NaN);
  const check = normalizeSignalEvidence(body, 'bgp', context);
  assert.equal(check.comparison, 'insufficient');
  assert.equal(check.changeFraction, null);
  assert.equal(check.recent.count, 0);
  assert.equal(check.samples.at(-1).value, null);
  assert.equal(check.stale, true);
});

test('incomplete baseline cannot establish a change even with a fresh recent sample', () => {
  const body = payload('bgp', 30);
  body.data[0][0].values.fill(null, 0, 263);
  const check = normalizeSignalEvidence(body, 'bgp', context);
  assert.equal(check.stale, false);
  assert.equal(check.comparison, 'insufficient');
});

test('zero baseline and mismatched country or duplicated series cannot produce percentages', () => {
  const body = payload();
  body.data[0][0].values.fill(0);
  assert.equal(
    normalizeSignalEvidence(body, 'bgp', context).changeFraction,
    null,
  );
  body.data[0][0].entityCode = 'US';
  assert.equal(normalizeSignalEvidence(body, 'bgp', context).status, 'missing');
  body.data[0][0].entityCode = 'PY';
  body.data[0].push(body.data[0][0]);
  assert.equal(normalizeSignalEvidence(body, 'bgp', context).status, 'missing');
});

test('two different methods expose disagreement without claiming two independent publishers', async () => {
  const source = createSignalEvidenceSource({
    now: () => until * 1000,
    fetchImpl: async (url) => {
      const method = new URL(url).searchParams.get('datasource');
      return {
        ok: true,
        json: async () => payload(method, method === 'bgp' ? 70 : 100),
      };
    },
  });
  const result = await source.inspect('py');
  assert.equal(result.agreement, 'mixed');
  assert.equal(result.independentProviders, false);
  assert.equal(result.checks.length, 2);
  assert.ok(
    result.checks.every((check) => check.queryUrl.includes('/country/PY')),
  );
});

test('one provider error preserves other evidence and cannot become agreement', async () => {
  const source = createSignalEvidenceSource({
    now: () => until * 1000,
    fetchImpl: async (url) =>
      url.includes('datasource=bgp')
        ? { ok: false, status: 429 }
        : { ok: true, json: async () => payload('ping-slash24', 60) },
  });
  const result = await source.inspect('PY');
  assert.equal(result.agreement, 'insufficient');
  assert.equal(result.checks[0].status, 'error');
  assert.equal(result.checks[1].comparison, 'lower');
});

test('cancelled inspections cannot publish after an uncooperative fetch resolves', async () => {
  const controller = new AbortController();
  const source = createSignalEvidenceSource({
    fetchImpl: async () => {
      controller.abort();
      return { ok: true, json: async () => payload() };
    },
  });
  await assert.rejects(source.inspect('PY', { signal: controller.signal }), {
    name: 'AbortError',
  });
});

test('deadline settles a hung body as an error and preserves the completed method', async () => {
  let timedSignal;
  const source = createSignalEvidenceSource({
    now: () => until * 1000,
    timeoutMs: 10,
    fetchImpl: async (url, { signal }) => {
      if (url.includes('datasource=bgp')) {
        timedSignal = signal;
        return { ok: true, json: () => new Promise(() => {}) };
      }
      return { ok: true, json: async () => payload('ping-slash24', 60) };
    },
  });
  const result = await source.inspect('PY');
  assert.equal(result.checks[0].status, 'error');
  assert.match(result.checks[0].error, /timed out/);
  assert.equal(timedSignal.aborted, true);
  assert.equal(timedSignal.reason.name, 'TimeoutError');
  assert.equal(result.checks[1].comparison, 'lower');
});

test('external abort rejects even when both requests ignore their abort signal', async () => {
  const controller = new AbortController();
  const source = createSignalEvidenceSource({
    timeoutMs: 1000,
    fetchImpl: () => new Promise(() => {}),
  });
  const pending = source.inspect('PY', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
