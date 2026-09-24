import { renderIncidentVisual } from './visuals.js';
import { mountExplorer } from './explorer.js';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import { indexScenario, evidenceForClaims } from './model.js';
import { createScenarioGlobe } from './globe.js';

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const colonial =
  new URLSearchParams(location.search).get('case') !== 'kyivstar';
const caseName = colonial ? 'colonial' : 'kyivstar';
const country = colonial ? 'United States' : 'Ukraine';
const countryId = colonial ? 'usa' : 'ukraine';
const app = document.querySelector('#app');
let scenario, index, globe;
let selectedEvent = 'event-attack';
let selectedEntity = null;
let selectedClaim = null;
let tab = 'findings';
let timeZone = 'UTC';
let evidenceQuery = '';
let sceneKey = '';
let explorer,
  explorerMode = 'geography';
const statusBadge = (status) =>
  `<span class="badge ${status.toLowerCase()}">${status}</span>`;

function formatTime(t) {
  if (t.precision === 'day' && t.end !== t.start)
    return `${t.start} — ${t.end} · day precision`;
  if (t.precision === 'day')
    return `${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(t.start))} · day precision`;
  const format = (v) =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: timeZone === 'UTC' ? 'UTC' : 'Europe/Kyiv',
    }).format(new Date(v));
  return `${format(t.start)}${t.end !== t.start ? ` — ${format(t.end)}` : ''} ${timeZone}`;
}

