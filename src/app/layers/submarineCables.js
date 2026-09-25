import * as Cesium from 'cesium';
import { createSubmarineCableLayer } from '../../layers/submarineCables/index.js';
import { overlayHost } from './overlayHost.js';
import { localGeoJsonServices } from '../localGeojsonServices.js';
/** Wire cable source geometry to the application overlay host. */
export function createApplicationCables(options) {
  return createSubmarineCableLayer({
    overlayHost,
    contextServices: typeof window !== 'undefined' ? localGeoJsonServices : {},
    screenSpaceEventHandlerFactory: (canvas) =>
      new Cesium.ScreenSpaceEventHandler(canvas),
    mapStackEventTarget: typeof window !== 'undefined' ? window : null,
    ...options,
  });
}
