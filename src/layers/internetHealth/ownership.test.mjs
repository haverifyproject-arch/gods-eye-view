import test from 'node:test';
import assert from 'node:assert/strict';
import { createInternetHealthLayer } from './index.js';
import { snapshot } from '../../testSupport/internetHealth.mjs';
function setup(source) {
  const stored = new Map();
  let selection = null;
  const context = {
    registerEntityContext(entity, record) {
      stored.set(record.id, { ...record, entity });
    },
    selectEntityContext(entity) {
      selection = entity.__internetHealthId;
    },
    getSelectedEntityContext() {
      return stored.get(selection);
    },
    clearSelectedEntityContextForLayer() {
      selection = null;
    },
    removeEntityContextsForLayer(_layer, { retainIds } = {}) {
      for (const id of stored.keys())
        if (!retainIds?.has(id)) stored.delete(id);
    },
  };
  const viewer = {
    dataSources: { add() {}, remove() {} },
    scene: { canvas: {}, requestRender() {} },
  };
  const layer = createInternetHealthLayer({
    source,
    context,
    overlayHost: { setEntries() {}, setVisible() {}, clearSource() {} },
  });
  layer.init(viewer);
  layer.enable();
  return { layer, viewer, stored };
}
test('disable aborts a pending source and rejects a late result after re-enable', async () => {
  let resolve, signal;
  const h = setup({
    getSnapshot(options) {
      signal = options.signal;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  const pending = h.layer.update();
  h.layer.disable();
  h.layer.enable();
  resolve(snapshot());
  assert.equal(await pending, false);
  assert.equal(signal.aborted, true);
  assert.deepEqual(h.layer.getDebugRecords(), []);
  h.layer.destroy();
});
test('native selection is replaced safely on refresh and removed on disable without an extra camera', async () => {
  const h = setup({ getSnapshot: async () => snapshot() });
  await h.layer.update();
  assert.equal(h.layer.selectById('ioda-country-AA'), true);
  const original = h.viewer.selectedEntity;
  await h.layer.update();
  assert.notEqual(h.viewer.selectedEntity, original);
  assert.equal(h.stored.get('ioda-country-AA').entity, h.viewer.selectedEntity);
  const exported = h.layer.getDebugRecords();
  exported[0].name = 'mutated';
  assert.notEqual(h.layer.getDebugRecords()[0].name, 'mutated');
  h.layer.disable();
  assert.equal(h.viewer.selectedEntity, undefined);
  assert.equal(h.stored.size, 0);
  assert.deepEqual(h.layer.getAnalystRecords(), []);
  h.layer.destroy();
  h.layer.destroy();
});
