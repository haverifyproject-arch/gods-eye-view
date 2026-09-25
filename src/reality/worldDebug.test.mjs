import test from 'node:test';
import assert from 'node:assert/strict';
import * as Cesium from 'cesium';
import { createWorldDebug } from './worldDebug.js';
import {
  registerEntityContext,
  selectEntityContext,
} from '../data/contextStore.js';

const defer = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const cable = (id = 'cable') => ({
  id,
  label: id,
  kind: 'cable',
  source: 'Fixture',
  geometry: {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [0.1, 0.1],
    ],
  },
});
function harness({
  fetch = async () => [cable()],
  annotate,
  earthquakes = false,
} = {}) {
  const previousWindow = globalThis.window;
  globalThis.window = new EventTarget();
  const visible = new Set([
    'test-objects',
    ...(earthquakes ? ['earthquakes'] : []),
  ]);
  const changes = [];
  const visibilityListeners = new Set();
  const marks = new Set(['user-mark']);
  let serial = 0;
  const dataManager = {
    layers: new Map([
      [
        'telegeography-submarine-cables',
        { module: { loadDebugRecords: fetch } },
      ],
      ['earthquakes', { module: { getAnalystRecords: () => [] } }],
    ]),
    isEnabled: (id) => visible.has(id),
    async setEnabled(id, enabled, options = {}) {
      changes.push({ id, enabled, origin: options.origin });
      if (enabled) visible.add(id);
      else visible.delete(id);
      for (const listener of visibilityListeners)
        listener({ layerId: id, enabled, ...options });
    },
    subscribeVisibilityRequests(fn) {
      visibilityListeners.add(fn);
      return () => visibilityListeners.delete(fn);
    },
  };
  const annotations = {
    async annotate(specs, options) {
      if (annotate) return annotate(specs, options, marks);
      const ids = specs.map(() => `debug-${++serial}`);
      ids.forEach((id) => marks.add(id));
      return { ids };
    },
    removeOwned() {
      for (const id of marks) if (id.startsWith('debug-')) marks.delete(id);
    },
    remove(ids) {
      ids.forEach((id) => marks.delete(id));
    },
    setVisible() {},
  };
  const viewer = {
    scene: {
      canvas: { clientWidth: 100, clientHeight: 100 },
      globe: { ellipsoid: Cesium.Ellipsoid.WGS84 },
    },
    camera: { pickEllipsoid: () => Cesium.Cartesian3.fromDegrees(0, 0) },
  };
  const api = createWorldDebug({
    viewer,
    dataManager,
    annotations,
    styleManager: {},
  });
  const select = (id) => {
    const entity = { show: true };
    registerEntityContext(entity, {
      id,
      label: id,
      layerId: 'test-objects',
      latitude: 0,
      longitude: 0,
    });
    selectEntityContext(entity);
  };
  select('first');
  return {
    api,
    marks,
    dataManager,
    changes,
    visible,
    select,
    close() {
      api.destroy();
      globalThis.window = previousWindow;
    },
  };
}

test('source failure remains explicit and does not invent relationships', async () => {
  const h = harness({
    fetch: async () => {
      throw new Error('provider unavailable');
    },
  });
  try {
    await h.api.run({ action: 'debug' });
    assert.ok(
      h.api
        .getState()
        .errors.some((error) => error.includes('provider unavailable')),
    );
    assert.equal(h.api.getState().relationships.length, 0);
    assert.ok(h.marks.has('user-mark'));
  } finally {
    h.close();
  }
});

test('clear during pending annotation removes its late marks and leaves user marks', async () => {
  const started = defer();
  const finished = defer();
  const h = harness({
    annotate: async (_specs, _options, marks) => {
      started.resolve();
      await finished.promise;
      marks.add('debug-late');
      return { ids: ['debug-late'] };
    },
  });
  try {
    const running = h.api.run({ action: 'debug' });
    await started.promise;
    await h.api.run({ action: 'clear' });
    finished.resolve();
    await running;
    assert.equal(h.api.getState().status, 'idle');
    assert.deepEqual([...h.marks], ['user-mark']);
    assert.equal(h.visible.has('earthquakes'), false);
  } finally {
    h.close();
  }
});

test('a new investigation supersedes an older pending source result', async () => {
  const first = defer();
  let count = 0;
  const h = harness({
    fetch: () =>
      ++count === 1 ? first.promise : Promise.resolve([cable('new-cable')]),
  });
  try {
    const old = h.api.run({ action: 'debug' });
    h.select('second');
    await h.api.run({ action: 'debug' });
    first.resolve([cable('old-cable')]);
    await old;
    assert.equal(h.api.getState().subject.id, 'second');
    assert.ok(
      h.api
        .getState()
        .relationships.every((record) => record.recordId !== 'old-cable'),
    );
  } finally {
    h.close();
  }
});

