import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalGeoJsonLayer } from './localGeojsonCore.js';

const point = {
  type: 'Feature',
  id: 'facility',
  properties: { name: 'Test facility' },
  geometry: { type: 'Point', coordinates: [12, 34] },
};
function create() {
  return createLocalGeoJsonLayer(
    {
      id: 'local-datacenters',
      name: 'Datacenters',
      color: '#00ffff',
      url: '/facilities.geojsonl',
    },
    {
      overlayHost: { clearSource() {}, setEntries() {}, setVisible() {} },
      registerEntityContext() {
        assert.fail('Reference loading must not register rendered entities');
      },
      selectEntityContext() {},
      clearSelectedEntityContextForLayer() {},
      removeEntityContextsForLayer() {},
      governorRequestRender() {},
    },
  );
}
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

test('facility reference query caches source points without enabling or rendering a layer', async (t) => {
  const layer = create();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return { ok: true, text: async () => `${JSON.stringify(point)}\n` };
  });
  const records = await layer.loadDebugRecords({ limit: 10 });
  assert.equal(records[0].lat, 34);
  assert.equal(records[0].lon, 12);
  assert.equal(records[0].evidenceState, 'CURRENT_REFERENCE');
  assert.equal(records[0].source, 'OpenStreetMap');
  assert.equal(records[0].sourceDate, null);
  assert.equal(layer.getStats().count, 0);
  assert.deepEqual(layer.getAnalystRecords(), []);
  await layer.loadDebugRecords();
  assert.equal(calls, 1);
  assert.deepEqual(layer.getDebugRecords({ limit: 0 }), []);
  layer.destroy();
});

for (const ending of ['abort', 'destroy']) {
  test(`${ending} during reference body read prevents late cache publication`, async (t) => {
    const layer = create();
    const entered = deferred();
    const release = deferred();
    const controller = new AbortController();
    t.mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      text: async () => {
        entered.resolve();
        await release.promise;
        return JSON.stringify(point);
      },
    }));
    const running = layer.loadDebugRecords({ signal: controller.signal });
    await entered.promise;
    if (ending === 'abort') controller.abort();
    else layer.destroy();
    release.resolve();
    await assert.rejects(running, { name: 'AbortError' });
    assert.deepEqual(layer.getDebugRecords(), []);
    layer.destroy();
  });
}

test('facility queries omit non-point and invalid geography instead of inventing coordinates', async (t) => {
  const layer = create();
  const features = [
    point,
    { ...point, geometry: { type: 'Point', coordinates: [181, 34] } },
    {
      ...point,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      },
    },
  ];
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    text: async () =>
      features.map((feature) => JSON.stringify(feature)).join('\n'),
  }));
  assert.equal((await layer.loadDebugRecords()).length, 1);
  layer.destroy();
});
