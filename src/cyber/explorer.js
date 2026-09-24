const steps = [
  [
    'event-attack',
    'pipeline',
    'An IT incident becomes a physical interruption',
    'Follow the reported shutdown across the endpoint relationship.',
  ],
  [
    'event-attack',
    'houston',
    'Start at the Gulf Coast',
    'Houston is an endpoint city in EIA’s system description. The marker is city context.',
  ],
  [
    'event-emergency',
    'pipeline',
    'The response extends beyond the operator',
    'Federal transportation measures began on 9 May. Inspect the response evidence.',
  ],
  [
    'event-attribution',
    'linden',
    'A connection to the Northeast',
    'Linden is the other reported endpoint city. The FBI statement provides attribution, not an attacker location.',
  ],
  [
    'event-recovery',
    'pipeline',
    'Restart and recovery are different',
    'Compare the reported shutdown with restart. Local replenishment remained a separate question.',
  ],
];
const states = {
  'event-attack': [
    'Shutdown reported',
    'No response milestone yet',
    'No attribution milestone yet',
    'c-attack',
  ],
  'event-emergency': [
    'System shutdown context',
    'Federal transport measures',
    'No attribution milestone yet',
    'c-emergency',
  ],
  'event-attribution': [
    'Mainlines stopped as of 10 May',
    'Federal transport measures',
    'FBI: DarkSide ransomware',
    'c-attribution',
  ],
  'event-recovery': [
    'Full-system restart reported',
    'Federal response recorded',
    'FBI: DarkSide ransomware',
    'c-recovery',
  ],
};
export function mountExplorer({
  root,
  scenario,
  onEvent,
  onEntity,
  onClaim,
  onMode,
  onIntro,
  getState,
}) {
  const host = document.createElement('div');
  host.className = 'explorer-ui';
  host.innerHTML = `<nav class="explorer-toolbar" aria-label="Investigation views"><button id="geography-view" aria-pressed="true">◎ Geography</button><button id="system-view" aria-pressed="false">⌘ Dependencies</button><button id="tour-start">▶ Reconstruct incident</button><button id="compare-toggle" aria-expanded="false">⇄ Compare dates</button><button id="share-view">Copy view link</button></nav><div class="place-shortcuts"><button data-place="houston">Houston ↗</button><button data-place="pipeline">Frame connection</button><button data-place="linden">Linden ↗</button></div><section class="journey" hidden aria-label="Guided reconstruction"><div class="journey-top"><span id="journey-count"></span><button id="tour-close">Exit tour ×</button></div><h2 id="journey-title"></h2><p id="journey-text"></p><div><button id="tour-prev">← Back</button><button id="tour-next">Next →</button></div></section><section class="date-comparison" hidden aria-label="Compare reported states"><div class="comparison-selects"><label>From<select id="compare-from"></select></label><label>To<select id="compare-to"></select></label><button id="compare-close">Close ×</button></div><div id="comparison-rows"></div><p>Reported milestones, not continuous telemetry. City markers remain reference geography.</p></section><div class="world-status"><span id="world-status-label"></span><button id="world-evidence">Inspect milestone ↗</button><small>Dashed line: schematic endpoint connection · city points, not terminals</small></div><div class="explorer-announcement" role="status"></div>`;
  root.append(host);
  const $ = (s) => host.querySelector(s);
  const contextButton = document.createElement('button');
  contextButton.id = 'context-evidence';
  contextButton.textContent = 'Inspect selected place ↗';
  $('.world-status').insertBefore(contextButton, $('.world-status small'));
  const contextClaim = () =>
    ({
      houston: 'c-houston',
      linden: 'c-linden',
      pipeline: 'c-network',
      usa: 'c-geography',
      colonial: 'c-link',
    })[getState().entity];
  contextButton.onclick = () => {
    const id = contextClaim();
    if (id) onClaim(id);
  };
  let tour = -1,
    mode = 'geography';
  function setMode(value) {
    mode = value;
    onMode(value);
    $('#geography-view').setAttribute(
      'aria-pressed',
      String(value === 'geography'),
    );
    $('#system-view').setAttribute('aria-pressed', String(value === 'system'));
  }
  $('#geography-view').onclick = () => setMode('geography');
  $('#system-view').onclick = () => setMode('system');
  host.querySelectorAll('[data-place]').forEach(
    (b) =>
      (b.onclick = () => {
        setMode('geography');
        onEntity(b.dataset.place);
      }),
  );
  const options = scenario.events
    .map((e) => `<option value="${e.id}">${e.label} · ${e.title}</option>`)
    .join('');
  $('#compare-from').innerHTML = options;
  $('#compare-to').innerHTML = options;
  $('#compare-to').value = 'event-recovery';
  function compare() {
    const from = $('#compare-from').value,
      to = $('#compare-to').value;
    const titles = ['Operations', 'Response', 'Attribution'];
    $('#comparison-rows').innerHTML =
      titles
        .map(
          (title, i) =>
            `<div class="comparison-row ${states[from][i] !== states[to][i] ? 'changed' : ''}"><strong>${title}</strong><span>${states[from][i]}</span><span>→ ${states[to][i]}</span></div>`,
        )
        .join('') +
      `<div class="comparison-actions"><button data-date="${from}">View from date</button><button data-date="${to}">View to date</button></div>`;
    host
      .querySelectorAll('[data-date]')
      .forEach((b) => (b.onclick = () => onEvent(b.dataset.date)));
  }
  $('#compare-from').onchange = compare;
  $('#compare-to').onchange = compare;
  compare();
  function comparison(open) {
    $('.date-comparison').hidden = !open;
    $('#compare-toggle').setAttribute('aria-expanded', String(open));
    if (open) $('.journey').hidden = true;
  }
  $('#compare-toggle').onclick = () => comparison($('.date-comparison').hidden);
  $('#compare-close').onclick = () => comparison(false);
  function tourRender() {
    comparison(false);
    $('.journey').hidden = false;
    const [event, entity, title, description] = steps[tour];
    $('#journey-count').textContent =
      `RECONSTRUCTION ${tour + 1} / ${steps.length}`;
    $('#journey-title').textContent = title;
    $('#journey-text').textContent = description;
    $('#tour-prev').disabled = tour === 0;
    $('#tour-next').textContent =
      tour === steps.length - 1 ? 'Finish exploration' : 'Next →';
    setMode('geography');
    onEvent(event);
    onEntity(entity);
  }
  $('#tour-start').onclick = () => {
    tour = 0;
    onIntro();
    tourRender();
  };
  $('#tour-next').onclick = () => {
    if (tour === steps.length - 1) {
      $('.journey').hidden = true;
      return;
    }
    tour++;
    tourRender();
  };
  $('#tour-prev').onclick = () => {
    if (tour > 0) {
      tour--;
      tourRender();
    }
  };
  $('#tour-close').onclick = () => {
    $('.journey').hidden = true;
  };
  $('#world-evidence').onclick = () => onClaim(states[getState().event][3]);
  $('#share-view').onclick = async () => {
    const state = getState(),
      url = new URL(location.href);
    url.searchParams.set('event', state.event);
    url.searchParams.set('subject', state.entity || 'pipeline');
    url.searchParams.set('view', mode);
    if (state.claim) url.searchParams.set('claim', state.claim);
    else url.searchParams.delete('claim');
    history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url.href);
      $('.explorer-announcement').textContent =
        'View link copied. Opens this case, milestone and selection on this host.';
    } catch {
      $('.explorer-announcement').textContent =
        'View saved in the address bar. Copy the URL to reopen it on this host.';
    }
  };
  return {
    setMode,
    render(event) {
      contextButton.hidden = !contextClaim();
      contextButton.textContent = ['houston', 'linden'].includes(
        getState().entity,
      )
        ? 'Inspect selected city ↗'
        : 'Inspect connection ↗';
      $('#world-status-label').textContent = states[event][0];
    },
  };
}
