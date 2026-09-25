import * as Cesium from 'cesium';

/** Screen-sized annotations tethered to geographic context, never invented fault geometry. */
export function createWorldEvidence({ viewer, root, runtime, inspect }) {
  const anchor = Cesium.Cartesian3.fromDegrees(-175.2, -21.13);
  const occluder = new Cesium.EllipsoidalOccluder(
    Cesium.Ellipsoid.WGS84,
    viewer.camera.positionWC,
  );
  const element = document.createElement('div');
  element.className = 'reality-world-evidence';
  element.setAttribute('aria-label', 'Tonga world evidence');
  root.append(element);
  let hasContent = false;
  const button = (id, status, title, detail) => {
    const node = document.createElement('button');
    node.className = `reality-world-fact ${status.toLowerCase()}`;
    node.dataset.record = id;
    for (const [tag, text] of [
      ['small', status.replace('_', ' ')],
      ['strong', title],
      ['span', detail],
    ]) {
      const child = document.createElement(tag);
      child.textContent = text;
      node.append(child);
    }
    node.addEventListener('click', () => inspect(id));
    return node;
  };
  const update = (snapshot) => {
    element.replaceChildren();
    const ids = new Set(snapshot.records.map((record) => record.id));
    const recovered = ids.has('traffic-return');
    const measured = recovered
      ? 'traffic-return'
      : ids.has('traffic-collapse')
        ? 'traffic-collapse'
        : ids.has('traffic-decline')
          ? 'traffic-decline'
          : null;
    const reported = ids.has('cable-repaired')
      ? 'cable-repaired'
      : ids.has('cable-damage')
        ? 'cable-damage'
        : null;
    const row = document.createElement('div');
    row.className = 'reality-world-chain';
    if (reported)
      row.append(
        button(
          reported,
          'REPORTED',
          reported === 'cable-repaired'
            ? 'Primary cable repaired'
            : 'Cable faults reported',
          reported === 'cable-repaired'
            ? 'Domestic repair still incomplete'
            : 'Exact break coordinates unavailable',
        ),
      );
    if (measured && reported) {
      const link = document.createElement('span');
      link.className = 'reality-world-link';
      link.textContent = '···';
      link.title =
        'Association reported by sources; not a surveyed physical connection';
      row.append(link);
    }
    if (measured)
      row.append(
        button(
          measured,
          'OBSERVED',
          recovered
            ? 'Connectivity returns'
            : measured === 'traffic-collapse'
              ? 'Near-zero traffic'
              : 'Traffic declining',
          measured === 'traffic-collapse'
            ? 'Cloudflare at ~05:30 Jan 15 · not a continuous zero reading'
            : 'Cloudflare vantage · qualitative summary',
        ),
      );
    if (row.childElementCount) element.append(row);
    if (ids.has('emergency-access') && !recovered)
      element.append(
        button(
          'emergency-access',
          'REPORTED',
          'Emergency satellite access',
          'Documented by 10 Feb · activation time unknown',
        ),
      );
    if (ids.has('fault-unknown') && snapshot.lens === 'UNKNOWN')
      element.append(
        button(
          'fault-unknown',
          'UNKNOWN',
          'Where did the cable break?',
          '37 km illustration is a scale, not a fault boundary',
        ),
      );
    if (ids.has('domestic-recovery-unknown') && snapshot.lens === 'UNKNOWN')
      element.append(
        button(
          'domestic-recovery-unknown',
          'UNKNOWN',
          'Outer-island recovery unresolved',
          'Primary service return does not establish full recovery',
        ),
      );
    hasContent = element.childElementCount > 0;
    if (hasContent) {
      const caption = document.createElement('p');
      caption.className = 'reality-world-caption';
      caption.textContent = 'TONGA CONTEXT · NOT A SENSOR OR BREAK LOCATION';
      element.append(caption);
    }
  };
  const project = () => {
    occluder.cameraPosition = viewer.camera.positionWC;
    const point = Cesium.SceneTransforms.worldToWindowCoordinates(
      viewer.scene,
      anchor,
    );
    const visible =
      occluder.isPointVisible(anchor) &&
      hasContent &&
      point &&
      viewer.camera.positionCartographic.height < 3500000;
    element.hidden = !visible;
    if (!visible) return;
    const width = viewer.canvas.clientWidth;
    const height = viewer.canvas.clientHeight;
    const lowerLimit =
      root.querySelector('.reality-bottom').getBoundingClientRect().top - 16;
    if (
      point.y > lowerLimit ||
      point.y < 165 ||
      point.x < 0 ||
      point.x > width
    ) {
      element.hidden = true;
      return;
    }
    // Keep the tethered annotation in the world viewport, above the compact time controls.
    element.style.left = `${Math.max(16, Math.min(width - element.offsetWidth - 16, point.x + 25))}px`;
    element.style.top = `${Math.max(180, Math.min(lowerLimit - element.offsetHeight, point.y - 50))}px`;
    element.dataset.anchorVisible = String(
      point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height,
    );
    if (element.dataset.anchorVisible === 'false') element.hidden = true;
  };
  const unsubscribe = runtime.subscribe(update);
  update(runtime.getContext());
  const removeRender = viewer.scene.postRender.addEventListener(project);
  return {
    destroy() {
      unsubscribe();
      removeRender();
      element.remove();
    },
  };
}