test('changing selection while a source request runs cannot publish old selection as ready', async () => {
  const pending = defer();
  const h = harness({ fetch: () => pending.promise });
  try {
    const old = h.api.run({ action: 'debug' });
    h.select('second');
    pending.resolve([cable('old-cable')]);
    await old;
    const state = h.api.getState();
    assert.ok(
      state.status !== 'ready' || state.subject?.id === state.selected?.id,
      'A ready investigation must not silently describe the superseded selection',
    );
  } finally {
    h.close();
  }
});

test('clear preserves layers already enabled by the user and later user ownership', async () => {
  for (const alreadyEnabled of [true, false]) {
    const h = harness({ earthquakes: alreadyEnabled });
    try {
      await h.api.run({ action: 'debug' });
      if (!alreadyEnabled)
        await h.dataManager.setEnabled('earthquakes', true, { origin: 'user' });
      await h.api.run({ action: 'clear' });
      assert.ok(h.visible.has('earthquakes'));
      assert.ok(h.visible.has('test-objects'));
      assert.ok(h.marks.has('user-mark'));
    } finally {
      h.close();
    }
  }
});

test('large reference results produce bounded relationships and annotation work', async () => {
  let specs = 0;
  const h = harness({
    fetch: async () =>
      Array.from({ length: 3000 }, (_, index) => cable(`cable-${index}`)),
    annotate: async (batch) => {
      specs += batch.length;
      return { ids: [] };
    },
  });
  try {
    const output = await h.api.run({ action: 'debug' });
    assert.ok(output.relationships.length <= 16);
    assert.ok(specs <= 48);
    assert.ok(JSON.stringify(output).length < 20000);
  } finally {
    h.close();
  }
});

test('a pending Another cannot select after Clear or a newer native selection', async () => {
  for (const replace of ['clear', 'selection']) {
    const h = harness();
    const pending = defer();
    let selected = 0;
    h.dataManager.layers.set('internet-health', {
      module: {
        getDebugRecords: () => [{ id: 'outage', label: 'Outage' }],
        selectById: () => selected++,
      },
    });
    const original = h.dataManager.setEnabled;
    h.dataManager.setEnabled = async (id, value, options) => {
      if (id === 'internet-health' && value) await pending.promise;
      return original(id, value, options);
    };
    try {
      const old = h.api.run({ action: 'another' });
      await Promise.resolve();
      if (replace === 'clear') await h.api.run({ action: 'clear' });
      else h.select('new-choice');
      pending.resolve();
      await old;
      assert.equal(selected, 0);
    } finally {
      pending.resolve();
      h.close();
    }
  }
});

test('voice cancellation prevents late investigation annotations', async () => {
  const pending = defer();
  const h = harness({ fetch: () => pending.promise });
  const controller = new AbortController();
  try {
    const work = h.api.run({ action: 'debug' }, { signal: controller.signal });
    controller.abort();
    pending.resolve([cable()]);
    await work;
    assert.equal(h.api.getState().relationships.length, 0);
    assert.deepEqual([...h.marks], ['user-mark']);
  } finally {
    h.close();
  }
});

test('repeated Clear retains the native transition barrier before a new Debug', async () => {
  const h = harness();
  const pending = defer();
  try {
    await h.api.run({ action: 'debug' });
    const original = h.dataManager.setEnabled;
    let reenabled = 0;
    h.dataManager.setEnabled = async (id, enabled, options) => {
      if (id === 'earthquakes' && !enabled) await pending.promise;
      if (id === 'earthquakes' && enabled) reenabled++;
      return original(id, enabled, options);
    };
    const first = h.api.run({ action: 'clear' });
    const second = h.api.run({ action: 'clear' });
    const next = h.api.run({ action: 'debug' });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(reenabled, 0);
    pending.resolve();
    await Promise.all([first, second, next]);
    assert.equal(reenabled, 1);
    assert.equal(h.api.getState().status, 'ready');
  } finally {
    pending.resolve();
    h.close();
  }
});

test('How do we know retains the inspected relationship until native selection changes', async () => {
  const h = harness();
  try {
    await h.api.run({ action: 'debug' });
    const relation = h.api.getState().relationships[0];
    await h.api.run({ action: 'sources', id: relation.id });
    await h.api.run({ action: 'sources' });
    assert.equal(h.api.getState().inspected.id, relation.id);
    await h.api.run({ action: 'clear' });
    await h.api.run({ action: 'sources' });
    h.select('second');
    assert.equal(h.api.getState().inspected, null);
  } finally {
    h.close();
  }
});
