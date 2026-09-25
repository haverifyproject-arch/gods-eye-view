import * as Cesium from 'cesium';
import { isPointerFree } from '../../data/inputOwnership.js';
import { cableDebugRecords } from './geometry.js';

export function createInteraction({
  state,
  screenSpaceEventHandlerFactory,
  contextServices = {},
}) {
  function registerPickEntity(entity, info) {
    entity.__gevTeleGeography = info;
    state._pickByEntity.set(entity, info);
    if (!info.featureId) return;
    const record = cableDebugRecords(
      state._cachedCableJson,
      state._cachedLandingJson,
      {
        kind: info.kind,
        ids: [String(info.featureId)],
        limit: 1,
      },
    )[0];
    if (!record) return;
    info.contextId = record.id;
    state._debugPickCarriers.set(record.id, entity);
    contextServices.registerEntityContext?.(entity, {
      id: record.id,
      layerId: 'telegeography-submarine-cables',
      layerName: 'Submarine Cables',
      source: record.source,
      label: record.label,
      dataSource:
        info.kind === 'cable'
          ? state._cableDataSource
          : state._landingDataSource,
      longitude: record.reference?.lon,
      latitude: record.reference?.lat,
      geometry: record.geometry,
      properties: record,
    });
  }

  function selectById(id) {
    if (!state._enabled || !state._loaded) return null;
    const entity = state._debugPickCarriers.get(id);
    if (!entity || entity.show === false) return null;
    if (state._viewer) state._viewer.selectedEntity = entity;
    return contextServices.selectEntityContext?.(entity) || null;
  }

  function clearContexts() {
    contextServices.clearSelectedEntityContextForLayer?.(
      'telegeography-submarine-cables',
    );
    contextServices.removeEntityContextsForLayer?.(
      'telegeography-submarine-cables',
    );
    state._debugPickCarriers.clear();
  }

  function beginInteraction(viewer) {
    if (state._clickHandler) return;
    state._clickHandler = screenSpaceEventHandlerFactory(viewer.scene.canvas);
    state._clickHandler.setInputAction((click) => {
      // A tool owns the pointer (src/data/inputOwnership.js): yield the click.
      if (!isPointerFree()) return;
      if (!state._enabled) return;
      const picked = viewer.scene.pick(click.position);
      const record = resolvePickRecord(picked);
      if (!record?.reference) return;
      selectById(record.contextId);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function resolvePickRecord(picked) {
    if (!picked) return null;
    const primitive = picked.primitive;
    if (primitive) {
      const primitiveInfo = state._pickByEntity.get(primitive);
      if (primitiveInfo) return primitiveInfo;
      if (primitive.__gevTeleGeography) return primitive.__gevTeleGeography;
      if (
        primitive.id &&
        typeof primitive.id === 'object' &&
        primitive.id.reference
      ) {
        return primitive.id;
      }
    }

    const entity = picked.id;
    if (entity) {
      const entityInfo = state._pickByEntity.get(entity);
      if (entityInfo) return entityInfo;
      if (entity.__gevTeleGeography) return entity.__gevTeleGeography;
      if (entity.id && typeof entity.id === 'object' && entity.id.reference) {
        return entity.id;
      }
    }

    return null;
  }

  function flyToReference(viewer, reference) {
    if (!viewer || !reference) return;
    const destination = Cesium.Cartesian3.fromDegrees(
      reference.lon,
      reference.lat,
      6500,
    );
    viewer.camera.cancelFlight();
    viewer.camera.flyTo({
      destination,
      orientation: {
        heading: viewer.camera.heading || 0,
        pitch: Cesium.Math.toRadians(-52),
        roll: 0,
      },
      duration: 1.35,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }
  return {
    registerPickEntity,
    beginInteraction,
    resolvePickRecord,
    flyToReference,
    selectById,
    clearContexts,
  };
}