function shell() {
  app.innerHTML = `
    <a class="skip-link" href="#investigation">Skip to investigation</a>
    <header class="topbar">
      <div class="brand"><span class="brand-orbit" aria-hidden="true">◉</span><div>CYBER SITUATION ROOM<small>GEOGRAPHY / SYSTEMS / EVIDENCE</small></div></div>
      <div class="case-tag"><span class="live-dot"></span> CASE STUDY <span class="divider">/</span> ${colonial ? '002' : '001'} <span class="divider">/</span> ${country.toUpperCase()}</div>
      <a class="upstream-link" href="/">God’s Eye View ↗</a>
    </header>
    <main class="workspace">
      <aside class="left-rail" aria-label="Investigation controls">
        <div class="rail-title"><span class="eyebrow">WORKSPACE</span><span class="mono muted">01</span></div>
        <label class="eyebrow" for="case-picker">CASE LIBRARY</label><select id="case-picker" aria-label="Select historical case"><option value="colonial" ${colonial ? 'selected' : ''}>Colonial Pipeline · 2021</option><option value="kyivstar" ${!colonial ? 'selected' : ''}>Kyivstar · 2023</option></select>
        <section class="rail-section"><h2>MAP CONTEXT</h2>
          <label class="layer-row"><input id="boundary-toggle" type="checkbox" checked /><span>${country} boundary<small>Reference geography</small></span></label>
          <label class="layer-row"><input id="imagery-toggle" type="checkbox" checked /><span>Earth imagery<small>Natural Earth · offline</small></span></label>
          <p class="context-note">The boundary locates the investigation. It is not a measured outage footprint.</p>
        </section>
        <section class="rail-section"><h2>INVESTIGATION SUBJECTS</h2><div id="subjects"></div></section>
        <section class="rail-section lens"><h2>EVIDENCE LENS</h2><p><i class="legend-dot mint"></i>Observed / derived</p><p><i class="legend-dot amber"></i>Source-reported</p><p><i class="legend-dot purple"></i>Inferred / unresolved</p></section>
        <div class="rail-footer"><span class="eyebrow">CURATED SNAPSHOT</span><p>Static research bundle<br/>Reviewed 24 Sep 2026</p><button class="text-button" id="export">↓ Export evidence bundle</button></div>
      </aside>
      <section class="stage" aria-label="Spatial investigation">
        <div id="globe"></div><div id="incident-visual"></div><div class="stage-vignette"></div>
        <div class="stage-heading"><div class="eyebrow"><span class="mint-text">INVESTIGATION ${colonial ? '002' : '001'}</span> <span class="muted">/ HISTORICAL</span></div><h1>${colonial ? 'When fuel supply<br/>stood still.' : 'When connectivity<br/>went dark.'}</h1><p>${escape(scenario.title)} · ${escape(scenario.subtitle)}</p><div class="date-chip">${colonial ? '7 — 13 MAY 2021' : '12 — 19 DECEMBER 2023'}</div></div>
        <div class="map-tools"><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="overview" title="Reset view and selection">Overview</button><button id="focus" aria-label="Focus globe on ${country}" title="Focus ${country}">⌖</button><button id="map-select">${country} <span>↗</span></button></div>
        <div class="map-note"><span class="legend-dot mint"></span>CURRENT REFERENCE <span class="muted">· country outline, not outage extent</span></div>
        <div class="graph-panel"><div class="graph-heading"><span class="eyebrow">FOLLOW THE CONNECTIONS</span><span class="muted">Logical relationships · not routes</span></div><div id="graph"></div><div id="graph-detail" class="graph-detail">Select a connection to inspect the evidence behind it.</div></div>
        <div id="map-error" role="status" hidden></div>
        <div id="credits"></div>
      </section>
      <aside id="investigation" class="investigation" aria-label="Evidence investigation" tabindex="-1">
        <div class="investigation-heading"><div><span class="eyebrow">INVESTIGATION</span><h2>What do we know?</h2></div><span class="open-mark">↗</span></div>
        <div class="tabs" role="tablist" aria-label="Investigation view"><button role="tab" id="findings-tab" aria-controls="panel" data-tab="findings">Findings</button><button role="tab" id="evidence-tab" aria-controls="panel" data-tab="evidence">Evidence <span>${scenario.evidence.length}</span></button></div>
        <div id="selection-context"></div><div id="panel" role="tabpanel" class="panel-scroll"></div>
        <div class="investigation-footer"><span class="live-dot"></span> SOURCE-BOUND · UNCERTAINTY PRESERVED</div>
      </aside>
    </main>
    <section class="timeline" aria-label="Event and evidence timeline">
      <div class="timeline-top"><div><span class="eyebrow">EVENT / EVIDENCE TIMELINE</span><span class="timeline-hint">Retrospective · select a milestone</span></div><label class="timezone-label">TIME ZONE <select id="timezone"><option>UTC</option>${colonial ? '' : '<option>Kyiv</option>'}</select></label></div>
      <div class="timeline-body"><div class="interval-label"><span class="mint-text">${colonial ? 'REPORTED MILESTONES' : 'CLOUDFLARE OBSERVATION'}</span><button id="interval">${colonial ? '7–13 May' : '79h 30m'} <span>↗</span></button><small id="interval-time"></small></div><div class="milestones" id="milestones"></div></div>
      <div class="timeline-bottom"><span>${colonial ? 'Date-only milestones; not a measured outage duration or fuel-flow series.' : 'Published measurement interval; no synthetic traffic samples.'}</span><span id="event-time"></span></div>
    </section>
    <footer class="attribution">Built on <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noopener noreferrer">God’s Eye View · Bilawal Sidhu & contributors</a><span>Original evidence model & investigation experience: Cyber Situation Room</span></footer>`;
  document
    .querySelector('#zoom-in')
    .addEventListener('click', () => globe?.zoom(1));
  document
    .querySelector('#zoom-out')
    .addEventListener('click', () => globe?.zoom(-1));
  document.querySelector('#overview').addEventListener('click', () => {
    selectedEntity = null;
    selectedClaim = null;
    tab = 'findings';
    render();
    globe?.highlight(false);
    globe?.focus(false);
  });
  document
    .querySelector('#incident-visual')
    .addEventListener('click', (event) => {
      const component = event.target.closest('[data-claim]');
      if (component) selectClaim(component.dataset.claim);
    });
  document.querySelector('#case-picker').addEventListener('change', (e) => {
    const url = new URL(location.href);
    url.searchParams.set('case', e.target.value);
    location.assign(url);
  });
  document
    .querySelector('#boundary-toggle')
    .addEventListener('change', (e) => globe?.setVisible(e.target.checked));
  document
    .querySelector('#imagery-toggle')
    .addEventListener('change', (e) => globe?.setImagery(e.target.checked));
  document
    .querySelector('#focus')
    .addEventListener('click', () => globe?.focus());
  document
    .querySelector('#map-select')
    .addEventListener('click', () => selectEntity(countryId));
  document
    .querySelector('#interval')
    .addEventListener('click', () =>
      selectClaim(colonial ? 'c-attack' : 'c-traffic'),
    );
  document.querySelector('#timezone').addEventListener('change', (e) => {
    timeZone = e.target.value;
    render();
  });
  document.querySelector('#export').addEventListener('click', () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(scenario, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseName}-evidence-bundle.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  for (const button of document.querySelectorAll('[data-tab]')) {
    button.addEventListener('click', () => {
      tab = button.dataset.tab;
      selectedClaim = null;
      render();
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
        return;
      event.preventDefault();
      tab =
        event.key === 'Home'
          ? 'findings'
          : event.key === 'End'
            ? 'evidence'
            : tab === 'findings'
              ? 'evidence'
              : 'findings';
      selectedClaim = null;
      render();
      document.querySelector(`#${tab}-tab`).focus();
    });
  }
  document.addEventListener('keydown', (event) => {
    if (
      ['Enter', ' '].includes(event.key) &&
      event.target.matches('.system-scene [data-claim]')
    ) {
      event.preventDefault();
      selectClaim(event.target.dataset.claim);
      return;
    }
    if (event.key === 'Escape' && (selectedClaim || selectedEntity)) {
      selectedClaim = null;
      selectedEntity = null;
      tab = 'findings';
      render();
      document.querySelector('#findings-tab').focus();
    }
  });
}

function selectEntity(id) {
  selectedEntity = id;
  selectedClaim = null;
  tab = 'findings';
  if (colonial && explorer)
    explorer.setMode(id === 'colonial' ? 'system' : 'geography');
  render();
  if (colonial) globe?.inspect(id);
  focusSelection();
}
function selectMilestone(id) {
  selectedEvent = id;
  selectedClaim = null;
  tab = 'findings';
  render();
}
function selectClaim(id) {
  selectedClaim = id;
  tab = 'evidence';
  render();
  document.querySelector('#panel').scrollTop = 0;
  if (colonial)
    document.querySelector('#investigation').classList.add('inspector-open');
  else focusSelection(true);
}
function focusSelection(evidence = false) {
  if (!colonial) {
    globe?.focus();
    globe?.highlight(true);
  }
  document.querySelector('#panel').scrollTop = 0;
  if (matchMedia('(max-width: 900px)').matches) {
    document
      .querySelector(evidence ? '#investigation' : '.stage')
      .scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
  }
}
function render() {
  const event = index.events.get(selectedEvent);
  const visual = colonial
    ? renderIncidentVisual({
        entity: selectedEntity,
        claim: selectedClaim,
        event: selectedEvent,
        escape,
        geometry: scenario.geometries[0],
      })
    : '';
  const nextSceneKey = selectedEvent + ':' + selectedEntity;
  if (nextSceneKey !== sceneKey) {
    document.querySelector('#incident-visual').innerHTML = visual;
    sceneKey = nextSceneKey;
  }
  document.querySelectorAll('.system-scene [data-claim]').forEach((el) => {
    el.classList.toggle(
      'evidence-selected',
      el.dataset.claim === selectedClaim,
    );
    el.setAttribute('aria-pressed', String(el.dataset.claim === selectedClaim));
  });
  document
    .querySelector('#investigation')
    .classList.toggle('inspector-open', Boolean(selectedClaim));
  app.classList.toggle('persistent-scene', colonial);
  document
    .querySelector('.stage')
    .classList.toggle('explainer-active', Boolean(visual));
  app.classList.toggle(
    'globe-explorer',
    colonial && explorerMode === 'geography',
  );
  explorer?.render(selectedEvent);
  if (colonial) globe?.setMilestone(selectedEvent);
  const focusLabel =
    !colonial && selectedClaim
      ? 'Evidence focus'
      : selectedEntity
        ? 'Subject focus'
        : event.label + ' · Reported milestone';
  const title =
    !colonial && selectedClaim
      ? index.claims.get(selectedClaim).text
      : selectedEntity
        ? index.entities.get(selectedEntity).name
        : event.title;
  const heading = document.querySelector('.stage-heading');
  heading.classList.add('selection-heading');
  heading.innerHTML =
    '<div class="eyebrow">' +
    escape(scenario.title) +
    ' / ' +
    escape(focusLabel) +
    '</div><h1>' +
    escape(title) +
    '</h1><p>' +
    escape(
      selectedEntity
        ? index.entities.get(selectedEntity).description
        : event.summary,
    ) +
    '</p><div class="date-chip">' +
    escape(formatTime(index.times.get(event.timeId))) +
    '</div>';
  document.querySelector('.map-note').innerHTML =
    '<span class="legend-dot mint"></span>' +
    escape(country) +
    ' · reference context, not outage extent';
  document.querySelector('#subjects').innerHTML = scenario.entities
    .map(
      (e) =>
        `<button class="subject ${selectedEntity === e.id ? 'selected' : ''}" data-entity="${e.id}" aria-pressed="${selectedEntity === e.id}"><span class="subject-icon">${e.type === 'organization' ? '▦' : e.type === 'network' ? '⌘' : '◎'}</span><span>${e.name}<small>${e.type === 'network' ? 'Logical network' : e.type === 'country' ? 'Spatial context' : e.type === 'region' ? 'Endpoint city · reference' : e.type === 'route' ? 'Schematic connection' : 'Operator'}</small></span><span class="subject-arrow">›</span></button>`,
    )
    .join('');
  document
    .querySelectorAll('[data-entity]')
    .forEach((b) =>
      b.addEventListener('click', () => selectEntity(b.dataset.entity)),
    );
  document.querySelector('#milestones').innerHTML = scenario.events
    .map(
      (e, i) =>
        `<button class="milestone ${e.id === selectedEvent ? 'active' : ''}" data-event="${e.id}" aria-pressed="${e.id === selectedEvent}"><span class="milestone-dot">${String(i + 1).padStart(2, '0')}</span><span class="milestone-date">${e.label}</span><strong>${e.title}</strong><small>${colonial ? 'Source-reported' : i === 0 ? 'Reported + observed' : i === 2 ? 'Reported + observed' : 'Operator reported'}</small></button>`,
    )
    .join('');
  document.querySelectorAll('.milestone[data-event]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedEvent = b.dataset.event;
      selectedEntity = null;
      selectedClaim = null;
      tab = 'findings';
      render();
      focusSelection();
    }),
  );
  document.querySelector('#interval-time').textContent = formatTime(
    index.times.get('t-disruption'),
  );
  document.querySelector('#event-time').textContent =
    `SELECTED: ${formatTime(index.times.get(event.timeId))}`;
  document.querySelector('#graph').innerHTML = renderGraphPath([
    'r-target',
    'r-network',
    'r-observation',
  ]);
  document
    .querySelectorAll('[data-graph-entity]')
    .forEach((b) =>
      b.addEventListener('click', () => selectEntity(b.dataset.graphEntity)),
    );
  document.querySelector('#graph-detail').textContent = selectedEntity
    ? index.entities.get(selectedEntity).description
    : `${scenario.title} → ${country}: reported service geography. Outline: reference context only.`;
  document.querySelector('#selection-context').innerHTML = selectedEntity
    ? `<div class="selection-summary"><span class="eyebrow">SUBJECT FOCUS</span><h3>${index.entities.get(selectedEntity).name}</h3><p>${escape(index.entities.get(selectedEntity).description)}</p><button id="clear-selection" class="text-button">Clear subject ×</button></div>`
    : `<div class="selection-summary"><span class="eyebrow">${event.label} / SELECTED MILESTONE</span><h3>${event.title}</h3><p>${event.summary}</p></div>`;
  document.querySelector('#clear-selection')?.addEventListener('click', () => {
    selectedEntity = null;
    render();
  });
  for (const button of document.querySelectorAll('[data-tab]')) {
    button.setAttribute('aria-selected', String(button.dataset.tab === tab));
    button.tabIndex = button.dataset.tab === tab ? 0 : -1;
  }
  document
    .querySelector('#panel')
    .setAttribute('aria-labelledby', `${tab}-tab`);
  if (tab === 'findings') renderFindings(event);
  else renderEvidence();
  document.querySelectorAll('[data-claim]').forEach((button) => {
    if (!button.closest('.system-scene'))
      button.onclick = () => selectClaim(button.dataset.claim);
  });
}

