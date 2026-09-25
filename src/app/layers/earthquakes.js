import { createEarthquakesLayer } from '../../layers/earthquakes/index.js';
import { overlayHost } from './overlayHost.js';
import * as Cesium from 'cesium';
import * as context from '../../data/contextStore.js';
import { isPointerFree } from '../../data/inputOwnership.js';
/** Wire earthquake observations to the application overlay host. */
export function createApplicationEarthquakes(options) {
  return createEarthquakesLayer({
    overlayHost,
    context: typeof window === 'undefined' ? undefined : context,
    isPointerFree,
    screenSpaceEventHandlerFactory: (canvas) =>
      new Cesium.ScreenSpaceEventHandler(canvas),
    ...options,
  });
}
