import './realityMode.css';

/** Own the optional mission without creating another viewer or leaking app resources. */
export function createRealityMode({ scene, controls, tools, signal }) {
  let current = null;
  let opening = null;
  let disposed = false;
  const launch = document.createElement('button');
  launch.id = 'reality-launch';
  launch.textContent = 'Explore Reality Debugger · Tonga 2022';
  launch.title = 'Launch the Tonga eruption and connectivity mission';
  document.body.append(launch);
  const open = () => {
    if (disposed || signal.aborted) return Promise.resolve(null);
    if (current) return Promise.resolve(current);
    if (opening) return opening;
    opening = (async () => {
      const { mountTongaWorld } = await import('../situations/world.js');
      if (disposed || signal.aborted) return null;
      controls.cancelInitialFlight?.();
      tools.sceneDirector.stopScene('Entering Reality Debugger');
      let closed = false;
      const mounted = await mountTongaWorld({
        viewer: scene.viewer,
        styleManager: controls.styleManager,
        annotations: tools.annotations,
        voiceSession: tools.voiceCommands.session,
        signal,
        onDestroy: () => {
          closed = true;
          current = null;
        },
      });
      if (closed || disposed || signal.aborted) {
        mounted.destroy();
        return null;
      }
      current = mounted;
      const url = new URL(location.href);
      url.searchParams.set('situation', 'tonga');
      history.replaceState(history.state, '', url);
      return mounted;
    })().finally(() => {
      opening = null;
    });
    return opening;
  };
  const onClick = () =>
    open().catch((error) => {
      console.error('Reality Debugger launch failed:', error);
      launch.textContent = 'Mission could not load · Try again';
    });
  launch.addEventListener('click', onClick);
  return {
    open,
    get actions() {
      return current?.actions;
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      current?.destroy();
      current = null;
      launch.removeEventListener('click', onClick);
      launch.remove();
    },
  };
}
