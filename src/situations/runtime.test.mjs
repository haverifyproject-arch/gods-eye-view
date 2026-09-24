import test from 'node:test';
import assert from 'node:assert/strict';
import { createSituationRuntime, createSituationActions } from './runtime.js';

function fixture() {
  const timeRange = {
    start: '2022-01-01T00:00:00Z',
    end: '2022-03-01T00:00:00Z',
  };
  return {
    schemaVersion: 1,
    id: 'fixture',
    title: 'Runtime fixture',
    timeRange,
    sources: [
      {
        id: 'source',
        publisher: 'Fixture',
        rights: 'Test only',
        url: 'https://example.org',
        publishedAt: null,
        retrievedAt: '2026-09-24T00:00:00Z',
      },
    ],
    evidence: [
      {
        id: 'evidence',
        sourceId: 'source',
        summary: 'Test only',
        locator: 'Fixture',
      },
    ],
    entities: [
      {
        id: 'entity',
        label: 'Test location',
        status: 'REPORTED',
        evidenceIds: ['evidence'],
        validTime: timeRange,
      },
    ],
    observations: [],
    events: [],
    claims: [],
    relationships: [],
    timeline: [{ time: timeRange.start, label: 'Start' }],
  };
}

test('mission state is isolated from input mutation and returned snapshots are immutable', () => {
  const input = fixture();
  const runtime = createSituationRuntime(input);
  input.entities[0].label = 'Changed';
  assert.equal(runtime.getContext().records[0].label, 'Test location');
  assert.throws(() => {
    runtime.getContext().hiddenIds.push('entity');
  });
});
test('state changes notify once, unsubscribe works, reset restores mission and disposal rejects edits', () => {
  const runtime = createSituationRuntime(fixture());
  const seen = [];
  const unsubscribe = runtime.subscribe((context) => seen.push(context));
  runtime.setLens('OBSERVED');
  assert.equal(seen[0].records.length, 0);
  unsubscribe();
  runtime.select('entity');
  runtime.setHidden('entity', true);
  runtime.setTime('2022-02-22T01:00:00Z');
  runtime.reset();
  assert.equal(seen.length, 1);
  assert.equal(runtime.getContext().lens, 'ALL');
  assert.equal(runtime.getContext().selectedId, null);
  assert.equal(runtime.getContext().records.length, 1);
  runtime.destroy();
  assert.throws(() => runtime.setTime('2022-02-22T01:00:00Z'), /disposed/);
});
test('provenance resolves exact sources and rejects nonexistent selections', () => {
  const runtime = createSituationRuntime(fixture());
  assert.throws(() => runtime.inspect(), /Select/);
  runtime.select('entity');
  assert.equal(runtime.inspect().sources[0].id, 'source');
  assert.throws(() => runtime.select('invented'), /Unknown/);
});
test('invalid state actions return failure and leave prior world state intact', async () => {
  const runtime = createSituationRuntime(fixture());
  const actions = createSituationActions(runtime);
  assert.equal(
    (await actions.run('time', { time: '2023-01-01T00:00:00Z' })).ok,
    false,
  );
  assert.equal((await actions.run('lens', { lens: 'imagined' })).ok, false);
  assert.equal(runtime.getContext().time, fixture().timeRange.start);
  assert.equal(runtime.getContext().lens, 'ALL');
});
test('camera action succeeds only after explicit adapter completion', async () => {
  const runtime = createSituationRuntime(fixture());
  const actions = createSituationActions(runtime, {
    go: async () => undefined,
    follow: async () => ({ ok: true, arrived: 'end' }),
    replay: async () => {
      throw new Error('Unavailable route');
    },
  });
  assert.equal((await actions.run('go')).ok, false);
  assert.equal((await actions.run('follow')).arrived, 'end');
  assert.equal((await actions.run('compare')).ok, false);
  assert.match((await actions.run('replay')).error, /Unavailable route/);
});
test('a superseded camera action cannot report success after the replacement completes', async () => {
  let completeFirst;
  let firstSignal;
  const actions = createSituationActions(createSituationRuntime(fixture()), {
    follow: (_, { signal }) => {
      firstSignal = signal;
      return new Promise((resolve) => {
        completeFirst = resolve;
      });
    },
    go: async () => ({ ok: true }),
  });
  const first = actions.run('follow');
  assert.equal((await actions.run('go')).ok, true);
  assert.equal(firstSignal.aborted, true);
  completeFirst({ ok: true });
  assert.equal((await first).cancelled, true);
});
test('manual pause and caller cancellation abort the presentation token', async () => {
  for (const mode of ['pause', 'caller', 'destroy']) {
    const controller = new AbortController();
    let complete;
    let adapterSignal;
    const actions = createSituationActions(createSituationRuntime(fixture()), {
      replay: (_, { signal }) => {
        adapterSignal = signal;
        return new Promise((resolve) => {
          complete = resolve;
        });
      },
    });
    const run = actions.run('replay', {}, { signal: controller.signal });
    if (mode === 'pause') await actions.run('pause');
    if (mode === 'caller') controller.abort();
    if (mode === 'destroy') actions.destroy();
    assert.equal(adapterSignal.aborted, true);
    complete({ ok: true });
    assert.equal((await run).cancelled, true);
  }
});

test('cancellation settles even if a presentation adapter does not finish', async () => {
  const actions = createSituationActions(createSituationRuntime(fixture()), {
    replay: () => new Promise(() => {}),
  });
  const run = actions.run('replay');
  await actions.run('lens', { lens: 'OBSERVED' });
  assert.equal((await run).cancelled, true);
});