function renderGraphPath(relationshipIds) {
  const node = (id, claimId) => {
    const entity = index.entities.get(id);
    const event = index.events.get(id);
    const observation = index.observations.get(id);
    const label = entity?.name || (event ? 'Cyberattack' : 'Disruption');
    const kind = entity?.type || (event ? 'REPORTED EVENT' : 'OBSERVED');
    const action = entity
      ? `data-graph-entity="${escape(id)}"`
      : `data-claim="${escape(claimId)}"`;
    return `<button ${action} aria-pressed="${selectedEntity === id}" class="graph-node ${selectedEntity === id ? 'selected' : ''} ${event ? 'attack-node' : observation ? 'observation-node' : ''}"><small>${escape(kind.toUpperCase())}</small>${escape(label)}</button>`;
  };
  return relationshipIds
    .map((id, i) => {
      const r = index.relationships.get(id);
      return `${i === 0 ? node(r.from, r.claimIds[0]) : ''}<button data-claim="${escape(r.claimIds[0])}" class="graph-edge ${selectedClaim === r.claimIds[0] ? 'selected' : ''}" aria-label="Evidence: ${escape(r.predicate)}" title="${escape(r.predicate)} · ${r.status}">→</button>${node(r.to, r.claimIds[0])}`;
    })
    .join('');
}

