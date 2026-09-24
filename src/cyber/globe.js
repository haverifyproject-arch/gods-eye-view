import * as Cesium from 'cesium';
import { createApplicationViewer } from '../app/viewer.js';

/** Own the upstream viewer and render only evidenced reference geography. */
export async function createScenarioGlobe({
  container,
  creditContainer,
  geometry,
  country,
  camera,
  onSelect,
  places = [],
}) {
  const viewer = createApplicationViewer({ container, creditContainer });
  try {
    viewer.cesiumWidget.creditDisplay.addStaticCredit(
      new Cesium.Credit('Natural Earth · reference cartography', true),
    );
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#142631');
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#080f16');
    viewer.scene.skyBox.show = false;
    viewer.scene.sun.show = false;
    viewer.scene.moon.show = false;
    viewer.scene.globe.enableLighting = false;
    // Keep frames flowing during initial tile/primitive preparation. A viewer can
    // initialize before its asynchronous globe resources have produced a frame.
    viewer.scene.requestRenderMode = false;
    viewer.scene.maximumRenderTimeChange = Infinity;
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);
    const imagery = await Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'),
      { maximumLevel: 2 },
    );
    const base = viewer.imageryLayers.addImageryProvider(imagery);
    base.brightness = 0.65;
    base.saturation = 0.35;
    base.contrast = 1.15;
    const source = await Cesium.GeoJsonDataSource.load(
      {
        type: 'Feature',
        properties: { name: `${country} · reference geography` },
        geometry: { type: geometry.type, coordinates: geometry.coordinates },
      },
      {
        stroke: Cesium.Color.fromCssColorString('#6be0ca'),
        strokeWidth: 2,
        fill: Cesium.Color.fromCssColorString('#5edbc3').withAlpha(0.15),
        clampToGround: false,
      },
    );
    await viewer.dataSources.add(source);
    const markers = new Map();
    for (const place of places) {
      const entity = viewer.entities.add({
        id: place.id,
        position: Cesium.Cartesian3.fromDegrees(...place.coordinates, 10000),
        point: {
          pixelSize: 12,
          color: Cesium.Color.fromCssColorString('#6be0ca'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: place.name + '\nCITY REFERENCE',
          font: '13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor:
            Cesium.Color.fromCssColorString('#102431').withAlpha(0.9),
          pixelOffset: new Cesium.Cartesian2(0, -32),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      markers.set(place.id, entity);
    }
    const connection =
      places.length === 2
        ? viewer.entities.add({
            id: 'pipeline-context',
            polyline: {
              positions: places.map((p) =>
                Cesium.Cartesian3.fromDegrees(...p.coordinates, 20000),
              ),
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#ffc777'),
                dashLength: 18,
              }),
            },
          })
        : null;
    const fly = (destination) => {
      viewer.camera.cancelFlight();
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(...destination),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 1.4,
      });
    };
    for (const entity of source.entities.values) {
      if (entity.polygon) {
        entity.polygon.height = 1500;
        entity.polygon.outline = false;
        const positions = entity.polygon.hierarchy.getValue().positions;
        entity.polyline = {
          positions: [...positions, positions[0]],
          width: 2,
          material: Cesium.Color.fromCssColorString('#6be0ca'),
        };
      }
    }
    const focus = (selected = true) =>
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          camera[0],
          camera[1],
          camera[2] * (selected ? 0.52 : 1),
        ),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 0.8,
      });
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(...camera),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
    });
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
      const picked = viewer.scene.pick(event.position);
      if (picked?.id && markers.has(picked.id.id)) onSelect(picked.id.id);
      else if (picked?.id === connection) onSelect('pipeline');
      else if (picked?.id && source.entities.contains(picked.id)) onSelect();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    viewer.scene.canvas.setAttribute(
      'aria-label',
      `Interactive 3D globe. ${country} reference outline. Use the ${country} button for keyboard selection.`,
    );
    const remove = viewer.scene.postRender.addEventListener(() => {
      if (!viewer.scene.globe.tilesLoaded) return;
      container.dataset.rendered = 'true';
      viewer.scene.requestRenderMode = true;
      remove();
    });
    return {
      viewer,
      focus,
      inspect(id) {
        for (const [key, entity] of markers)
          entity.point.pixelSize = key === id ? 20 : 12;
        const place = places.find((p) => p.id === id);
        fly(place ? [...place.coordinates, 1500000] : [-84.5, 35.3, 6200000]);
        container.dataset.focus = id || 'pipeline';
      },
      setMilestone(id) {
        if (connection)
          connection.polyline.material =
            new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString(
                id === 'event-recovery' ? '#6be0ca' : '#ffc777',
              ),
              dashLength: 18,
            });
        container.dataset.milestone = id;
        viewer.scene.requestRender();
      },
      intro() {
        fly([-84.5, 35.3, 6200000]);
      },
      highlight(active) {
        for (const entity of source.entities.values) {
          if (entity.polygon)
            entity.polygon.material = Cesium.Color.fromCssColorString(
              active ? '#ffc777' : '#5edbc3',
            ).withAlpha(active ? 0.23 : 0.15);
          if (entity.polyline)
            entity.polyline.material = Cesium.Color.fromCssColorString(
              active ? '#ffc777' : '#6be0ca',
            );
        }
        viewer.scene.requestRender();
      },
      zoom(direction) {
        viewer.camera.cancelFlight();
        const height = viewer.camera.positionCartographic.height;
        if (direction > 0)
          viewer.camera.zoomIn(
            Math.max(0, height - Math.max(250000, height * 0.7)),
          );
        else
          viewer.camera.zoomOut(
            Math.min(height * 0.4, Math.max(0, 30000000 - height)),
          );
        viewer.scene.requestRender();
      },
      setVisible(value) {
        source.show = value;
        viewer.scene.requestRender();
      },
      setImagery(value) {
        base.show = value;
        viewer.scene.requestRender();
      },
      destroy() {
        remove();
        handler.destroy();
        viewer.destroy();
      },
    };
  } catch (error) {
    viewer.destroy();
    throw error;
  }
}
