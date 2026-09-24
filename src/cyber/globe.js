import * as Cesium from 'cesium';
import { createApplicationViewer } from '../app/viewer.js';

/** Own the upstream viewer and render only evidenced reference geography. */
export async function createScenarioGlobe({
  container,
  creditContainer,
  geometry,
  onSelect,
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
        properties: { name: 'Ukraine · reference geography' },
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
    const focus = () =>
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(31.5, 48.5, 11000000),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 0.8,
      });
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(31.5, 48.5, 11000000),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
    });
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
      const picked = viewer.scene.pick(event.position);
      if (picked?.id && source.entities.contains(picked.id)) onSelect();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    viewer.scene.canvas.setAttribute(
      'aria-label',
      'Interactive 3D globe. Ukraine reference outline. Use the Ukraine button for keyboard selection.',
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
