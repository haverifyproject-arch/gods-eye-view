import * as Cesium from 'cesium';
import { createCameraMotion } from '../scenes/cameraMotion.js';
import { createSituationRuntime, createSituationActions } from './runtime.js';
import { tongaSituation } from './tonga.js';
import './world.css';
import { createWorldEvidence } from './worldEvidence.js';
import { createStoryPlayer } from './storyPlayer.js';

const COLORS = {
  OBSERVED: '#75edff',
  REPORTED: '#ffc57b',
  CURRENT_REFERENCE: '#84aab2',
  UNKNOWN: '#ff9a75',
  RECONSTRUCTED: '#af95ff',
};
const POS = {
  pacific: [179, -19.5, 2800000],
  tonga: [-175.15, -20.9, 690000],
  volcano: [-175.39, -20.55, 175000],
  fiji: [178.44, -18.12, 600000],
};
const cameraPose = (viewer) => {
  const c = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
  return {
    lon: Cesium.Math.toDegrees(c.longitude),
    lat: Cesium.Math.toDegrees(c.latitude),
    alt: c.height,
    heading: Cesium.Math.toDegrees(viewer.camera.heading),
    pitch: Cesium.Math.toDegrees(viewer.camera.pitch),
    roll: 0,
  };
};
const targetPose = ([lon, lat, alt]) => ({
  lon,
  lat,
  alt,
  heading: 0,
  pitch: -90,
  roll: 0,
});
const position = ([lon, lat], height = 0) =>
  Cesium.Cartesian3.fromDegrees(lon, lat, height);
