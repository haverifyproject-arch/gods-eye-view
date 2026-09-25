import * as Cesium from 'cesium';
import './storyWorld.css';

const NS = 'http://www.w3.org/2000/svg';
const ANCHORS = {
  tonga: [-175.2, -21.13],
  fiji: [178.44, -18.12],
};
const svgNode = (name, attributes = {}, text) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
};

/** Geographic tethers support explanatory diagrams; diagram positions are never measured locations. */
export function createStoryWorld({ viewer, root, inspect }) {
  const element = document.createElement('section');
  element.className = 'reality-story-world';
  element.hidden = true;
  element.setAttribute('aria-label', 'World explanation');
  const tethers = svgNode('svg', {
    class: 'reality-story-tethers',
    'aria-hidden': 'true',
  });
  const stage = document.createElement('div');
  stage.className = 'reality-story-stage';
  const graphic = svgNode('svg', { viewBox: '0 0 600 280', role: 'img' });
  const sources = document.createElement('div');
  sources.className = 'reality-story-sources';
  sources.setAttribute('aria-label', 'Evidence behind this explanation');
  const caption = document.createElement('p');
  caption.className = 'reality-story-geography';
  stage.append(graphic, sources, caption);
  element.append(tethers, stage);
  root.append(element);
  const anchors = Object.fromEntries(
    Object.entries(ANCHORS).map(([key, values]) => [
      key,
      Cesium.Cartesian3.fromDegrees(...values),
    ]),
  );
  const occluder = new Cesium.EllipsoidalOccluder(
    Cesium.Ellipsoid.WGS84,
    viewer.camera.positionWC,
  );
  let active = null;
  let disposed = false;

  const text = (x, y, value, className = '', anchor = 'start') =>
    graphic.append(
      svgNode('text', { x, y, class: className, 'text-anchor': anchor }, value),
    );
  const line = (x1, y1, x2, y2, className = '') =>
    graphic.append(svgNode('line', { x1, y1, x2, y2, class: className }));
  const circle = (cx, cy, r, className = '') =>
    graphic.append(svgNode('circle', { cx, cy, r, class: className }));
  const path = (d, className = '') =>
    graphic.append(svgNode('path', { d, class: className }));
  const source = (id, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.sourceRecordId = id;
    button.textContent = `${label} ↗`;
    button.addEventListener('click', () => inspect(id));
    sources.append(button);
  };
  const place = (x, label, detail, className = '') => {
    circle(x, 128, 15, `story-node ${className}`);
    circle(x, 128, 30, `story-halo ${className}`);
    text(x, 195, label, 'story-place', 'middle');
    text(x, 220, detail, 'story-detail', 'middle');
  };
  const draw = (chapter) => {
    graphic.replaceChildren();
    sources.replaceChildren();
    const type =
      { evidence: 'timing', emergency: 'fallback' }[chapter.visualType] ||
      chapter.visualType;
    const answering = chapter.answering === true;
    element.dataset.visualType = type;
    element.dataset.answering = String(answering);
    graphic.append(
      svgNode('title', {}, chapter.title || 'Tonga: evidence in the world'),
    );
    if (type === 'dependency') {
      graphic.setAttribute(
        'aria-label',
        'Tonga depended on an international submarine cable to Fiji. The drawn connection is a conceptual relationship; the route on the globe is current reference.',
      );
      text(300, 35, 'ONE INTERNATIONAL CONNECTION', 'story-overline', 'middle');
      line(115, 128, 485, 128, 'story-link story-reference');
      for (const x of [225, 300, 375])
        path(`M ${x + 7} 121 l -7 7 l 7 7`, 'story-chevron');
      place(85, 'FIJI', 'Global networks');
      place(515, 'TONGA', 'Island networks');
      text(300, 99, 'SUBMARINE CABLE', 'story-link-label', 'middle');
      source('international-cable', 'Inspect the cable reference');
      source(
        chapter.sourceRecordId || 'cable-damage',
        'Why one cable mattered',
      );
      caption.textContent =
        'Conceptual dependency · map route is present-day reference, not a surveyed 2022 path';
    } else if (type === 'timing') {
      graphic.setAttribute(
        'aria-label',
        '15 January UTC: degradation around 03:00, main eruption 04:14, near-zero measured traffic by 05:30. The first decline precedes the main explosion, so chronology alone cannot prove its initiating cause.',
      );
      text(300, 25, '15 JANUARY 2022 · UTC', 'story-overline', 'middle');
      line(62, 108, 540, 108, 'story-time-rule');
      const events = [
        [62, '≈03:00', 'Traffic starts', 'declining', 'story-observed'],
        [298, '04:14', 'Main eruption', 'reported time', 'story-reported'],
        [540, 'by 05:30', 'Near-zero', 'traffic', 'story-observed'],
      ];
      for (const [x, time, label, detail, state] of events) {
        circle(x, 108, 7, `story-node ${state}`);
        text(x, 82, time, `story-time ${state}`, 'middle');
        text(x, 146, label, 'story-detail', 'middle');
        text(x, 170, detail, 'story-detail', 'middle');
      }
      if (answering) {
        path('M62 194 v12 H298 v-12', 'story-gap');
        text(180, 234, 'DECLINE BEGINS EARLIER', 'story-warning', 'middle');
        text(180, 258, 'Initial cause unresolved', 'story-detail', 'middle');
      } else {
        text(300, 234, 'WHAT CHANGED FIRST?', 'story-warning', 'middle');
      }
      source('traffic-decline', 'Cloudflare measurements');
      source('main-eruption', 'Eruption chronology');
      caption.textContent =
        'Published observations and reported event time · chronology is not proof of causation';
    } else if (type === 'disruption') {
      graphic.setAttribute(
        'aria-label',
        'Cable damage was reported. Cloudflare observed near-zero traffic from its vantage. Exact breaks remain unknown; this diagram is not a fault coordinate or a measurement chart.',
      );
      if (answering) {
        text(300, 30, 'WHAT WAS DIRECTLY MEASURED', 'story-overline', 'middle');
        circle(85, 130, 18, 'story-node');
        line(120, 130, 440, 130, 'story-link story-observed');
        text(85, 190, 'TONGA', 'story-place', 'middle');
        text(365, 105, 'by 05:30 UTC', 'story-time story-observed', 'middle');
        text(365, 166, 'Near-zero traffic', 'story-place', 'middle');
        text(
          300,
          227,
          'Digicel + Kalianet · Cloudflare vantage',
          'story-detail',
          'middle',
        );
        text(
          300,
          257,
          'This does not locate a cable break.',
          'story-warning',
          'middle',
        );
        source('traffic-collapse', 'Inspect the observation');
        caption.textContent =
          'Measurement summary · reported fault geometry removed from this explanation';
        return;
      }
      text(300, 30, 'A DEPENDENCY FAILS', 'story-overline', 'middle');
      place(80, 'TONGA', 'Connectivity disrupted');
      place(520, 'OUTSIDE', 'Primary connection');
      line(110, 128, 250, 128, 'story-link story-muted');
      line(350, 128, 490, 128, 'story-link story-muted');
      path('M267 105 l-12 23 l13 23 M333 105 l12 23 l-13 23', 'story-break');
      text(
        300,
        89,
        'FAULTS REPORTED',
        'story-reported story-link-label',
        'middle',
      );
      text(300, 169, 'location unknown', 'story-detail', 'middle');
      text(
        300,
        263,
        'NEAR-ZERO TRAFFIC · CLOUDFLARE VANTAGE',
        'story-observed story-overline',
        'middle',
      );
      source('cable-damage', 'Reported cable damage');
      source('traffic-collapse', 'Measured network effect');
      caption.textContent =
        'Conceptual break in a dependency · not an exact cable break or a national traffic census';
    } else if (type === 'fallback') {
      graphic.setAttribute(
        'aria-label',
        'Emergency satellite connectivity provided limited access. It was not equivalent to restored primary cable service. No satellite position or orbit is shown.',
      );
      text(300, 30, 'AN EMERGENCY ALTERNATIVE', 'story-overline', 'middle');
      circle(110, 155, 16, 'story-node');
      path('M140 155 C230 155 218 92 300 92 H495', 'story-fallback');
      text(
        315,
        70,
        'LIMITED SATELLITE ACCESS',
        'story-reported story-link-label',
        'middle',
      );
      text(110, 210, 'TONGA', 'story-place', 'middle');
      text(
        415,
        125,
        answering
          ? 'Weather-service terminal reused'
          : 'Emergency communications',
        'story-detail',
        'middle',
      );
      line(145, 174, 495, 174, 'story-link story-muted');
      path('M303 164 l18 20 M321 164 l-18 20', 'story-break');
      text(365, 216, 'Primary cable still impaired', 'story-detail', 'middle');
      if (answering)
        text(
          300,
          260,
          'DOCUMENTED BY 10 FEB · ACTIVATION TIME UNKNOWN',
          'story-warning',
          'middle',
        );
      source('emergency-access', 'Emergency access evidence');
      caption.textContent =
        'Conceptual service alternatives · no satellite location, orbit or capacity is inferred';
    } else if (type === 'recovery') {
      graphic.setAttribute(
        'aria-label',
        '22 February: Cloudflare traffic increased toward pre-eruption levels after international cable repair. This does not establish complete recovery of domestic and outer-island connections.',
      );
      text(300, 28, 'RECOVERY IS NOT ONE SWITCH', 'story-overline', 'middle');
      text(35, 83, '22 FEB', 'story-time story-observed');
      line(35, 120, 545, 120, 'story-link story-observed');
      circle(545, 120, 8, 'story-node story-observed');
      text(35, 158, 'International service returns', 'story-place');
      text(35, 184, 'Traffic rises toward pre-eruption levels', 'story-detail');
      if (answering) {
        path('M90 120 V230 H375', 'story-unresolved');
        circle(400, 230, 17, 'story-unknown-node');
        text(400, 237, '?', 'story-warning', 'middle');
        text(
          35,
          267,
          'OUTER-ISLAND DOMESTIC REPAIR STILL INCOMPLETE',
          'story-warning',
        );
      } else {
        text(
          35,
          242,
          'Tongatapu + Eua named in operator report',
          'story-detail',
        );
      }
      source('traffic-return', 'Observed traffic return');
      source('domestic-recovery-unknown', 'Limits of the recovery claim');
      caption.textContent =
        'Restoration summary, not a sampled traffic chart · no invented recovery percentage';
    } else {
      element.hidden = true;
    }
  };
  const project = () => {
    if (!active || disposed) return;
    const width = viewer.canvas.clientWidth;
    const height = viewer.canvas.clientHeight;
    tethers.setAttribute('viewBox', `0 0 ${width} ${height}`);
    tethers.replaceChildren();
    occluder.cameraPosition = viewer.camera.positionWC;
    const canvasBox = viewer.canvas.getBoundingClientRect();
    const box = stage.getBoundingClientRect();
    const keys =
      active.visualType === 'dependency' ? ['tonga', 'fiji'] : ['tonga'];
    let visible = false;
    for (const key of keys) {
      const anchor = anchors[key];
      if (!occluder.isPointVisible(anchor)) continue;
      const point = Cesium.SceneTransforms.worldToWindowCoordinates(
        viewer.scene,
        anchor,
      );
      if (
        !point ||
        point.x < 0 ||
        point.y < 0 ||
        point.x > width ||
        point.y > height
      )
        continue;
      visible = true;
      const endX =
        box.left -
        canvasBox.left +
        box.width *
          (active.visualType === 'dependency'
            ? key === 'fiji'
              ? 0.14
              : 0.86
            : 0.14);
      const endY = box.top - canvasBox.top + box.width * (128 / 600);
      tethers.append(
        svgNode('path', {
          d: `M${point.x} ${point.y} L${endX} ${endY}`,
          class: 'story-geographic-tether',
        }),
      );
      tethers.append(
        svgNode('circle', {
          cx: point.x,
          cy: point.y,
          r: 5,
          class: 'story-geographic-anchor',
        }),
      );
    }
    // Explanations stay legible while the camera travels; only real visible anchors receive tethers.
    element.dataset.anchorVisible = String(visible);
  };
  const removeRender = viewer.scene.postRender.addEventListener(project);
  return {
    show(chapter) {
      if (disposed) return;
      active = chapter || null;
      element.hidden = !active;
      if (active) {
        draw(active);
        project();
      }
      viewer.scene.requestRender();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      removeRender();
      element.remove();
    },
  };
}
