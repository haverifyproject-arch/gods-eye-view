import test from 'node:test';
import assert from 'node:assert/strict';
import { cableDebugRecords } from './geometry.js';
import { createInteraction } from './interaction.js';
import { createLifecycle } from './lifecycle.js';

const cables = {
  features: [
    {
      properties: { id: 'test-cable', name: 'Test cable' },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [179, -20],
            [180, -20],
          ],
          [
            [-180, -20],
            [-175, -21],
          ],
        ],
      },
    },
  ],
};
const landings = {
  features: [
    {
      properties: { id: 'test-landing', name: 'Test landing' },
      geometry: { type: 'Point', coordinates: [-175, -21] },
    },
  ],
};

test('bounded references preserve route parts, source rights and no invented memberships', () => {
  const records = cableDebugRecords(cables, landings);
  assert.equal(records.length, 2);
  assert.deepEqual(records[0].geometry, cables.features[0].geometry);
  assert.equal(records[0].status, 'CURRENT_REFERENCE');
  assert.match(records[0].rights, /CC BY-NC-SA/);
  assert.deepEqual(records[0].associations, []);
  records[0].geometry.coordinates[0][0][0] = 1;
  assert.equal(cables.features[0].geometry.coordinates[0][0][0], 179);
  assert.equal(cableDebugRecords(cables, landings, { limit: 0 }).length, 0);
  assert.equal(
    cableDebugRecords(cables, landings, { ids: ['test-landing'], limit: 1 })[0]
      .kind,
    'landing-point',
  );
});

test('shared selection changes without moving the camera and disable blocks stale selection', () => {
  const state = {
    _enabled: true,
    _loaded: true,
    _cachedCableJson: cables,
    _cachedLandingJson: landings,
    _pickByEntity: new WeakMap(),
    _debugPickCarriers: new Map(),
    _viewer: {
      camera: {
        flyTo() {
          assert.fail('Selection must not fly');
        },
      },
    },
  };
  let metadata;
  let selected;
  const interaction = createInteraction({
    state,
    contextServices: {
      registerEntityContext(entity, record) {
        metadata = record;
        entity.__gevContextId = record.id;
      },
      selectEntityContext(entity) {
        selected = entity;
        return metadata;
      },
    },
  });
  const entity = { show: true };
  interaction.registerPickEntity(entity, {
    kind: 'cable',
    featureId: 'test-cable',
  });
  assert.equal(interaction.selectById(metadata.id).id, metadata.id);
  assert.equal(selected, entity);
  assert.equal(state._viewer.selectedEntity, entity);
  state._enabled = false;
  assert.equal(interaction.selectById(metadata.id), null);
});

test('reference-only loading does not enable or create render sources and reuses cached data', async () => {
  const state = { _debugGeneration: 0, _enabled: false };
  let calls = 0;
  const layer = createLifecycle({
    state,
    parts: {},
    source: {
      label: 'TeleGeography',
      async fetch() {
        calls++;
        return { cables, landingPoints: landings };
      },
    },
  });
  assert.equal((await layer.loadDebugRecords()).length, 2);
  assert.equal(
    (await layer.loadDebugRecords({ kind: 'landing-point' })).length,
    1,
  );
  assert.equal(calls, 1);
  assert.equal(state._enabled, false);
  assert.equal(state._cableDataSource, undefined);
});
