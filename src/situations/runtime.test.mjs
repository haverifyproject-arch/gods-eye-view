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

function graphFixture() {
  const input = fixture();
  const base = input.entities[0];
  for (const id of ['middle', 'end', 'isolated'])
    input.entities.push({ ...base, id, label: id });
  input.relationships = [
    {
      ...base,
      id: 'first',
      from: 'entity',
      to: 'middle',
      type: 'ASSOCIATED_WITH',
    },
    {
      ...base,
      id: 'second',
      from: 'middle',
      to: 'end',
      type: 'ASSOCIATED_WITH',
    },
    {
      ...base,
      id: 'cycle',
      from: 'end',
      to: 'entity',
      type: 'ASSOCIATED_WITH',
    },
  ];
  return input;
}

test('trace traverses a visible component without inventing direction or including isolated records', () => {
  const runtime = createSituationRuntime(graphFixture());
  const before = runtime.getContext();
  const traced = runtime.trace({ id: 'end' });
  assert.deepEqual(
    traced.records.map((record) => record.id),
    ['entity', 'middle', 'end'],
  );
  assert.deepEqual(
    traced.relationships.map((edge) => edge.id),
    ['first', 'second', 'cycle'],
  );
  assert.equal(traced.relationships[0].from, 'entity');
  assert.equal(traced.relationships[0].to, 'middle');
  assert.equal(traced.relationships[0].type, 'ASSOCIATED_WITH');
  assert.deepEqual(runtime.getContext(), before);
  assert.throws(() => traced.relationships.push({}));
  assert.equal(
    runtime.inspect(traced.relationships[0].id).sources[0].id,
    'source',
  );
  assert.deepEqual(runtime.trace({ id: 'first' }).records, traced.records);
});

test('trace honors filtered, hidden and temporally absent endpoints and relationships', () => {
  const input = graphFixture();
  input.relationships = input.relationships.slice(0, 2);
  input.relationships[1].validTime = {
    ...input.timeRange,
    start: '2022-02-01T00:00:00Z',
  };
  const runtime = createSituationRuntime(input);
  assert.deepEqual(
    runtime.trace({ id: 'entity' }).relationships.map((edge) => edge.id),
    ['first'],
  );
  assert.deepEqual(runtime.trace({ id: 'second' }).records, []);
  runtime.setTime('2022-02-02T00:00:00Z');
  assert.equal(runtime.trace({ id: 'entity' }).relationships.length, 2);
  runtime.setHidden('first', true);
  assert.equal(runtime.trace({ id: 'entity' }).relationships.length, 0);
  runtime.setHidden('first', false);
  runtime.setHidden('middle', true);
  assert.equal(runtime.trace({ id: 'entity' }).relationships.length, 0);
  assert.deepEqual(runtime.trace({ id: 'middle' }).records, []);
  runtime.setHidden('middle', false);
  runtime.setLens('OBSERVED');
  assert.deepEqual(runtime.trace({ id: 'entity' }).relationships, []);
  assert.deepEqual(runtime.trace({ id: 'entity' }).records, []);
});

test('trace defaults to selection and rejects missing, unknown or disposed requests', () => {
  const runtime = createSituationRuntime(graphFixture());
  assert.throws(() => runtime.trace(), /Select/);
  assert.throws(() => runtime.trace({ id: 'invented' }), /Select/);
  runtime.select('first');
  assert.equal(runtime.trace().relationships.length, 3);
  runtime.destroy();
  assert.throws(() => runtime.trace({ id: 'entity' }), /disposed/);
});

test('reset explicitly notifies presentations to discard transient annotations', () => {
  const runtime = createSituationRuntime(fixture());
  const events = [];
  runtime.subscribe((snapshot, event) => events.push({ snapshot, event }));
  runtime.setLens('REPORTED');
  runtime.reset();
  assert.equal(events[0].event, undefined);
  assert.equal(events[1].event, 'reset');
  assert.equal(events[1].snapshot.lens, 'ALL');
});
