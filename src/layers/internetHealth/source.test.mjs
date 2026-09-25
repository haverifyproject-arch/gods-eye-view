import test from 'node:test';
import assert from 'node:assert/strict';
import { createInternetHealthSource } from './source.js';
import { countries, event } from '../../testSupport/internetHealth.mjs';
test('source requests a rolling recent window and excludes GTR without persistent provider cache', async () => {
  const calls = [];
  const now = 2000000000;
  const source = createInternetHealthSource({
    now: () => now,
    fetchImpl: async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        json: async () =>
          String(url).includes('countries')
            ? countries
            : {
                data: [{ ...event, from: now / 1000 - 100, until: now / 1000 }],
              },
      };
    },
  });
  assert.equal((await source.getSnapshot()).records.length, 1);
  await source.getSnapshot();
  assert.equal(calls.filter((url) => url.includes('countries')).length, 1);
  assert.equal(
    calls.filter((url) => url.includes('/outages/events')).length,
    2,
  );
  const query = new URL(calls[0]).searchParams;
  assert.equal(Number(query.get('until')) - Number(query.get('from')), 86400);
  assert.equal(query.get('ignoreMethods'), 'gtr.*');
});
test('uncooperative body completion cannot publish after abort', async () => {
  const controller = new AbortController();
  const source = createInternetHealthSource({
    fetchImpl: async () => ({
      ok: true,
      json: async () => {
        controller.abort();
        return { data: [] };
      },
    }),
  });
  await assert.rejects(source.getSnapshot({ signal: controller.signal }), {
    name: 'AbortError',
  });
});