function renderFindings(event) {
  const relevant = selectedEntity
    ? scenario.claims.filter((c) => c.subjects.includes(selectedEntity))
    : scenario.claims.filter(
        (c) =>
          event.claimIds.includes(c.id) ||
          ['c-link', 'c-unknown'].includes(c.id),
      );
  const sections = [
    ['KNOWN', ['OBSERVED', 'DERIVED']],
    ['REPORTED', ['REPORTED']],
    ['INFERRED', ['INFERRED']],
    ['DISPUTED', ['DISPUTED']],
    ['UNKNOWN', ['UNKNOWN']],
  ];
  document.querySelector('#panel').innerHTML =
    sections
      .map(([title, statuses]) => {
        const claims = relevant.filter((c) => statuses.includes(c.status));
        if (colonial && !claims.length) return '';
        return `<section class="finding-section"><h3>${title}<span>${String(claims.length).padStart(2, '0')}</span></h3>${claims.length ? claims.map((c) => `<button class="claim-card" data-claim="${c.id}">${statusBadge(c.status)}<p>${escape(c.text)}</p><small>${c.evidenceIds.length ? `${c.evidenceIds.length} source${c.evidenceIds.length > 1 ? 's' : ''} · inspect evidence ↗` : 'Evidence gap · inspect scope ↗'}</small></button>`).join('') : `<p class="empty-state">${title === 'DISPUTED' ? 'No reviewed conflicting claims in this bundle.' : 'No claims in this category for this selection.'}</p>`}</section>`;
      })
      .join('') +
    `<section class="finding-section next-questions"><h3>NEXT QUESTIONS<span>03</span></h3>${scenario.questions.map((q, i) => `<p><span>0${i + 1}</span>${q}</p>`).join('')}</section>`;
}

