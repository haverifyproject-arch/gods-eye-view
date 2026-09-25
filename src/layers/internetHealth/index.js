import * as Cesium from 'cesium';
import { INTERNET_HEALTH_ID, internetAnalystRecord } from './model.js';

/** One independently switchable native layer, including its acquisition and selected-context lifetime. */
export function createInternetHealthLayer({
  source,
  overlayHost,
  context,
  screenSpaceEventHandlerFactory,
  isPointerFree = () => true,
} = {}) {
  if (typeof source?.getSnapshot !== 'function' || !overlayHost || !context)
    throw new TypeError(
      'Internet Health requires source, overlays and native context operations',
    );
  let viewer, dataSource, handler, request, snapshot, releaseSelection;
  let enabled = false;
  let destroyed = false;
  let error = null;
  let records = new Map();
  const entities = new Map();
  const highlight = () => {
    const active = viewer?.selectedEntity?.__internetHealthId;
    for (const entity of dataSource?.entities.values || []) {
      const isSelected = entity.__internetHealthId === active;
      entity.polygon.material = Cesium.Color.fromCssColorString(
        isSelected ? '#c9f5ff' : '#68c5e6',
      ).withAlpha(isSelected ? 0.46 : 0.3);
      entity.polygon.outlineColor = Cesium.Color.fromCssColorString(
        isSelected ? '#ffffff' : '#7ddbf9',
      ).withAlpha(isSelected ? 1 : 0.85);
    }
    viewer?.scene.requestRender();
  };
  const selected = () => context.getSelectedEntityContext?.()?.id;
  const register = (record, entity) =>
    context.registerEntityContext(entity, {
      id: record.id,
      layerId: INTERNET_HEALTH_ID,
      layerName: 'Internet Health',
      label: record.label,
      source: 'IODA',
      dataSource,
      latitude: record.displayAnchor.latitude,
      longitude: record.displayAnchor.longitude,
      properties: internetAnalystRecord(record),
    });
  const clearContext = () => {
    context.clearSelectedEntityContextForLayer(INTERNET_HEALTH_ID);
    context.removeEntityContextsForLayer(INTERNET_HEALTH_ID);
  };
  const selectById = (id) => {
    const entity = entities.get(id);
    if (!enabled || !entity) return false;
    viewer.selectedEntity = entity;
    highlight();
    context.selectEntityContext(entity);
    viewer.scene.requestRender();
    return true;
  };
  const publish = () => {
    overlayHost.setEntries(
      INTERNET_HEALTH_ID,
      [...records.values()].map((record) => ({
        id: record.id,
        position: entities.get(record.id).__localBaseCartesian,
        title: `${record.name} · anomaly`,
        variant: 'label',
        accent: '#9edcff',
        priority: 100,
        collisionGroup: 'ambient-label',
        paintLane: 'ambient-label',
        interactive: false,
        horizonCull: true,
        terrainOcclusion: false,
        gapPx: 15,
        placement: 'above',
        verticalOnly: true,
      })),
      { cohortLimit: 48, collisionCapacity: 48, moving: false },
    );
  };
  return {
    id: INTERNET_HEALTH_ID,
    name: 'Internet Health',
    icon: '◎',
    source: 'IODA',
    updateInterval: 300000,
    init(target) {
      if (viewer) throw new Error('Internet Health already initialized');
      viewer = target;
      dataSource = new Cesium.CustomDataSource(INTERNET_HEALTH_ID);
      dataSource.show = false;
      viewer.dataSources.add(dataSource);
      releaseSelection =
        viewer.selectedEntityChanged?.addEventListener(highlight);
      overlayHost.setVisible(INTERNET_HEALTH_ID, false);
      handler = screenSpaceEventHandlerFactory?.(viewer.scene.canvas);
      handler?.setInputAction((click) => {
        if (!enabled || !isPointerFree()) return;
        const picked = viewer.scene.pick(click.position)?.id;
        if (picked?.__internetHealthId) selectById(picked.__internetHealthId);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    enable() {
      if (destroyed) return false;
      enabled = true;
      dataSource.show = true;
      for (const record of records.values())
        register(record, entities.get(record.id));
      overlayHost.setVisible(INTERNET_HEALTH_ID, true);
      publish();
      viewer.scene.requestRender();
    },
    disable() {
      enabled = false;
      if (viewer?.selectedEntity?.__internetHealthId)
        viewer.selectedEntity = undefined;
      request?.abort();
      request = null;
      if (dataSource) dataSource.show = false;
      clearContext();
      overlayHost.clearSource(INTERNET_HEALTH_ID);
      overlayHost.setVisible(INTERNET_HEALTH_ID, false);
      viewer?.scene.requestRender();
    },
    async update() {
      if (!enabled || destroyed) return false;
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const next = await source.getSnapshot({ signal: controller.signal });
        if (
          controller.signal.aborted ||
          request !== controller ||
          !enabled ||
          destroyed
        )
          return false;
        const selectedId = selected();
        const nextRecords = new Map(
          next.records.map((record) => [record.id, record]),
        );
        dataSource.entities.removeAll();
        entities.clear();
        for (const record of nextRecords.values()) {
          const polygons =
            record.geometry.type === 'Polygon'
              ? [record.geometry.coordinates]
              : record.geometry.coordinates;
          for (const [index, rings] of polygons.entries()) {
            const hierarchy = (ring) =>
              Cesium.Cartesian3.fromDegreesArray(
                ring.flatMap(([lon, lat]) => [lon, lat]),
              );
            const entity = dataSource.entities.add({
              id: `${record.id}:${index}`,
              name: record.label,
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(
                  hierarchy(rings[0]),
                  rings
                    .slice(1)
                    .map(
                      (ring) => new Cesium.PolygonHierarchy(hierarchy(ring)),
                    ),
                ),
                material:
                  Cesium.Color.fromCssColorString('#68c5e6').withAlpha(0.3),
                outline: true,
                outlineColor:
                  Cesium.Color.fromCssColorString('#7ddbf9').withAlpha(0.8),
                height: 0,
              },
              position: Cesium.Cartesian3.fromDegrees(
                record.displayAnchor.longitude,
                record.displayAnchor.latitude,
              ),
            });
            entity.__internetHealthId = record.id;
            entity.__localBaseCartesian = Cesium.Cartesian3.fromDegrees(
              record.displayAnchor.longitude,
              record.displayAnchor.latitude,
            );
            if (index === 0) entities.set(record.id, entity);
          }
          register(record, entities.get(record.id));
        }
        context.removeEntityContextsForLayer(INTERNET_HEALTH_ID, {
          retainIds: new Set(nextRecords.keys()),
        });
        records = nextRecords;
        snapshot = next;
        error = null;
        if (selectedId && entities.has(selectedId))
          viewer.selectedEntity = entities.get(selectedId);
        else if (viewer.selectedEntity?.__internetHealthId)
          viewer.selectedEntity = undefined;
        highlight();
        publish();
        viewer.scene.requestRender();
        return true;
      } catch (failure) {
        if (!controller.signal.aborted && request === controller && enabled)
          error = failure?.message || 'Internet Health unavailable';
        return false;
      } finally {
        if (request === controller) request = null;
      }
    },
    selectById,
    getDebugRecords() {
      return enabled ? structuredClone([...records.values()]) : [];
    },
    getAnalystRecords(max = 500) {
      return enabled
        ? structuredClone(
            [...records.values()]
              .slice(0, Math.max(0, Math.min(500, Number(max) || 0)))
              .map(internetAnalystRecord),
          )
        : [];
    },
    getStats() {
      return {
        count: records.size,
        lastUpdate: snapshot?.retrievedAt || null,
        loading: Boolean(request),
        error,
        source: 'IODA',
        sourceLimited: snapshot?.sourceLimited || false,
        excluded: snapshot?.excluded || 0,
        window: snapshot?.window || null,
        coverage:
          'Country-level detections; not confirmed nationwide blackouts',
      };
    },
    destroy() {
      if (destroyed) return;
      this.disable();
      destroyed = true;
      handler?.destroy();
      releaseSelection?.();
      releaseSelection = null;
      handler = null;
      if (dataSource) viewer.dataSources.remove(dataSource, true);
      dataSource = null;
      records.clear();
      entities.clear();
      snapshot = null;
    },
  };
}
