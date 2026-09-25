/** Compact controls over the native selection and annotation services; never a mode. */
export function createWorldDebugUI({ service, host = document.body }) {
  const root = document.createElement('div');
  root.id = 'world-debug';
  root.innerHTML = `<div class="world-debug-bar"><button data-debug-action="debug">Debug this</button><button data-debug-action="another" title="Select another available disruption">Another</button><button id="world-debug-details" aria-label="Open investigation controls" aria-expanded="false">⋯</button></div>
    <section id="world-debug-popover" hidden aria-label="Current investigation"><header><strong>World investigation</strong><button id="world-debug-close" aria-label="Close investigation controls">×</button></header><p id="world-debug-subject"></p><p id="world-debug-summary" role="status"></p><div class="world-debug-actions"><select id="world-debug-filter" aria-label="Evidence filter"><option value="all">All evidence</option><option value="observed">Observed only</option><option value="reported">Observed + reported</option><option value="hide_reference">Hide current reference</option><option value="clear_inference">Clear inference</option></select><button data-debug-action="sources">Sources</button><button data-debug-action="follow">Follow cable</button><button data-debug-action="clear">Clear</button></div><div id="world-debug-evidence"></div><div id="world-debug-relationships"></div><p id="world-debug-limits"></p></section>`;
  const style = document.createElement('style');
  style.textContent = `#world-debug{position:fixed;right:20px;bottom:110px;z-index:205;font:12px system-ui;color:#dcebed}#world-debug button{font:inherit;color:inherit;background:#10252eea;border:1px solid #54727a;border-radius:4px;padding:7px 9px;cursor:pointer}#world-debug button:hover,#world-debug button:focus-visible{border-color:#8cf1ed;outline:1px solid #8cf1ed}#world-debug button[aria-pressed=true]{background:#265057}.world-debug-bar,.world-debug-actions{display:flex;gap:5px;flex-wrap:wrap}.world-debug-bar{justify-content:flex-end}#world-debug-popover{position:absolute;bottom:42px;right:0;width:294px;max-height:250px;overflow:auto;background:#071a23f5;border:1px solid #54727a;border-radius:6px;padding:12px;box-sizing:border-box}#world-debug-popover[hidden]{display:none}#world-debug header{display:flex;justify-content:space-between;align-items:center}#world-debug p{line-height:1.45;margin:8px 0}#world-debug-subject{font-weight:650}#world-debug-summary{color:#b5d6d8}.world-debug-actions{margin:8px 0}#world-debug-relationships{display:grid;gap:5px}#world-debug-relationships button{text-align:left}#world-debug-evidence{border-top:1px solid #35505a;margin-top:8px;padding-top:5px}#world-debug-evidence:empty{display:none}#world-debug-evidence a{color:#9de9ef}#world-debug-evidence small{display:block;color:#adbec4;line-height:1.4;margin:4px 0}#world-debug select{color:#dcebed;background:#10252e;border:1px solid #54727a;border-radius:4px;padding:5px;max-width:100%;width:100%}#world-debug.is-inspecting #world-debug-summary,#world-debug.is-inspecting #world-debug-subject{display:none}#world-debug.is-inspecting #world-debug-evidence{margin-top:4px}#world-debug-evidence summary{cursor:pointer;color:#adbec4;margin:6px 0}#world-debug-evidence details strong{font-size:11px;margin-top:6px}#world-debug-evidence strong{display:block;margin-bottom:5px}#world-debug-limits{color:#d6bd91;font-size:11px}@media(max-width:600px){#world-debug{right:12px;bottom:110px}#world-debug-popover{width:min(294px,calc(100vw - 24px));max-height:250px}}`;
  host.append(style, root);
  const $ = (selector) => root.querySelector(selector);
  const panel = $('#world-debug-popover');
  let latest = service.getState();
  let lastInspected = null;
  let disposed = false;
  const open = (show) => {
    panel.hidden = !show;
    $('#world-debug-details').setAttribute('aria-expanded', String(show));
  };
  const run = async (args) => {
    if (args.action !== 'another' && args.action !== 'clear') open(true);
    try {
      await service.run(args);
      if (args.action === 'clear') open(false);
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
    $('#world-debug-subject').textContent =
      state.subject?.label ||
      state.selected?.label ||
      'Select a world object, or inspect this view.';
    $('#world-debug-summary').textContent =
      state.status === 'loading'
        ? 'Checking available evidence…'
        : state.summary || '';
    for (const button of root.querySelectorAll(
      '[data-debug-action="observed"], [data-debug-action="all"]',
    ))
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.debugAction === state.filter),
      );
    $('#world-debug-filter').value = state.filter || 'all';
    root.classList.toggle('is-inspecting', !!state.inspected);
    const relationships = $('#world-debug-relationships');
    relationships.replaceChildren();
    for (const relation of state.relationships || []) {
      if (relation.visible === false) continue;
      const button = document.createElement('button');
      button.textContent = `${relation.state.replaceAll('_', ' ')} · ${relation.label}`;
      button.dataset.debugAction = 'sources';
      button.dataset.relationshipId = relation.id;
      relationships.append(button);
    }
    const evidence = $('#world-debug-evidence');
    evidence.replaceChildren();
    if (state.inspected) {
      const relation = state.inspected;
      const heading = document.createElement('strong');
      heading.textContent = `${relation.state.replaceAll('_', ' ')} · ${relation.label}`;
      const explanation = document.createElement('p');
      explanation.textContent = relation.explanation || '';
      evidence.append(heading);
      const sourceDetails = document.createElement('details');
      const sourceSummary = document.createElement('summary');
      sourceSummary.textContent = 'Source details';
      sourceDetails.append(sourceSummary);
      for (const source of relation.provenance || []) {
        let url;
        try {
          url = new URL(source.url);
        } catch {
          /* missing URLs remain plain provenance */
        }
        const label = document.createElement(
          url?.protocol === 'https:' ? 'a' : 'span',
        );
        label.textContent = source.label || 'Source';
        if (label.tagName === 'A') {
          label.href = url.href;
          label.target = '_blank';
          label.rel = 'noopener noreferrer';
        }
        const detail = document.createElement('small');
        detail.textContent = [
          source.detail,
          source.time && `Event/observation: ${source.time}`,
          source.retrievedAt && `Retrieved: ${source.retrievedAt}`,
        ]
          .filter(Boolean)
          .join(' · ');
        evidence.append(label, document.createElement('br'));
        const detailHeading = document.createElement('strong');
        detailHeading.textContent = source.label || 'Source';
        sourceDetails.append(detailHeading, detail);
      }
      evidence.append(explanation);
      if ((relation.provenance || []).length) evidence.append(sourceDetails);
      if (relation.evidenceNeeded) {
        const needed = document.createElement('p');
        needed.textContent = `Still needed: ${relation.evidenceNeeded}`;
        evidence.append(needed);
      }
      if (relation.id !== lastInspected) open(true);
      lastInspected = relation.id;
    } else lastInspected = null;
    $('#world-debug-limits').textContent = [
      ...(state.unknowns || []),
      ...(state.errors || []),
    ].join(' ');
  };
  const click = (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'world-debug-close') {
      open(false);
      return;
    }
    if (button.id === 'world-debug-details') {
      open(panel.hidden);
      return;
    }
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
  root.addEventListener('change', change);
  root.addEventListener('click', click);
  const unsubscribe = service.subscribe(render);
  return {
    getState: () => latest,
    destroy() {
      disposed = true;
      unsubscribe();
      root.removeEventListener('click', click);
      root.removeEventListener('change', change);
      root.remove();
      style.remove();
    },
  };
}