function renderEvidence() {
  const claim = selectedClaim ? index.claims.get(selectedClaim) : null;
  const entries = claim
    ? evidenceForClaims(scenario, [claim.id])
    : scenario.evidence.map((e) => ({
        ...e,
        provenance: index.provenance.get(e.provenanceId),
      }));
  const heading = claim
    ? `<button class="text-button close-inspector" id="close-inspector">Close evidence ×</button><button class="text-button" id="back-evidence">← All evidence</button><div class="evidence-claim">${statusBadge(claim.status)}<h3>${escape(claim.text)}</h3><p class="limitation">${escape(claim.limitation)}</p><dl><dt>Event / valid time</dt><dd>${formatTime(index.times.get(claim.timeId))}</dd>${claim.derivation ? `<dt>Derivation</dt><dd>${escape(claim.derivation)}</dd>` : ''}</dl>${claim.premiseIds ? `<div class="premises">Premises ${claim.premiseIds.map((id) => `<button class="text-button" data-claim="${id}">${escape(id.replace('c-', ''))} ↗</button>`).join('')}</div>` : ''}</div>`
    : `<div class="evidence-intro"><h3>A traceable record.</h3><p>Source notes, dates and limitations. Operator statements and independent measurements remain distinct.</p><label class="sr-only" for="evidence-search">Search evidence</label><input id="evidence-search" type="search" placeholder="Search sources or evidence…" value="${escape(evidenceQuery)}" /></div>`;
  document.querySelector('#panel').innerHTML =
    heading +
    `<div id="evidence-list">${evidenceCards(entries, claim ? '' : evidenceQuery)}</div>`;
  document.querySelector('#close-inspector')?.addEventListener('click', () => {
    selectedClaim = null;
    tab = 'findings';
    render();
  });
  document.querySelector('#back-evidence')?.addEventListener('click', () => {
    selectedClaim = null;
    evidenceQuery = '';
    render();
  });
  document.querySelector('#evidence-search')?.addEventListener('input', (e) => {
    evidenceQuery = e.target.value;
    document.querySelector('#evidence-list').innerHTML = evidenceCards(
      entries,
      evidenceQuery,
    );
  });
}

