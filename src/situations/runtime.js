import {
  RECORD_GROUPS,
  EVIDENCE_LENSES,
  validateSituation,
  utcMillis,
  visibleRecords,
} from './model.js';

const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

/** One mission's state, independent of DOM, Cesium, input modality or an LLM. */
export function createSituationRuntime(input) {
  const situation = freeze(validateSituation(structuredClone(input)));
  const records = new Map(
    RECORD_GROUPS.flatMap((group) => situation[group]).map((r) => [r.id, r]),
  );
  const listeners = new Set();
  let disposed = false;
  let state = {
    time: situation.timeRange.start,
    lens: 'ALL',
    selectedId: null,
    hiddenIds: [],
  };
  const context = () =>
    freeze({
      situationId: situation.id,
      ...structuredClone(state),
      ...visibleRecords(situation, state),
      selected: records.get(state.selectedId) || null,
    });
  const publish = () => {
    const snapshot = context();
    for (const listener of listeners) listener(snapshot);
    return snapshot;
  };
  const live = () => {
    if (disposed) throw new Error('Situation runtime has been disposed');
  };
  const runtime = {
    situation,
    getContext: context,
    subscribe(listener) {
      live();
      if (typeof listener !== 'function')
        throw new TypeError('Listener must be a function');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTime(time) {
      live();
      const instant = utcMillis(time);
      if (
        instant < utcMillis(situation.timeRange.start) ||
        instant >= utcMillis(situation.timeRange.end)
      ) {
        throw new RangeError('Time is outside this mission');
      }
      state = { ...state, time };
      return publish();
    },
    setLens(lens) {
      live();
      if (!Object.hasOwn(EVIDENCE_LENSES, lens))
        throw new RangeError('Unknown evidence lens');
      state = { ...state, lens };
      return publish();
    },
    select(id) {
      live();
      if (id !== null && !records.has(id))
        throw new RangeError('Unknown situation object');
      state = { ...state, selectedId: id };
      return publish();
    },
    setHidden(id, hidden) {
      live();
      if (!records.has(id)) throw new RangeError('Unknown situation object');
      const ids = new Set(state.hiddenIds);
      if (hidden) ids.add(id);
      else ids.delete(id);
      state = { ...state, hiddenIds: [...ids] };
      return publish();
    },
    inspect(id = state.selectedId) {
      const record = records.get(id);
      if (!record)
        throw new RangeError(
          'Select a situation object to inspect its evidence',
        );
      const ids = new Set([
        ...record.evidenceIds,
        ...(record.geometry?.evidenceIds || []),
      ]);
      const evidence = situation.evidence.filter((item) => ids.has(item.id));
      return freeze({
        record,
        evidence,
        sources: situation.sources.filter((source) =>
          evidence.some((item) => item.sourceId === source.id),
        ),
      });
    },
    reset() {
      live();
      state = {
        time: situation.timeRange.start,
        lens: 'ALL',
        selectedId: null,
        hiddenIds: [],
      };
      return publish();
    },
    destroy() {
      disposed = true;
      listeners.clear();
    },
  };
  return Object.freeze(runtime);
}

/** Shared text/voice/UI dispatcher. Camera adapters report completion, never assumed success. */
export function createSituationActions(runtime, presentation = {}) {
  let active = null;
  let disposed = false;
  const cancel = () => {
    active?.abort();
    active = null;
  };
  return {
    cancel,
    destroy() {
      disposed = true;
      cancel();
    },
    async run(action, args = {}, options = {}) {
      if (disposed)
        return {
          ok: false,
          action,
          error: 'Situation actions have been disposed',
        };
      if (options.signal?.aborted)
        return { ok: false, action, cancelled: true };
      const immediate = {
        context: () => runtime.getContext(),
        time: () => runtime.setTime(args.time),
        lens: () => runtime.setLens(args.lens),
        select: () => runtime.select(args.id),
        visibility: () => runtime.setHidden(args.id, args.hidden === true),
        evidence: () => runtime.inspect(args.id),
        reset: () => runtime.reset(),
        pause: () => runtime.getContext(),
      };
      try {
        if (Object.hasOwn(immediate, action)) {
          if (
            ['time', 'lens', 'select', 'visibility', 'reset', 'pause'].includes(
              action,
            )
          )
            cancel();
          return { ok: true, action, result: immediate[action]() };
        }
        if (
          !['go', 'follow', 'trace', 'replay', 'compare', 'annotate'].includes(
            action,
          ) ||
          typeof presentation[action] !== 'function'
        ) {
          return {
            ok: false,
            action,
            error: 'This situation action is unavailable',
          };
        }
        cancel();
        const controller = new AbortController();
        active = controller;
        const onAbort = () => controller.abort();
        options.signal?.addEventListener('abort', onAbort, { once: true });
        let settleAbort;
        const cancelled = new Promise((resolve) => {
          settleAbort = () => resolve(null);
        });
        controller.signal.addEventListener('abort', settleAbort, {
          once: true,
        });
        try {
          const operation = presentation[action](args, {
            signal: controller.signal,
            runtime,
            isCurrent: () =>
              active === controller && !controller.signal.aborted,
          });
          const result = await Promise.race([operation, cancelled]);
          if (controller.signal.aborted || active !== controller)
            return { ok: false, action, cancelled: true };
          if (result?.ok !== true)
            return {
              ok: false,
              action,
              error: result?.error || 'World action did not complete',
            };
          return { ...result, action };
        } finally {
          options.signal?.removeEventListener('abort', onAbort);
          controller.signal.removeEventListener('abort', settleAbort);
          if (active === controller) active = null;
        }
      } catch (error) {
        return {
          ok: false,
          action,
          error:
            error instanceof Error ? error.message : 'Situation action failed',
        };
      }
    },
  };
}
