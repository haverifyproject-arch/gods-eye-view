import assert from 'node:assert/strict';
import test from 'node:test';
import { createEarthquakesLayer } from './index.js';
import { createUsgsEarthquakeSource } from './source.js';
function harness(source, options = {}) {
  const sources = [];
  const events = [];
  const viewer = {
    scene: { canvas: {}, requestRender() {} },
    dataSources: {
      add(value) {
        sources.push(value);
      },
      remove(value) {
        sources.splice(sources.indexOf(value), 1);
      },
    },
  };
  const layer = createEarthquakesLayer({
    ...options,
    source,
    overlayHost: {
      setEntries(...args) {
        events.push(args);
      },
      setVisible() {},
      clearSource() {},
    },
  });
  layer.init(viewer);
  layer.enable(viewer);
  return { layer, viewer, sources, events };
}
const row = {
  stableId: 'event-a',
  usgsId: 'event-a',
  lon: 30,
  lat: 20,
  depthKm: 3,
  mag: 4,
  place: 'Fixture',
  time: 1000,
};
test('earthquake clicks publish native context without navigation and expire on disable', async () => {
  const stored = new Map();
  let selected = null,
    click,
    destroyed = 0;
  const context = {
    registerEntityContext(entity, record) {
      stored.set(record.id, { ...record, entity });
    },
    selectEntityContext(entity) {
      selected = entity.id;
    },
    getSelectedEntityContext() {
      return stored.get(selected);
    },
    clearSelectedEntityContextForLayer() {
      selected = null;
    },
    removeEntityContextsForLayer(_id, { retainIds } = {}) {
      for (const id of stored.keys())
        if (!retainIds?.has(id)) stored.delete(id);
    },
  };
  const h = harness(
    { getSnapshot: async () => [row] },
    {
      context,
      screenSpaceEventHandlerFactory: () => ({
        setInputAction(fn) {
          click = fn;
        },
        destroy() {
          destroyed++;
        },
      }),
    },
  );
  await h.layer.update();
  h.viewer.scene.pick = () => ({ id: h.sources[0].entities.values[0] });
  click({ position: {} });
  assert.equal(selected, 'earthquake:event-a');
  assert.equal(stored.get(selected).latitude, 20);
  assert.equal(stored.get(selected).properties.evidenceState, 'OBSERVED');
  const old = h.viewer.selectedEntity;
  await h.layer.update();
  assert.notEqual(h.viewer.selectedEntity, old);
  assert.equal(stored.get(selected).entity, h.viewer.selectedEntity);
  h.layer.disable();
  assert.equal(h.viewer.selectedEntity, undefined);
  assert.equal(stored.size, 0);
  h.layer.destroy();
  h.layer.destroy();
  assert.equal(destroyed, 1);
});
test('late refresh cannot publish after disable, re-enable, or destroy', async () => {
  for (const action of ['disable', 'destroy']) {
    let resolve, signal;
    const h = harness({
      getSnapshot(options) {
        signal = options.signal;
        return new Promise((done) => {
          resolve = done;
        });
      },
    });
    const pending = h.layer.update(h.viewer);
    h.layer[action](h.viewer);
    assert.equal(signal.aborted, true);
    if (action === 'disable') h.layer.enable(h.viewer);
    resolve([row]);
    assert.equal(await pending, false);
    assert.equal(h.layer.getStats().count, 0);
    assert.equal(h.events.length, 0);
    h.layer.destroy(h.viewer);
  }
});
test('two displays own separate data sources and destruction', async () => {
  const a = harness({ getSnapshot: async () => [row] });
  const b = harness({ getSnapshot: async () => [] });
  await a.layer.update(a.viewer);
  await b.layer.update(b.viewer);
  assert.equal(a.layer.getStats().count, 1);
  assert.equal(b.layer.getStats().count, 0);
  a.layer.destroy();
  assert.equal(a.sources.length, 0);
  assert.equal(b.sources.length, 1);
  b.layer.destroy();
});
test('USGS body completion honors cancellation even with an uncooperative transport', async () => {
  const abort = new AbortController();
  const source = createUsgsEarthquakeSource({
    fetchImpl: async () => ({
      ok: true,
      json: async () => {
        abort.abort();
        return { features: [] };
      },
    }),
  });
  await assert.rejects(source.getSnapshot({ signal: abort.signal }), {
    name: 'AbortError',
  });
});