function evidenceCards(entries, query) {
  const filtered = entries.filter((e) =>
    `${e.summary} ${e.provenance.publisher} ${e.provenance.title}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (!filtered.length)
    return '<p class="empty-state">No matching source records. This is an evidence gap, not a confirmed negative finding.</p>';
  return filtered
    .map((e) => {
      const p = e.provenance;
      return `<article class="source-card"><div class="source-byline"><span class="source-icon">↗</span>${escape(p.publisher)}</div><h3>${escape(p.title)}</h3><p>${escape(e.summary)}</p><dl><dt>Published</dt><dd>${escape(p.publishedAt || p.publicationLabel || 'Version 5.1.2 · reference cartography')}</dd><dt>Retrieved</dt><dd>${p.retrievedAt}</dd><dt>Source location</dt><dd>${escape(e.locator)}</dd></dl><details><summary>Method & rights</summary><p>${escape(p.access)}</p><p>${escape(p.transformation)}</p><p>${escape(p.rights)}</p></details><a class="source-link" href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">Open original source <span>↗</span></a></article>`;
    })
    .join('');
}

async function start() {
  const response = await fetch(`./cyber/${caseName}.json`);
  if (!response.ok)
    throw new Error('Bundled reference geography is unavailable');
  scenario = await response.json();
  index = indexScenario(scenario);
  const params = new URLSearchParams(location.search);
  if (index.events.has(params.get('event')))
    selectedEvent = params.get('event');
  if (index.entities.has(params.get('subject')))
    selectedEntity = params.get('subject');
  if (index.claims.has(params.get('claim'))) {
    selectedClaim = params.get('claim');
    tab = 'evidence';
  }
  shell();
  if (colonial)
    explorer = mountExplorer({
      root: document.querySelector('.stage'),
      scenario,
      onEvent: selectMilestone,
      onEntity: selectEntity,
      onClaim: selectClaim,
      onMode: (mode) => {
        explorerMode = mode;
        render();
        globe?.viewer.resize();
      },
      onIntro: () => globe?.intro(),
      getState: () => ({
        event: selectedEvent,
        entity: selectedEntity,
        claim: selectedClaim,
      }),
    });
  render();
  try {
    globe = await createScenarioGlobe({
      container: document.querySelector('#globe'),
      creditContainer: document.querySelector('#credits'),
      geometry: scenario.geometries[0],
      country,
      camera: colonial ? [-96, 37, 14500000] : [31.5, 48.5, 11000000],
      places: colonial
        ? scenario.entities
            .filter((e) => ['houston', 'linden'].includes(e.id))
            .map((e) => ({
              id: e.id,
              name: e.name,
              coordinates: index.geometries.get(`geo-${e.id}`).coordinates,
            }))
        : [],
      onSelect: (id) => selectEntity(id || countryId),
    });
    globe.setVisible(document.querySelector('#boundary-toggle').checked);
    globe.setImagery(document.querySelector('#imagery-toggle').checked);
    if (colonial) {
      globe.setVisible(false);
      globe.inspect(selectedEntity || 'pipeline');
      globe.setMilestone(selectedEvent);
      if (params.get('view') === 'system') explorer.setMode('system');
    }
    window.addEventListener('pagehide', () => globe.destroy(), { once: true });
    app.dataset.globe = 'ready';
  } catch (error) {
    const message = document.querySelector('#map-error');
    message.hidden = false;
    message.textContent =
      '3D map unavailable. Evidence, relationships and timeline remain usable. Reload in a WebGL-capable browser.';
    console.error(error);
    document.querySelector('#focus').disabled = true;
    app.dataset.globe = 'unavailable';
  }
  app.dataset.ready = 'true';
}
start().catch((error) => {
  app.innerHTML = `<main class="fatal"><h1>Investigation could not load</h1><p>${escape(error.message)}</p><button onclick="location.reload()">Retry</button></main>`;
  console.error(error);
});
