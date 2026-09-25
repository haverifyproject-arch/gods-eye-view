import * as Cesium from 'cesium';
import { getSelectedEntityContext } from '../data/contextStore.js';
import { flyRoute, interruptCameraMotionIfActive } from '../cameraVerbs.js';
import {
  assessInvestigation,
  serializeInvestigation,
} from './investigation.js';
import {
  buildDebugRelations,
  coordinatesOf,
  containsPoint,
  visibleEvidence,
} from './debugRelations.js';

const OWNER = 'reality-debug';
const INTERNET = 'internet-health';
const CABLES = 'telegeography-submarine-cables';
const PHYSICAL = ['earthquakes', 'local-firms', 'ais-live-vessels'];
const provenanceList = (value) =>
  Array.isArray(value)
    ? value
    : value
      ? [
          {
            label: value.publisher || value.label || 'Source',
            url: value.url,
            retrievedAt: value.retrievedAt,
            time: value.windowStart
              ? `${value.windowStart} – ${value.windowEnd}`
              : value.time,
            detail: value.rights || value.detail,
          },
        ]
      : [];

/** Temporary investigation data only. Selection, layers, camera and marks remain native GEV services. */
export function createWorldDebug({
  viewer,
  dataManager,
  annotations,
  styleManager,
  signalSource = null,
}) {
  const listeners = new Set();
  const enabledHere = new Set();
  let generation = 0;
  let commandEpoch = 0;
  let controller = null;
  let disposed = false;
  let pendingReset = Promise.resolve();
  let navigationRequest = null;
  let navigationEpoch = null;
  let state = {
    status: 'idle',
    selected: null,
    subject: null,
    summary: 'Select an object or debug the current view.',
    filter: 'all',
    relationships: [],
    inspected: null,
    unknowns: [],
    errors: [],
  };
  const layer = (id) => dataManager.layers.get(id)?.module;
  const selected = () => getSelectedEntityContext({ dataManager });
  const brief = (record) =>
    record
      ? {
          id: record.id,
          label: record.label || record.name || record.id,
          layerId: record.layerId,
        }
      : null;
  const publish = () => {
    state = { ...state, selected: brief(selected()) };
    for (const listener of listeners) listener(state);
    return state;
  };
  const selectionChanged = () => {
    const current = selected();
    if (current?.id !== state.selected?.id)
      state = {
        ...state,
        inspected: null,
        investigation: null,
        progress: null,
      };
    if (current) commandEpoch++;
    if (state.subject && current?.id !== state.subject.id) {
      generation++;
      commandEpoch++;
      controller?.abort();
      clearMarks();
      interruptCameraMotionIfActive(
        state.followMotionId,
        'debug-selection-changed',
      );
      state = {
        ...state,
        status: 'idle',
        subject: null,
        relationships: [],
        inspected: null,
        unknowns: [],
        errors: [],
        summary: 'Selection changed. Debug this object to inspect its context.',
      };
    }
    publish();
  };
  window.addEventListener('gev:entity-selected', selectionChanged);
  window.addEventListener('gev:entity-selection-cleared', selectionChanged);
  window.addEventListener('gev:awareness-subject-selected', selectionChanged);
  const unsubscribe = dataManager.subscribeVisibilityRequests?.((change) => {
    if (change.origin !== OWNER) enabledHere.delete(change.layerId);
  });
  const enable = async (id, current = () => true) => {
    await pendingReset;
    if (disposed || !current()) return;
    if (!dataManager.isEnabled(id)) {
      enabledHere.add(id);
      await dataManager.setEnabled(id, true, { origin: OWNER });
    }
  };
  const clearMarks = () => {
    annotations.removeOwned(OWNER);
    annotations.removeOwned('reality-finding');
  };
  const reset = async () => {
    const token = ++generation;
    controller?.abort();
    controller = null;
    clearMarks();
    if (state.following)
      interruptCameraMotionIfActive(state.followMotionId, 'debug-cleared');
    const restore = [...enabledHere];
    enabledHere.clear();
    state = {
      ...state,
      subject: null,
      relationships: [],
      inspected: null,
      status: 'idle',
    };
    pendingReset = Promise.allSettled([
      pendingReset,
      ...restore.map((id) =>
        dataManager.setEnabled(id, false, { origin: OWNER }),
      ),
    ]);
    await pendingReset;
    if (token !== generation || disposed) return state;
    state = {
      ...state,
      status: 'idle',
      investigation: null,
      progress: null,
      subject: null,
      relationships: [],
      inspected: null,
      unknowns: [],
      errors: [],
      following: false,
      filter: 'all',
      summary: 'Investigation cleared. Explore or select another object.',
    };
    return publish();
  };
  const resolveSubject = () => {
    const record = selected();
    if (record?.layerId === INTERNET) {
      const disruption = layer(INTERNET)
        ?.getDebugRecords()
        .find((item) => item.id === record.id);
      if (disruption) return { ...disruption, layerId: INTERNET };
    }
    if (record) {
      const p = coordinatesOf(record) || coordinatesOf(record.properties);
      if (p)
        return {
          ...brief(record),
          ...p,
          radiusKm: 150,
          properties: record.properties,
          evidenceState: record.properties?.evidenceState || 'UNKNOWN',
          provenance: record.properties?.provenance || [
            {
              label: record.source || record.layerName,
              url: record.properties?.sourceUrl || record.properties?.url,
              time: record.properties?.timeMs
                ? new Date(record.properties.timeMs).toISOString()
                : null,
            },
          ],
          source: record.source,
        };
    }
    const canvas = viewer.scene.canvas;
    const cartesian = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2),
      viewer.scene.globe.ellipsoid,
    );
    if (!cartesian)
      throw new Error('Point the camera at Earth or select an object first.');
    const p = Cesium.Cartographic.fromCartesian(cartesian);
    return {
      id: 'current-view',
      label: 'Current view · 150 km search radius',
      lat: Cesium.Math.toDegrees(p.latitude),
      lon: Cesium.Math.toDegrees(p.longitude),
      radiusKm: 150,
    };
  };
  const inspect = (id) => {
    const relationship = state.relationships.find(
      (item) => item.id === (id || state.inspected?.id),
    );
    const subject = selected() ? resolveSubject() : state.subject;
    state = {
      ...state,
      inspected: relationship || {
        id: subject?.id || 'selection',
        label: subject?.label || 'Current selection',
        state: subject?.evidenceState || 'UNKNOWN',
        explanation: subject?.geometry
          ? 'Country-level IODA anomaly. The outline is geographic reference, not a measured outage footprint. Recovery and affected ASNs are not established.'
          : 'Inspect the native selected object and available source metadata.',
        provenance: provenanceList(subject?.provenance),
      },
    };
    return publish();
  };
  const stage = async (token, current) => {
    for (const relationship of state.relationships) {
      if (token !== generation || disposed || !current()) return;
      const onSelect = () => inspect(relationship.id);
      const color =
        relationship.state === 'OBSERVED'
          ? 'cyan'
          : relationship.state === 'INFERRED'
            ? 'amber'
            : 'primary';
      const badge =
        {
          CURRENT_REFERENCE: 'REF',
          OBSERVED: 'OBS',
          DERIVED: 'DERIVED',
          INFERRED: 'POSSIBLE',
        }[relationship.state] || relationship.state;
      const label = `${badge} · ${relationship.label.length > 30 ? `${relationship.label.slice(0, 29)}…` : relationship.label}`;
      const specs = relationship.parts.length
        ? relationship.parts.slice(0, 1).map((path) => ({
            type: 'route',
            path,
            manual: true,
            label,
            color,
            evidenceState: relationship.state,
            onSelect,
          }))
        : relationship.point
          ? [
              {
                type: 'pin',
                manual: true,
                longitude: relationship.point.lon,
                latitude: relationship.point.lat,
                label,
                color,
                evidenceState: relationship.state,
                onSelect,
              },
            ]
          : [];
      if (!specs.length) continue;
      const result = await annotations.annotate(specs, {
        owner: OWNER,
        persist: true,
        flyTo: false,
        autoFrame: false,
      });
      if (token !== generation || disposed || !current()) {
        annotations.remove(result.ids);
        return;
      }
      relationship.annotationIds = result.ids;
      relationship.visible = visibleEvidence(relationship.state, state.filter);
      annotations.setVisible(result.ids, relationship.visible);
    }
  };
  const investigate = async (current) => {
    const token = ++generation;
    controller?.abort();
    controller = new AbortController();
    clearMarks();
    const subject = resolveSubject();
    state = {
      ...state,
      status: 'loading',
      subject,
      inspected: null,
      relationships: [],
      errors: [],
      unknowns: [],
      summary: `Inspecting ${subject.label || subject.name} against available native sources…`,
      investigation: assessInvestigation({ subject, relationships: [] }),
      progress: {
        label: 'Finding relevant infrastructure and physical observations',
        completed: 0,
        total: 2,
      },
    };
    publish();
    const outcomes = await Promise.allSettled([
      layer(CABLES)?.loadDebugRecords({
        signal: controller.signal,
        limit: 3000,
      }),
      enable('earthquakes', () => token === generation && current()),
      layer('local-datacenters')?.loadDebugRecords?.({
        signal: controller.signal,
        limit: 5000,
      }),
    ]);
    if (token !== generation || disposed || !current()) return state;
    const references =
      outcomes[0].status === 'fulfilled' ? outcomes[0].value || [] : [];
    const errors = outcomes.flatMap((item) =>
      item.status === 'rejected'
        ? [String(item.reason?.message || item.reason)]
        : [],
    );
    const physical = PHYSICAL.flatMap((id) =>
      dataManager.isEnabled(id)
        ? (layer(id)?.getAnalystRecords?.(2000) || []).map((record) => ({
            ...record,
            layerId: id,
            evidenceState: 'OBSERVED',
            source: id === 'earthquakes' ? 'USGS' : id,
            sourceUrl:
              id === 'earthquakes'
                ? `https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(record.id)}`
                : null,
          }))
        : [],
    );
    const facilities =
      outcomes[2]?.status === 'fulfilled' ? outcomes[2].value || [] : [];
    physical.push(...facilities);
    const plan = buildDebugRelations({ subject, references, physical });
    // Reverse discovery uses the same enabled native outage layer, never a
    // synthetic point outage at the earthquake/facility location.
    const position = coordinatesOf(subject);
    if (position && dataManager.isEnabled(INTERNET)) {
      for (const record of (layer(INTERNET)?.getDebugRecords() || [])
        .filter((record) => containsPoint(record.geometry, position))
        .slice(0, 2)) {
        plan.relationships.unshift({
          id: `internet:${record.id}`,
          recordId: record.id,
          label: record.label,
          state: 'OBSERVED',
          kind: 'internet',
          parts: [],
          point: null,
          visible: true,
          explanation:
            'IODA detected a country-level anomaly in the country containing this selected point. The native country polygon shows the aggregation scope; this does not establish an outage at this point or any causal link.',
          provenance: provenanceList(record.provenance),
          evidenceNeeded:
            'Local network measurements are needed to establish whether this selected object or location was affected.',
        });
      }
    }
    state = {
      ...state,
      ...plan,
      status: 'ready',
      errors,
      summary: `${subject.label || subject.name}: ${plan.relationships.filter((item) => item.kind === 'cable').length} cable references, ${plan.relationships.filter((item) => item.kind === 'facility').length} facility references and ${plan.relationships.filter((item) => item.kind === 'physical').length} loaded physical observations in scope. No cause or affected network is established.${errors.length ? ' Some sources failed; coverage is incomplete.' : ''}`,
    };
    await stage(token, current);
    if (token !== generation || disposed || !current()) return state;
    publish();
    if (signalSource && subject.countryCode) await verify(current, token);
    else state = { ...state, progress: null };
    return publish();
  };
  const verify = async (current, inheritedToken = null) => {
    const subject = state.subject || resolveSubject();
    if (!subject.countryCode || !signalSource) {
      state = {
        ...state,
        investigation: assessInvestigation({
          subject,
          relationships: state.relationships,
        }),
        progress: null,
        summary:
          'Select an Internet anomaly to compare measured signals. This object remains available for spatial investigation.',
      };
      return publish();
    }
    const token = inheritedToken ?? ++generation;
    if (inheritedToken === null) {
      controller?.abort();
      controller = new AbortController();
    }
    const previous = state.investigation;
    state = {
      ...state,
      subject,
      status: 'loading',
      inspected: null,
      progress: {
        label:
          'Comparing routing visibility and active probing against their baselines',
        completed: 1,
        total: 2,
      },
    };
    publish();
    let signalEvidence;
    try {
      signalEvidence = await signalSource.inspect(subject.countryCode, {
        signal: controller.signal,
      });
    } catch (error) {
      if (token !== generation || !current()) return state;
      signalEvidence = {
        checks: [],
        errors: [error.message],
        status: 'unavailable',
      };
    }
    if (token !== generation || !current()) return state;
    const investigation = assessInvestigation({
      subject,
      signalEvidence,
      relationships: state.relationships,
      previous,
    });
    state = {
      ...state,
      investigation,
      status: 'ready',
      progress: null,
      summary: investigation.headline,
    };
    // A compact world-anchored finding replaces the provisional interpretation.
    // The anchor is cartographic, never a fabricated measurement location.
    const anchor = subject.displayAnchor;
    annotations.removeOwned('reality-finding');
    if (anchor) {
      const result = await annotations.annotate(
        {
          type: 'pin',
          manual: true,
          longitude: anchor.longitude,
          latitude: anchor.latitude,
          label: `${investigation.verdict.toUpperCase()} · ${subject.name || subject.countryCode}`,
          color:
            investigation.verdict === 'corroborated'
              ? 'red'
              : investigation.verdict === 'mixed'
                ? 'amber'
                : 'cyan',
          evidenceState: 'DERIVED',
          onSelect: () => {
            state = { ...state, inspected: null };
            publish();
          },
        },
        {
          owner: 'reality-finding',
          persist: true,
          flyTo: false,
          autoFrame: false,
        },
      );
      if (token !== generation || !current()) annotations.remove(result.ids);
      else {
        state.findingIds = result.ids;
        annotations.setVisible(
          result.ids,
          visibleEvidence('DERIVED', state.filter),
        );
      }
    }
    return publish();
  };
  const filter = (value) => {
    state = { ...state, filter: value };
    for (const relation of state.relationships) {
      relation.visible = visibleEvidence(relation.state, value);
      annotations.setVisible(relation.annotationIds || [], relation.visible);
    }
    annotations.setVisible(
      state.findingIds || [],
      visibleEvidence('DERIVED', value),
    );
    return publish();
  };
  const another = async (request, current) => {
    await enable(INTERNET, () => request === commandEpoch && current());
    if (request !== commandEpoch || disposed || !current()) return state;
    const records = layer(INTERNET)?.getDebugRecords() || [];
    if (!records.length)
      throw new Error(
        'No recent country detections are loaded. Check Internet Health source status.',
      );
    const index = records.findIndex((record) => record.id === selected()?.id);
    const next = records[(index + 1) % records.length];
    await reset();
    if (request !== commandEpoch || disposed || !current()) return state;
    // Preserve the explicitly requested native layer across the investigation clear.
    await dataManager.setEnabled(INTERNET, true, { origin: 'user' });
    if (request !== commandEpoch || disposed || !current()) return state;
    layer(INTERNET).selectById(next.id);
    navigationRequest = request;
    navigationEpoch = commandEpoch;
    const target = viewer.selectedEntity;
    styleManager._runExplicitNavigation('Internet Health selection', () =>
      viewer.flyTo(target, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, -Math.PI / 2, 2200000),
      }),
    );
    state = {
      ...state,
      summary: `${next.label}. Select Debug this to inspect available context.`,
    };
    return publish();
  };
  const follow = () => {
    const relation =
      state.inspected?.kind === 'cable'
        ? state.inspected
        : state.relationships.find(
            (item) => item.kind === 'cable' && item.visible,
          );
    if (!relation?.parts?.length)
      throw new Error(
        'Inspect a revealed cable first. No cable route is available in this scope.',
      );
    const path = relation.parts[0];
    const result = flyRoute(
      [
        {
          type: 'route',
          label: relation.label,
          path: path.map(([lon, lat]) => ({ lon, lat })),
        },
      ],
      { profile: 'infrastructure' },
      null,
      (go) => styleManager._runExplicitNavigation('follow cable', go),
    );
    state = {
      ...state,
      following: result.ok,
      followMotionId: result.motionId,
      inspected: relation,
      summary: `Following one mapped segment of ${relation.label}. This is current reference geometry, not a measured fault or traffic path.`,
    };
    publish();
    return result;
  };
  const api = {
    getState: () => state,
    subscribe(callback) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    },
    async run(args = {}, options = {}) {
      const request = ++commandEpoch;
      const current = () =>
        !disposed &&
        !options.signal?.aborted &&
        (typeof options.isCurrent !== 'function' || options.isCurrent());
      if (!current()) return { ok: false, cancelled: true };
      const cancel = () => {
        if (request !== commandEpoch) return;
        generation++;
        controller?.abort();
        clearMarks();
        state = {
          ...state,
          status: 'idle',
          relationships: [],
          inspected: null,
          investigation: null,
          progress: null,
          summary: 'Investigation interrupted.',
        };
        publish();
      };
      options.signal?.addEventListener('abort', cancel, { once: true });
      try {
        const action = args.action || 'debug';
        if (action === 'clear') return await reset();
        if (action === 'explore') {
          await another(request, current);
          if (
            !current() ||
            !selected() ||
            navigationRequest !== request ||
            navigationEpoch !== commandEpoch
          )
            return publish();
          return await investigate(current);
        }
        if (action === 'verify') return await verify(current);
        if (action === 'export')
          return {
            ok: true,
            filename: `reality-debugger-${state.subject?.countryCode || 'investigation'}.md`,
            markdown: serializeInvestigation({
              subject: state.subject,
              investigation: state.investigation,
              relationships: state.relationships,
            }),
          };
        if (action === 'debug' || action === 'infrastructure')
          return await investigate(current);
        if (action === 'sources')
          return inspect(args.id || args.relationshipId);
        if (action === 'another') return await another(request, current);
        if (action === 'follow') return follow();
        if (action === 'filter') return filter(args.filter);
        if (
          [
            'all',
            'observed',
            'reported',
            'hide_reference',
            'clear_inference',
          ].includes(action)
        )
          return filter(action);
        if (action === 'context' && selected()?.id !== state.subject?.id)
          inspect();
        return publish();
      } catch (error) {
        if (request !== commandEpoch || disposed)
          return {
            ok: false,
            error: 'Superseded by a newer selection or action',
          };
        state = {
          ...state,
          status: 'error',
          progress: null,
          summary: error.message,
          errors: [error.message],
        };
        publish();
        return { ok: false, error: error.message };
      } finally {
        options.signal?.removeEventListener('abort', cancel);
      }
    },
    destroy() {
      disposed = true;
      generation++;
      controller?.abort();
      interruptCameraMotionIfActive(state.followMotionId, 'debug-destroyed');
      clearMarks();
      unsubscribe?.();
      window.removeEventListener('gev:entity-selected', selectionChanged);
      window.removeEventListener(
        'gev:entity-selection-cleared',
        selectionChanged,
      );
      window.removeEventListener(
        'gev:awareness-subject-selected',
        selectionChanged,
      );
      listeners.clear();
    },
  };
  return {
    ...api,
    async run(args = {}, options = {}) {
      const result = await api.run(args, options);
      if (!result?.relationships) return result;
      // Agent responses must not contain country rings, route vertices or Cesium carriers.
      const evidence = (item) =>
        item
          ? {
              id: item.id,
              label: item.label,
              state: item.state,
              visible: item.visible,
              explanation: item.explanation,
              provenance: item.provenance,
              evidenceNeeded: item.evidenceNeeded,
            }
          : null;
      return {
        ok: result.status !== 'error',
        status: result.status,
        selected: result.selected,
        subject: brief(result.subject),
        investigation: result.investigation,
        progress: result.progress,
        summary: result.summary,
        filter: result.filter,
        relationships: result.relationships.map(evidence),
        inspected: evidence(result.inspected),
        unknowns: result.unknowns,
        errors: result.errors,
      };
    },
  };
}