const delay = (ms, signal) =>
  new Promise((resolve) => {
    if (signal.aborted) return resolve(false);
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      resolve(!signal.aborted);
    };
    const abort = () => finish();
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

/** A native overlay on the one application viewer; all representations are transient and owned. */
export async function mountTongaWorld({
  viewer,
  styleManager,
  signal,
  onDestroy,
  voiceSession,
}) {
  signal?.throwIfAborted();
  const runtime = createSituationRuntime(tongaSituation);
  const cableResponse = await fetch('/reality/tonga-cables.geojson', {
    signal,
  });
  if (!cableResponse.ok) throw new Error('Bundled cable reference unavailable');
  const cableFeatures = (await cableResponse.json()).features;
  signal?.throwIfAborted();
  const landResponse = await fetch('/reality/pacific-land.geojson', { signal });
  if (!landResponse.ok)
    throw new Error('Bundled geographic context unavailable');
  const land = await Cesium.GeoJsonDataSource.load(await landResponse.json(), {
    fill: Cesium.Color.fromCssColorString('#244c54'),
    stroke: Cesium.Color.fromCssColorString('#77a9ae'),
    strokeWidth: 1.5,
    clampToGround: false,
  });
  signal?.throwIfAborted();
  land.name = 'Reality Debugger · geographic reference';
  await viewer.dataSources.add(land);
  const source = new Cesium.CustomDataSource('Reality Debugger · Tonga');
  await viewer.dataSources.add(source);
  if (signal?.aborted) {
    viewer.dataSources.remove(land, true);
    viewer.dataSources.remove(source, true);
    runtime.destroy();
    signal.throwIfAborted();
  }
  const originalBaseColor = viewer.scene.globe.baseColor.clone();
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#091d2b');
  const world = new Map();
  const cableEntities = [];
  const recordMap = new Map(
    [
      ...tongaSituation.entities,
      ...tongaSituation.events,
      ...tongaSituation.observations,
      ...tongaSituation.claims,
    ].map((record) => [record.id, record]),
  );
  const coordinatesFor = (record) =>
    record.geometry?.coordinates ||
    recordMap.get(record.anchorId)?.geometry?.coordinates;
  const makePoint = (record) => {
    const coordinates = coordinatesFor(record);
    if (!coordinates) return;
    const entity = source.entities.add({
      id: `reality-${record.id}`,
      position: position(coordinates),
      point: {
        pixelSize: record.status === 'OBSERVED' ? 13 : 10,
        color: Cesium.Color.fromCssColorString(COLORS[record.status] || '#fff'),
        outlineColor: Cesium.Color.fromCssColorString('#061822'),
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `${record.status.replace('_', ' ')}\n${record.label}${record.anchorId ? '\nCountry context · approximate anchor' : ''}`,
        font: '600 15px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(
          record.id === 'tonga' ? 50 : 0,
          record.id === 'tonga' ? 35 : -35,
        ),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
          0,
          record.id === 'volcano' || record.id === 'main-eruption'
            ? 1200000
            : 4500000,
        ),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    world.set(record.id, entity);
  };
  [
    ...tongaSituation.entities,
    ...tongaSituation.events,
    ...tongaSituation.observations,
  ].forEach(makePoint);
  // A line on the reference route may cross the dateline. Each source part stays separate,
  // avoiding Cesium's long-way-around interpolation across discontinuous components.
  for (const feature of cableFeatures) {
    for (const part of feature.geometry.coordinates) {
      const entity = source.entities.add({
        id: `reality-${feature.properties.id}-${cableEntities.length}`,
        polyline: {
          // Cartographic display offset, not a claim about cable depth/elevation.
          positions: part.map((p) => position(p, 2500)),
          width: 3.5,
          clampToGround: false,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#84aab2').withAlpha(0.7),
            dashLength: 14,
          }),
        },
      });
      cableEntities.push({
        id:
          feature.properties.id === 'tonga-cable'
            ? 'international-cable'
            : 'domestic-cable',
        entity,
      });
    }
  }
  const cableLabel = source.entities.add({
    position: position([-179.8, -19.3]),
    label: {
      text: 'TONGA–FIJI · CURRENT REFERENCE',
      font: '600 13px sans-serif',
      fillColor: Cesium.Color.fromCssColorString('#c6e5ea'),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4500000),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  // Illustrative scale only: the source does not establish a radial distance convention.
  const locus = tongaSituation.entities.find(
    (r) => r.id === 'fault-unknown',
  ).geometry;
  const ring = source.entities.add({
    id: 'reality-fault-unknown',
    position: position(locus.center),
    ellipse: {
      semiMajorAxis: locus.radiusMeters,
      semiMinorAxis: locus.radiusMeters,
      material: Cesium.Color.fromCssColorString('#ff9a75').withAlpha(0.08),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#ff9a75').withAlpha(0.75),
      height: 150,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
    },
  });
  const root = document.createElement('section');
  root.id = 'reality-mode';
  root.setAttribute('aria-label', 'Reality Debugger');
  root.innerHTML = `<div class="reality-top"><div class="reality-kicker">GOD'S EYE VIEW / REALITY DEBUGGER</div><h1>The Tonga connection</h1><p id="reality-narration" aria-live="polite">Follow the physical world into the network.</p><button id="reality-exit" title="Return to God's Eye View">Exit mission ×</button></div>
    <div id="reality-evidence" hidden></div>
    <div class="reality-bottom"><div class="reality-controls"><button id="reality-play">▶ Walk through</button><button id="reality-enter">Enter Tonga ↓</button><button id="reality-follow">Follow cable → Fiji</button><button id="reality-compare">Before / after</button><button id="reality-unknown">What don't we know?</button><button id="reality-voice" title="Optional native voice; requires configured provider">Voice (optional)</button></div>
    <div class="reality-clock"><label for="reality-time">TIME <span id="reality-time-label"></span></label><input id="reality-time" type="range" min="0" max="5" value="0"/><div class="reality-ticks"><span>BEFORE</span><span>TRAFFIC</span><span>ERUPTION</span><span>OUTAGE</span><span>FALLBACK</span><span>RECOVERY</span></div></div>
    <div class="reality-lenses" role="group" aria-label="Evidence lens"><button data-lens="ALL">Full context</button><button data-lens="OBSERVED">Observed</button><button data-lens="REPORTED">Reported</button><button data-lens="CURRENT_REFERENCE">Current reference</button><button data-lens="UNKNOWN">Unknown</button></div>
    <form id="reality-command-form"><label for="reality-command">ASK THE WORLD</label><input id="reality-command" autocomplete="off" placeholder="Try ‘why did Tonga go dark?’"/><button type="submit" aria-label="Run world command">↵</button></form><small>Cloudflare · NASA JPL · ITU · © TeleGeography CC BY-NC-SA 3.0 · Natural Earth geographic context · Built on <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noopener noreferrer">Bilawal Sidhu's God's Eye View</a> (MIT)</small></div>`;
  document.body.append(root);
  document.body.classList.add('reality-active');
  const $ = (selector) => root.querySelector(selector);
  const narrative = (message) => {
    $('#reality-narration').textContent = message;
  };
  const evidence = $('#reality-evidence');
  let story = null;
  let ownsVoice = false;
  const voiceButton = $('#reality-voice');
  voiceButton.hidden = !voiceSession;
  const updateVoice = () => {
    const active = voiceSession?.isActive();
    voiceButton.textContent = active ? 'Stop voice' : 'Voice (optional)';
    voiceButton.setAttribute('aria-pressed', String(!!active));
  };
  const unsubscribeVoice = voiceSession?.subscribe((event) => {
    if (event.type !== 'state') return;
    updateVoice();
    if (event.state === 'error')
      narrative(
        event.detail || 'Voice unavailable; world commands remain ready.',
      );
  });
  updateVoice();
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = (e) => {
    reduced = e.matches;
  };
  motionQuery.addEventListener('change', onMotion);
  const motion = createCameraMotion({
    applyPose: (pose) => {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          pose.lon,
          pose.lat,
          pose.alt,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(pose.heading),
          pitch: Cesium.Math.toRadians(pose.pitch),
          roll: 0,
        },
      });
      viewer.scene.requestRender();
    },
  });
  let ownCamera = false;
  const handoff = styleManager?.subscribeCameraHandoff?.(() => {
    if (!ownCamera) {
      story?.pause();
      actions.cancel();
      motion.cancel();
    }
  });
  const move = async (target, signal, duration = 4) => {
    if (signal.aborted) return false;
    ownCamera = true;
    try {
      const claim = styleManager?._runExplicitNavigation?.(
        'Reality Debugger',
        () => true,
      );
      if (claim === false) return false;
    } finally {
      ownCamera = false;
    }
    if (reduced) {
      const pose = targetPose(target);
      viewer.camera.setView({
        destination: position([pose.lon, pose.lat], pose.alt),
        orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
      });
      return true;
    }
    return motion.play(
      {
        from: cameraPose(viewer),
        to: targetPose(target),
        durationSec: duration,
      },
      { signal },
    );
  };
  const setStage = (index, message) => {
    runtime.setTime(tongaSituation.timeline[index].time);
    if (message) narrative(message);
  };
  const inspect = (id) => {
    // Inspection is also called by an in-flight trace; stop narration without aborting its own action.
    story?.pause(false);
    const result = runtime.inspect(id);
    runtime.select(id);
    evidence.hidden = false;
    const record = result.record;
    evidence.innerHTML = `<button id="reality-close-evidence" aria-label="Close evidence">×</button><div class="reality-kicker">${escapeHtml(record.status)} · SOURCE TRACE</div><h2>${escapeHtml(record.label)}</h2>
      ${record.question ? `<p>${escapeHtml(record.question)}</p>` : ''}
      ${record.scope ? `<p><strong>${escapeHtml(record.metric)}: ${escapeHtml(record.value)}</strong><br>${escapeHtml(record.scope)}</p>` : ''}
      ${record.observedAt ? `<small>Published observation timestamp: ${escapeHtml(record.observedAt)} (${escapeHtml(record.timePrecision || 'source precision')})</small>` : ''}
      ${record.observedTime ? `<small>${record.observedTimePrecision === 'CONTAINING_DAY' ? 'Containing day (duration unspecified)' : 'Observation interval'}: ${escapeHtml(record.observedTime.start)} — ${escapeHtml(record.observedTime.end)}</small>` : ''}
      ${record.timeDescription ? `<p class="reality-basis">${escapeHtml(record.timeDescription)}</p>` : ''}
      ${result.evidence
        .map((item) => {
          const sourceRecord = result.sources.find(
            (s) => s.id === item.sourceId,
          );
          return `<p>${escapeHtml(item.summary)}</p><a target="_blank" rel="noopener noreferrer" href="${escapeHtml(sourceRecord.url)}">${escapeHtml(sourceRecord.publisher)} ↗</a><small>${escapeHtml(item.locator)}<br>Published ${escapeHtml(sourceRecord.publishedAt || 'date not established')} · retrieved ${escapeHtml(sourceRecord.retrievedAt.slice(0, 10))}<br>${escapeHtml(sourceRecord.rights)}</small>`;
        })
        .join(
          '',
        )}<p class="reality-basis">${escapeHtml(record.spatialDescription || record.geometry?.description || (record.anchorId ? 'Approximate country context; not a sensor or terminal location.' : 'No precise geography is established for this statement.'))}</p>`;
    $('#reality-close-evidence').onclick = () => {
      evidence.hidden = true;
    };
    const pinButton = document.createElement('button');
    pinButton.id = 'reality-pin-evidence';
    pinButton.textContent = 'Pin to world';
    pinButton.disabled = !worldEvidence.canAnnotate(id);
    pinButton.title = pinButton.disabled
      ? 'Pinning requires a visible source-backed record with declared geographic context'
      : 'Keep this source-backed annotation anchored in the world';
    pinButton.onclick = () => {
      execute('annotate', { id });
      evidence.hidden = true;
    };
    evidence.append(pinButton);
  };
  const worldEvidence = createWorldEvidence({ viewer, root, runtime, inspect });
  const followRoute = async (signal) => {
    const reference = cableFeatures.find(
      (feature) => feature.properties.id === 'tonga-cable',
    );
    const parts = reference.geometry.coordinates;
    for (const [lon, lat] of [...parts[0].toReversed(), ...parts[1]]) {
      if (!(await move([lon, lat, 520000], signal, 2.3))) return false;
    }
    return true;
  };
  const actions = createSituationActions(runtime, {
    async go({ target = 'tonga', silent = false }, { signal }) {
      const record = recordMap.get(target);
      const coords = record && coordinatesFor(record);
      const dest = POS[target] || (coords && [...coords, 175000]);
      if (!dest) return { ok: false, error: 'Unknown world destination' };
      if (!silent)
        narrative(
          target === 'volcano'
            ? 'Hunga Tonga–Hunga Haʻapai. The main eruption is reported at 04:14 UTC.'
            : 'Tonga sits at the end of a long Pacific connection.',
        );
      return { ok: await move(dest, signal), result: target };
    },
    async follow(_args, { signal }) {
      runtime.setLens('ALL');
      narrative(
        'Following the generalized present-day cable route. This is spatial context, not a surveyed 2022 damage trace.',
      );
      // Traverse every vertex of the bundled reference from Tonga through the dateline to Fiji.
      if (!(await followRoute(signal))) return { ok: false, cancelled: true };
      narrative(
        'Fiji end of the current-reference route. The historical fault coordinate remains unknown.',
      );
      return { ok: true };
    },
    async trace({ id } = {}, { signal }) {
      // The narrated outage command chooses a time; explicit record traces respect the current lens/time.
      if (!id) {
        runtime.setLens('ALL');
        setStage(3);
        id = 'damage-connection';
      }
      const result = runtime.trace({ id });
      if (!result.relationships.length)
        return {
          ok: false,
          error:
            'No documented connection is visible for this record at this time and evidence lens.',
        };
      const anchor = result.records.map(coordinatesFor).find(Boolean);
      if (!(await move(anchor ? [...anchor, 175000] : POS.tonga, signal, 3)))
        return { ok: false, cancelled: true };
      inspect(result.relationships[0].id);
      narrative(
        `${result.relationships.map((edge) => edge.label).join('. ')}. These source-backed associations do not establish a causal chain. Select a connection to inspect its evidence.`,
      );
      return { ok: true, result };
    },
    async replay(_args, { signal }) {
      actionsPlaying = true;
      runtime.setLens('ALL');
      evidence.hidden = true;
      $('#reality-play').textContent = 'Ⅱ Pause walkthrough';
      try {
        const shots = [
          [
            0,
            POS.pacific,
            'Before: a Pacific island connection, represented by current cable geometry.',
            3,
          ],
          [
            1,
            POS.tonga,
            'Around 03:00 UTC January 15, Cloudflare observed traffic declining. This precedes the 04:14 main eruption timestamp.',
            7,
          ],
          [
            2,
            POS.volcano,
            'NASA JPL places the main eruption at 04:14 UTC. The event marker is reconstructed context, not satellite imagery.',
            7,
          ],
          [
            3,
            POS.tonga,
            'By 05:30, Cloudflare saw close to no traffic from major Tonga ISPs. ITU later reported two cable faults.',
            8,
          ],
          [
            4,
            POS.tonga,
            'By February 10, ITU documented emergency satellite access. Its exact activation time is not established here.',
            7,
          ],
          [
            5,
            POS.tonga,
            'February 22: repaired cable and traffic returning toward pre-eruption levels.',
            7,
          ],
        ];
        for (const [index, dest, message, seconds] of shots) {
          setStage(index, message);
          if (!(await move(dest, signal, reduced ? 0 : 4)))
            return { ok: false, cancelled: true };
          if (!(await delay(reduced ? 600 : seconds * 1000, signal)))
            return { ok: false, cancelled: true };
          if (index === 2) {
            narrative(
              'Follow the present-day cable reference from Tonga to Fiji. Its geometry does not locate the 2022 faults.',
            );
            if (!(await followRoute(signal)))
              return { ok: false, cancelled: true };
          }
          if (index === 3) {
            runtime.setLens('OBSERVED');
            narrative(
              'Observed only: the reported faults and current cable map disappear. Cloudflare measures traffic at its own vantage.',
            );
            if (!(await delay(reduced ? 600 : 4500, signal)))
              return { ok: false, cancelled: true };
            runtime.setLens('UNKNOWN');
            narrative(
              'The exact break remains unknown. This 37 km scale is not a surveyed fault boundary.',
            );
            if (!(await delay(reduced ? 600 : 4500, signal)))
              return { ok: false, cancelled: true };
            runtime.setLens('ALL');
          }
        }
        return { ok: true };
      } finally {
        actionsPlaying = false;
        $('#reality-play').textContent = '▶ Walk through';
      }
    },
    async compare(_args, { signal }) {
      runtime.setLens('ALL');
      if (!(await move(POS.tonga, signal, 2)))
        return { ok: false, cancelled: true };
      setStage(
        0,
        'Before: current route context. The historical topology is not independently established here.',
      );
      if (!(await delay(reduced ? 500 : 2500, signal)))
        return { ok: false, cancelled: true };
      setStage(
        3,
        'After: a measured Cloudflare traffic collapse, with separately reported cable damage.',
      );
      return { ok: true };
    },
    async annotate({ id, clear = false }, { signal }) {
      if (clear) {
        worldEvidence.clearAnnotation();
        return { ok: true, result: { cleared: true } };
      }
      const context = runtime.getContext();
      const target =
        id ||
        context.selectedId ||
        context.records.find((record) => record.anchorId || record.geometry)
          ?.id;
      const result = worldEvidence.annotate(target);
      if (!(await move([...result.coordinates, 690000], signal, 2)))
        return { ok: false, cancelled: true };
      narrative(
        'Source-backed annotation pinned to its declared geographic context. Select it for evidence, or remove it in the world.',
      );
      return { ok: true, result };
    },
  });
  const update = (snapshot) => {
    const ids = new Set(snapshot.records.map((r) => r.id));
    if (
      snapshot.selectedId &&
      !ids.has(snapshot.selectedId) &&
      !snapshot.relationships.some((edge) => edge.id === snapshot.selectedId)
    )
      evidence.hidden = true;
    // Keep one label per approximate context anchor at a time. Earlier records remain inspectable.
    const superseded = new Set();
    if (ids.has('main-eruption')) superseded.add('volcano');
    if (ids.has('traffic-decline')) superseded.add('tonga');
    if (ids.has('traffic-collapse')) superseded.add('traffic-decline');
    if (ids.has('traffic-return')) superseded.add('traffic-collapse');
    if (
      ['traffic-decline', 'traffic-collapse', 'traffic-return'].some((id) =>
        ids.has(id),
      )
    )
      superseded.add('tonga');
    for (const [id, entity] of world) {
      entity.show = ids.has(id) && !superseded.has(id);
      entity.label.show = !root.classList.contains('story-mode');
    }
    for (const id of [
      'traffic-decline',
      'traffic-collapse',
      'traffic-return',
      'airport',
    ]) {
      const entity = world.get(id);
      if (entity) entity.label.show = false;
    }
    const damage = ids.has('cable-damage');
    const repaired = ids.has('cable-repaired');
    for (const { id, entity } of cableEntities) {
      entity.show = ids.has(id);
      const color =
        repaired && id === 'international-cable'
          ? '#75edff'
          : damage
            ? '#ffc57b'
            : '#84aab2';
      entity.polyline.material.color =
        Cesium.Color.fromCssColorString(color).withAlpha(0.8);
    }
    cableLabel.show =
      ids.has('international-cable') && !root.classList.contains('story-mode');
    cableLabel.label.text = repaired
      ? 'CURRENT ROUTE REFERENCE · PRIMARY REPAIR REPORTED'
      : damage
        ? 'CURRENT ROUTE REFERENCE · DAMAGE REPORTED, LOCATION UNKNOWN'
        : 'TONGA–FIJI · CURRENT REFERENCE';
    ring.show =
      ids.has('fault-unknown') && !root.classList.contains('story-mode');
    $('#reality-time').value = String(
      tongaSituation.timeline.reduce(
        (i, moment, index) =>
          Date.parse(moment.time) <= Date.parse(snapshot.time) ? index : i,
        0,
      ),
    );
    $('#reality-time-label').textContent =
      `${snapshot.time.slice(0, 16).replace('T', '  ')} UTC`;
    root.querySelectorAll('[data-lens]').forEach((button) => {
      button.classList.toggle(
        'selected',
        button.dataset.lens === snapshot.lens,
      );
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.lens === snapshot.lens),
      );
    });
    viewer.scene.requestRender();
  };
  const unsub = runtime.subscribe(update);
  update(runtime.getContext());
  const execute = async (action, args) => {
    const result = await actions.run(action, args);
    if (!result.ok && !result.cancelled) narrative(result.error);
    return result;
  };
  const lens = (value) => {
    actions.run('lens', { lens: value });
    narrative(
      value === 'OBSERVED'
        ? 'Only direct measurements remain. The cable route and reported damage disappear.'
        : value === 'UNKNOWN'
          ? '37 km is an illustrative scale. The report gives no bearing or distance convention; this circle is not a fault boundary.'
          : `${value.replace('_', ' ').toLowerCase()} evidence lens.`,
    );
  };
  const click = (event) => {
    if (event.target.closest('[data-record]')) actions.cancel();
    const id = event.target.closest('[id]')?.id;
    if (id === 'reality-voice') {
      if (voiceSession?.isActive()) voiceSession.stop();
      else if (voiceSession) {
        ownsVoice = true;
        voiceSession
          .start({ pushToTalk: false })
          .catch((error) => narrative(error.message));
      }
    } else if (id === 'reality-play') {
      if (actionsPlaying) {
        actions.cancel();
        motion.cancel();
        actionsPlaying = false;
      } else {
        actionsPlaying = true;
        execute('replay').finally(() => {
          actionsPlaying = false;
        });
      }
    } else if (id === 'reality-enter') execute('go', { target: 'tonga' });
    else if (id === 'reality-follow') execute('follow');
    else if (id === 'reality-compare') execute('compare');
    else if (id === 'reality-unknown') {
      if (
        Date.parse(runtime.getContext().time) <
        Date.parse(tongaSituation.timeline[3].time)
      )
        actions.run('time', { time: tongaSituation.timeline[3].time });
      lens('UNKNOWN');
      inspect('fault-unknown');
      execute('go', { target: 'tonga', silent: true });
    } else if (id === 'reality-exit') {
      window.history.replaceState({}, '', window.location.pathname);
      destroy();
    }
    const lensButton = event.target.closest('[data-lens]');
    if (lensButton) lens(lensButton.dataset.lens);
  };
  let actionsPlaying = false;
  root.addEventListener('click', click);
  $('#reality-time').addEventListener('input', (e) => {
    actions.run('time', {
      time: tongaSituation.timeline[Number(e.target.value)].time,
    });
    narrative(tongaSituation.timeline[Number(e.target.value)].label);
  });
  const textActions = [
    [
      /remove annotation|clear annotation|unpin/i,
      () => execute('annotate', { clear: true }),
    ],
    [/^pin\b|^annotate\b/i, () => execute('annotate')],
    [
      /show.*outage|what broke|failure chain|why.*dark/i,
      () => execute('trace'),
    ],
    [/connected.*internet|follow.*dependenc/i, () => execute('follow')],
    [
      /satellite|fallback|emergency/i,
      () => {
        actions.run('time', { time: tongaSituation.timeline[4].time });
        runtime.setLens('ALL');
        execute('go', { target: 'tonga', silent: true });
        narrative(
          'Emergency satellite access was documented by 10 February. No exact activation time or satellite path is established here.',
        );
      },
    ],
    [/observ|directly measur/i, () => lens('OBSERVED')],
    [/hide infer|remove infer/i, () => lens('NO_INFERENCE')],
    [
      /what changed first|rewind/i,
      () => {
        actions.run('time', { time: tongaSituation.timeline[1].time });
        execute('go', { target: 'tonga', silent: true });
        narrative(
          'Cloudflare observed traffic decline around 03:00 UTC, before the main eruption at 04:14. The early cause is unresolved.',
        );
      },
    ],
    [
      /report/i,
      () => {
        if (
          Date.parse(runtime.getContext().time) <
          Date.parse(tongaSituation.timeline[3].time)
        )
          actions.run('time', { time: tongaSituation.timeline[3].time });
        lens('REPORTED');
        execute('go', { target: 'tonga', silent: true });
      },
    ],
    [
      /unknown|don't know|uncertain|fault/i,
      () => {
        if (
          Date.parse(runtime.getContext().time) <
          Date.parse(tongaSituation.timeline[3].time)
        )
          actions.run('time', { time: tongaSituation.timeline[3].time });
        lens('UNKNOWN');
        inspect('fault-unknown');
        execute('go', { target: 'tonga', silent: true });
      },
    ],
    [/reconstruct|full picture|all evidence/i, () => lens('ALL')],
    [/current reference|cable map/i, () => lens('CURRENT_REFERENCE')],
    [/follow|fiji|trace the connection/i, () => execute('follow')],
    [/why|dark|failure chain|what broke/i, () => execute('trace')],
    [/compare|before.*after/i, () => execute('compare')],
    [
      /recover|restor/i,
      () => {
        actions.run('time', { time: tongaSituation.timeline[5].time });
        runtime.setLens('ALL');
        execute('go', { target: 'tonga' });
        narrative(
          'Cable repair reported; Cloudflare traffic returned toward earlier levels.',
        );
      },
    ],
    [/replay|walk.*through|show me what happened/i, () => execute('replay')],
    [
      /eruption|volcano/i,
      () => {
        actions.run('time', { time: tongaSituation.timeline[2].time });
        runtime.setLens('ALL');
        execute('go', { target: 'volcano' });
      },
    ],
    [
      /source|how do we know|evidence/i,
      () =>
        inspect(
          runtime.getContext().selectedId ||
            runtime.getContext().records.find((r) => r.status === 'OBSERVED')
              ?.id ||
            'international-cable',
        ),
    ],
    [/tonga|take me there/i, () => execute('go', { target: 'tonga' })],
  ];
  $('#reality-command-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#reality-command');
    const command = input.value.trim();
    input.value = '';
    const match = textActions.find(([pattern]) => pattern.test(command));
    if (match) match[1]();
    else
      narrative(
        'Try: follow cable, observed only, why did Tonga go dark, compare before and after, or show recovery.',
      );
  });
  const pick = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  pick.setInputAction((event) => {
    const hit = viewer.scene.pick(event.position);
    const id = hit?.id?.id?.replace(/^reality-/, '');
    if (id && world.has(id)) {
      execute('go', { target: id });
      inspect(id);
    } else if (id === 'fault-unknown') {
      inspect(id);
    } else if (
      id?.startsWith('tonga-cable-') ||
      id?.startsWith('tonga-domestic')
    ) {
      inspect(
        id.startsWith('tonga-cable-')
          ? 'international-cable'
          : 'domestic-cable',
      );
      if (id.startsWith('tonga-cable-')) execute('follow');
      else execute('go', { target: 'tonga', silent: true });
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  const stopOnInteraction = () => {
    actions.cancel();
    motion.cancel();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      stopOnInteraction();
      evidence.hidden = true;
    }
  };
  document.addEventListener('keydown', onKeyDown);
  viewer.canvas.addEventListener('pointerdown', stopOnInteraction);
  viewer.canvas.addEventListener('wheel', stopOnInteraction, { passive: true });
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    story?.destroy();
    actions.destroy();
    motion.destroy();
    unsub();
    runtime.destroy();
    worldEvidence.destroy();
    unsubscribeVoice?.();
    if (ownsVoice) voiceSession?.stop();
    handoff?.();
    pick.destroy();
    motionQuery.removeEventListener('change', onMotion);
    viewer.canvas.removeEventListener('pointerdown', stopOnInteraction);
    viewer.canvas.removeEventListener('wheel', stopOnInteraction);
    document.removeEventListener('keydown', onKeyDown);
    viewer.dataSources.remove(source, true);
    viewer.dataSources.remove(land, true);
    viewer.scene.globe.baseColor = originalBaseColor;
    root.remove();
    document.body.classList.remove('reality-active');
    delete window.__realityDebugger;
    signal?.removeEventListener('abort', destroy);
    onDestroy?.();
  };
  signal?.addEventListener('abort', destroy, { once: true });
  story = createStoryPlayer({
    root,
    viewer,
    runtime,
    actions,
    inspect,
    presentationChanged: () => update(runtime.getContext()),
  });
  window.__realityDebugger = { runtime, actions, destroy, inspect, story };
  await execute('go', { target: 'pacific' });
  return { destroy, runtime, actions };
}
