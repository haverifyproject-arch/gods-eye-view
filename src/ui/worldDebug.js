/** Compact, temporary investigation controls over the native world services. */
export function createWorldDebugUI({ service, host = document.body }) {
  const root = document.createElement('div');
  root.id = 'world-debug';
  root.innerHTML = `<div class="world-debug-bar"><button data-debug-action="explore" class="world-debug-entry"><span class="world-debug-eyebrow">REALITY DEBUGGER</span><span id="world-debug-entry-label">Investigate an Internet anomaly <span aria-hidden="true">↗</span></span></button><button data-debug-action="debug" id="world-debug-selected" hidden>Debug this</button><button id="world-debug-details" aria-label="Open investigation controls" aria-expanded="false">⋯</button></div>
    <section id="world-debug-popover" hidden aria-label="Current investigation"><header><span class="world-debug-eyebrow">REALITY DEBUGGER / LIVE EVIDENCE</span><button id="world-debug-close" aria-label="Close investigation controls">×</button></header><h2 id="world-debug-subject"></h2><p id="world-debug-summary" role="status" aria-live="polite"></p><div id="world-debug-progress" role="status" hidden></div><div id="world-debug-investigation"></div><div class="world-debug-primary"><button data-debug-action="verify">Check again</button><button data-debug-action="export">Save findings</button></div><details id="world-debug-world-controls"><summary>Inspect the world & sources</summary><div class="world-debug-actions"><select id="world-debug-filter" aria-label="Evidence filter"><option value="all">All evidence</option><option value="observed">Observed only</option><option value="reported">Observed + reported</option><option value="hide_reference">Hide current reference</option><option value="clear_inference">Clear inference</option></select><button data-debug-action="sources">Sources</button><button data-debug-action="follow">Follow cable</button><button data-debug-action="clear">Clear</button></div><div id="world-debug-relationships"></div></details><div id="world-debug-evidence"></div><p id="world-debug-limits"></p><footer>Source-backed checks · You control the world</footer></section>`;
  const style = document.createElement('style');
  style.textContent = `#world-debug{position:fixed;right:20px;bottom:110px;z-index:205;font:12px system-ui;color:#e4f1f2;--debug-line:#38505b}#world-debug *{box-sizing:border-box}#world-debug button{font:inherit;color:inherit;background:#10252ef2;border:1px solid var(--debug-line);border-radius:6px;padding:8px 10px;cursor:pointer}#world-debug button:hover,#world-debug button:focus-visible,#world-debug select:focus-visible{border-color:#91e4d6;outline:1px solid #91e4d6}#world-debug button:disabled{opacity:.45;cursor:default}#world-debug button[hidden]{display:none}#world-debug .world-debug-entry{text-align:left;border-color:#6ca99e;padding:11px 14px;background:linear-gradient(120deg,#153c40f5,#0b202bf5);box-shadow:0 4px 24px #0005}#world-debug-entry-label{display:block;font-size:13px;font-weight:550;margin-top:5px}.world-debug-eyebrow{font-size:9px;letter-spacing:1.6px;color:#92c7c3;font-weight:650}.world-debug-bar,.world-debug-actions,.world-debug-primary{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.world-debug-bar{justify-content:flex-end}#world-debug-popover{position:absolute;bottom:77px;right:0;width:350px;max-height:min(560px,calc(100dvh - 235px));overflow:auto;overscroll-behavior:contain;background:#081923f7;border:1px solid var(--debug-line);border-radius:10px;padding:16px;box-shadow:0 14px 48px #0007;scrollbar-width:thin}#world-debug-popover[hidden]{display:none}#world-debug header{display:flex;justify-content:space-between;align-items:center;gap:8px}#world-debug header button{border:0;background:none;font-size:20px;padding:0 3px}#world-debug h2{font-size:21px;letter-spacing:-.5px;margin:12px 0 6px;font-weight:550}#world-debug p{line-height:1.5;margin:8px 0}#world-debug-summary{color:#b3cad3}#world-debug-progress{color:#a8eddd;border-left:2px solid #83d5c2;padding:7px 10px;margin:10px 0;background:#17332d}.world-debug-primary{margin:14px 0}#world-debug .world-debug-primary button:first-child{background:#c0ecdf;color:#102b2a;border-color:#c0ecdf}.world-debug-actions{margin:8px 0}#world-debug summary{cursor:pointer;color:#b8d0d6;padding:6px 0}#world-debug-world-controls{border-top:1px solid var(--debug-line);padding-top:6px}#world-debug-relationships{display:grid;gap:5px}#world-debug-relationships button{text-align:left;font-size:11px}#world-debug-evidence{border-top:1px solid var(--debug-line);margin-top:10px;padding-top:10px}#world-debug-evidence:empty{display:none}#world-debug-evidence a{color:#a4edde}#world-debug-evidence small{display:block;color:#adbec4;line-height:1.4;margin:4px 0}#world-debug select{font:inherit;color:#dcebed;background:#10252e;border:1px solid var(--debug-line);border-radius:4px;padding:7px;width:100%}#world-debug-evidence strong{display:block;margin-bottom:5px}#world-debug-limits{color:#c4b899;font-size:11px}#world-debug footer{font-size:9px;letter-spacing:.3px;color:#829ca7;margin-top:14px}.world-debug-verdict{display:inline-block;padding:4px 7px;border:1px solid #748d76;color:#cadcb5;font-size:10px;text-transform:uppercase;letter-spacing:.8px;border-radius:3px}.world-debug-headline{font-size:15px;color:#edf5f4}.world-debug-checks{list-style:none;padding:0;margin:12px 0}.world-debug-checks li{padding:8px 0;border-bottom:1px solid #213741}.world-debug-checks strong{display:block;font-size:12px;font-weight:550}.world-debug-checks small{display:block;color:#a8bec7;line-height:1.45;margin-top:3px}.world-debug-revision{border-left:2px solid #e2ba71;padding:2px 0 2px 11px;margin:12px 0}.world-debug-revision small{color:#d7bd8e;text-transform:uppercase;font-size:9px;letter-spacing:1px}.world-debug-revision p{font-size:12px}.world-debug-next{background:#102c34;border-radius:5px;padding:9px 11px;margin:10px 0}.world-debug-next strong{font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:#9ad6cd}.world-debug-next p{margin:5px 0 0;font-size:12px}@media(max-width:600px){#world-debug{right:12px;bottom:102px;max-width:calc(100vw - 24px)}#world-debug-popover{width:min(350px,calc(100vw - 24px));max-height:calc(100dvh - 220px);padding:13px}.world-debug-eyebrow{font-size:8px}#world-debug-entry-label{font-size:12px}}`;
  host.append(style, root);
  const $ = (selector) => root.querySelector(selector);
  const panel = $('#world-debug-popover');
  let latest = service.getState();
  let lastInspected = null;
  let disposed = false;
  const textOf = (value) =>
    typeof value === 'string'
      ? value
      : value?.detail || value?.explanation || value?.label || '';
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const open = (show) => {
    panel.hidden = !show;
    $('#world-debug-details').setAttribute('aria-expanded', String(show));
  };
  const run = async (args) => {
    if (args.action !== 'clear') open(true);
    try {
      const result = await service.run(args);
      if (disposed) return;
      if (args.action === 'clear') open(false);
      if (args.action === 'export' && result?.markdown) {
        const url = URL.createObjectURL(
          new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'reality-debugger-findings.md';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      if (!disposed) {
        open(true);
        $('#world-debug-summary').textContent =
          error.message || 'Investigation unavailable';
      }
    }
  };
  const render = (state) => {
    if (disposed) return;
    latest = state;
    const busy = state.status === 'loading' || !!state.progress;
    const investigation = state.investigation;
    $('#world-debug-subject').textContent = (
      state.subject?.label ||
      state.selected?.label ||
      'Find a change. Check the evidence.'
    ).replace(' · Internet observations', '');
    $('#world-debug-summary').hidden = !!investigation && !busy;
    $('#world-debug-summary').textContent =
      state.status === 'loading'
        ? state.progress?.label || 'Checking available evidence…'
        : state.summary ||
          'Explore a recent connectivity anomaly, then inspect what the evidence can establish.';
    $('#world-debug-selected').hidden = !state.selected;
    $('#world-debug-entry-label').textContent = state.subject
      ? 'Explore another anomaly ↗'
      : 'Investigate an Internet anomaly ↗';
    $('#world-debug-filter').value = state.filter || 'all';
    const progress = $('#world-debug-progress');
    progress.hidden = !state.progress;
    progress.textContent = state.progress
      ? [
          state.progress.label,
          Number.isFinite(state.progress.completed) && state.progress.total
            ? `${state.progress.completed}/${state.progress.total} checks`
            : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : '';
    for (const action of ['verify', 'export'])
      root.querySelector(`[data-debug-action="${action}"]`).disabled =
        busy || !investigation;
    const findings = $('#world-debug-investigation');
    findings.replaceChildren();
    if (investigation) {
      const verdict =
        typeof investigation.verdict === 'string'
          ? investigation.verdict.replaceAll('-', ' ')
          : textOf(investigation.verdict);
      if (verdict)
        findings.append(element('span', verdict, 'world-debug-verdict'));
      if (investigation.headline)
        findings.append(
          element('p', investigation.headline, 'world-debug-headline'),
        );
      const checks = element('ul', '', 'world-debug-checks');
      for (const check of investigation.checks || []) {
        const row = document.createElement('li');
        row.append(
          element('strong', check.label || check.name || 'Evidence check'),
        );
        row.append(
          element(
            'small',
            [
              check.status?.replaceAll('_', ' '),
              check.detail || check.explanation,
            ]
              .filter(Boolean)
              .join(' · '),
          ),
        );
        const samples = check.samples || [];
        const values = samples
          .map((sample) => sample.value)
          .filter(Number.isFinite);
        if (samples.length > 1 && values.length) {
          const maximum = Math.max(...values, 1);
          const from = samples[0].at;
          const duration = Math.max(1, samples.at(-1).at - from);
          const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          );
          svg.setAttribute('viewBox', '0 0 300 40');
          svg.setAttribute('role', 'img');
          svg.setAttribute(
            'aria-label',
            `${check.label} over the queried window. Zero baseline; gaps indicate missing samples.`,
          );
          svg.style.cssText =
            'display:block;width:100%;height:40px;margin-top:6px;border-bottom:1px solid #38505b';
          const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          );
          let connected = false;
          let commands = '';
          for (const sample of samples) {
            if (!Number.isFinite(sample.value)) {
              connected = false;
              continue;
            }
            commands += `${connected ? 'L' : 'M'}${(((sample.at - from) / duration) * 300).toFixed(2)},${(38 - (sample.value / maximum) * 35).toFixed(2)} `;
            connected = true;
          }
          path.setAttribute('d', commands);
          path.setAttribute('fill', 'none');
          path.setAttribute(
            'stroke',
            check.comparison === 'lower' ? '#e6bc78' : '#93d8cd',
          );
          path.setAttribute('stroke-width', '1.5');
          svg.append(path);
          row.append(
            svg,
            element(
              'small',
              `0–${maximum.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${check.unit || ''} · gaps = missing`,
            ),
          );
          if (
            Number.isFinite(check.baseline?.median) &&
            Number.isFinite(check.recent?.median)
          )
            row.append(
              element(
                'small',
                `Median: ${check.baseline.median.toLocaleString()} → ${check.recent.median.toLocaleString()} · preceding 22h → last 2h`,
              ),
            );
        }
        if (check.sourceUrl?.startsWith('https:')) {
          const source = element('a', 'Inspect measurement source ↗');
          source.href = check.sourceUrl;
          source.target = '_blank';
          source.rel = 'noopener noreferrer';
          source.style.cssText =
            'color:#a4edde;font-size:10px;display:inline-block;margin-top:5px';
          row.append(source);
        }
        checks.append(row);
      }
      const revision = investigation.revision;
      if (revision) {
        const block = element('div', '', 'world-debug-revision');
        block.append(element('small', 'What changed after checking'));
        const before = revision.before || revision.from;
        const after = revision.after || revision.to;
        if (before) block.append(element('p', `Before: ${textOf(before)}`));
        if (after) block.append(element('p', `Now: ${textOf(after)}`));
        block.append(
          element(
            'p',
            typeof revision === 'string' ? revision : revision.reason || '',
          ),
        );
        findings.append(block);
      }
      if (investigation.nextCheck) {
        const next = element('div', '', 'world-debug-next');
        next.append(
          element('strong', 'Next useful check'),
          element('p', textOf(investigation.nextCheck)),
        );
        if (investigation.nextCheck.reason)
          next.append(element('p', investigation.nextCheck.reason));
        if (['verify', 'sources'].includes(investigation.nextCheck.action)) {
          const action = element(
            'button',
            investigation.nextCheck.action === 'verify'
              ? 'Run check'
              : 'Inspect source',
          );
          action.dataset.debugAction = investigation.nextCheck.action;
          action.disabled = busy;
          action.style.marginTop = '8px';
          next.append(action);
        }
        findings.append(next);
      }
      findings.append(checks);
    }
    const relationships = $('#world-debug-relationships');
    relationships.replaceChildren();
    for (const relation of state.relationships || []) {
      if (relation.visible === false) continue;
      const button = element(
        'button',
        `${relation.state.replaceAll('_', ' ')} · ${relation.label}`,
      );
      button.dataset.debugAction = 'sources';
      button.dataset.relationshipId = relation.id;
      relationships.append(button);
    }
    const evidence = $('#world-debug-evidence');
    evidence.replaceChildren();
    if (state.inspected) {
      const relation = state.inspected;
      evidence.append(
        element(
          'strong',
          `${relation.state.replaceAll('_', ' ')} · ${relation.label}`,
        ),
        element('p', relation.explanation || ''),
      );
      const sourceDetails = document.createElement('details');
      sourceDetails.append(element('summary', 'Source timestamps & details'));
      for (const source of relation.provenance || []) {
        let url;
        try {
          url = new URL(source.url);
        } catch {
          /* Preserve missing URLs as plain provenance. */
        }
        const label = element(
          url?.protocol === 'https:' ? 'a' : 'span',
          source.label || 'Source',
        );
        if (label.tagName === 'A') {
          label.href = url.href;
          label.target = '_blank';
          label.rel = 'noopener noreferrer';
        }
        evidence.append(label, document.createElement('br'));
        sourceDetails.append(
          element('strong', source.label || 'Source'),
          element(
            'small',
            [
              source.detail,
              source.time && `Event/observation: ${source.time}`,
              source.retrievedAt && `Retrieved: ${source.retrievedAt}`,
            ]
              .filter(Boolean)
              .join(' · '),
          ),
        );
      }
      if ((relation.provenance || []).length) evidence.append(sourceDetails);
      if (relation.evidenceNeeded)
        evidence.append(
          element('p', `Still needed: ${relation.evidenceNeeded}`),
        );
      if (relation.id !== lastInspected) {
        open(true);
        queueMicrotask(() => {
          if (!disposed) evidence.scrollIntoView({ block: 'nearest' });
        });
      }
      lastInspected = relation.id;
    } else lastInspected = null;
    $('#world-debug-limits').textContent = [
      ...(investigation?.unknowns || state.unknowns || []),
      ...(state.errors || []),
    ]
      .map(textOf)
      .join(' ');
  };
  const click = (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'world-debug-close') return open(false);
    if (button.id === 'world-debug-details') return open(panel.hidden);
    if (button.dataset.debugAction)
      run({
        action: button.dataset.debugAction,
        ...(button.dataset.relationshipId
          ? { id: button.dataset.relationshipId }
          : {}),
      });
  };
  const change = (event) => {
    if (event.target.id === 'world-debug-filter')
      run({ action: event.target.value });
  };
  const keydown = (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      open(false);
      $('#world-debug-details').focus();
    }
  };
  root.addEventListener('change', change);
  root.addEventListener('click', click);
  root.addEventListener('keydown', keydown);
  const unsubscribe = service.subscribe(render);
  return {
    getState: () => latest,
    destroy() {
      disposed = true;
      unsubscribe();
      root.removeEventListener('click', click);
      root.removeEventListener('change', change);
      root.removeEventListener('keydown', keydown);
      root.remove();
      style.remove();
    },
  };
}
