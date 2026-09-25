import * as Cesium from 'cesium';
import { createInternetHealthLayer } from '../../layers/internetHealth/index.js';
import * as context from '../../data/contextStore.js';
import { isPointerFree } from '../../data/inputOwnership.js';
import { overlayHost } from './overlayHost.js';

export function createApplicationInternetHealth(options) {
  return createInternetHealthLayer({
    overlayHost,
    context,
    isPointerFree,
    screenSpaceEventHandlerFactory: (canvas) =>
      new Cesium.ScreenSpaceEventHandler(canvas),
    ...options,
  });
}
