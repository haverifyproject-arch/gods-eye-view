/** Stable scene: event changes state; evidence only adds a selection outline. */
export function renderIncidentVisual({ entity, event, escape, geometry }) {
  const recovered = event === 'event-recovery';
  const response = event !== 'event-attack';
  const attributed = ['event-attribution', 'event-recovery'].includes(event);
  const color = recovered ? '#6be0ca' : '#ffad83';
  const countryPath = (geometry?.coordinates || [])
    .flatMap((p) => p[0])
    .filter((p) => p[0] > -126 && p[0] < -66 && p[1] > 24 && p[1] < 50);
  const map =
    countryPath
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${(360 + (p[0] + 126) * 5.3).toFixed(1)},${(303 - (p[1] - 24) * 4.1).toFixed(1)}`,
      )
      .join(' ') + 'Z';
  return `<section class="system-scene" data-visual="system" data-event="${event}" data-focus="${entity || 'all'}" aria-label="Colonial Pipeline incident system">
  <div class="scene-caption"><span>COLONIAL PIPELINE / CONNECTED SYSTEM</span><span>Click a component to inspect its evidence</span></div>
  <div class="scene-viewport" tabindex="0" aria-label="Incident diagram; scroll horizontally to explore"><svg viewBox="0 0 800 490" role="img" aria-label="Business IT and operational decisions connect to a pipeline system. ${recovered ? 'Restart reported' : 'Shutdown reported'}; downstream impact remains unmeasured.">
    <defs><pattern id="scene-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#20323d" stroke-width=".5"/></pattern></defs>
    <rect width="800" height="490" fill="url(#scene-grid)"/>
    <g class="geographic-context"><path d="${map}" fill="#172e3a" stroke="#405d6c"/><text x="530" y="200" fill="#7993a3" font-size="10">U.S. REFERENCE CONTEXT</text></g>
    <path d="M190 110H275M385 150V255H430" class="reported-link"/><text x="208" y="94" class="link-label">reported decision</text>
    <path d="M140 150V385H270" class="uncertain-link"/><text x="151" y="225" class="link-label">forensic attribution</text>
    <g class="component it-component" data-claim="c-link" role="button" tabindex="0" aria-label="Inspect business IT evidence"><rect x="35" y="60" width="155" height="90" rx="10"/><path d="M52 83h23v30H52zM56 90h15M56 99h15" class="equipment"/><text x="85" y="91">Business IT</text><text x="52" y="131" class="node-detail">Incident detected · reported</text></g>
    <g class="component decision-component" data-claim="c-attack" role="button" tabindex="0" aria-label="Inspect shutdown decision"><rect x="275" y="60" width="220" height="90" rx="10"/><text x="292" y="91">Operational decision</text><text x="292" y="116" class="node-detail">Precautionary shutdown</text><text x="292" y="133" class="node-detail">No confirmed direct OT compromise</text></g>
    <text x="350" y="232" class="section-label">PHYSICAL SYSTEM · SCHEMATIC CONNECTION</text>
    <path d="M370 290H700" stroke="#263f4c" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M370 290H700" stroke="${color}" stroke-width="5" fill="none" stroke-dasharray="${recovered ? '16 9' : 'none'}"/>
    <circle cx="370" cy="290" r="9" fill="#c7d8e0"/><circle cx="700" cy="290" r="9" fill="#c7d8e0"/>
    <text x="350" y="320">Houston, TX</text><text x="650" y="320">Linden, NJ</text>
    <g class="component pipe-component" data-claim="${recovered ? 'c-recovery' : 'c-attack'}" role="button" tabindex="0" aria-label="Inspect pipeline operating state"><rect x="473" y="264" width="133" height="51" rx="7" style="stroke:${color}"/><text x="489" y="285" style="fill:${color}">${recovered ? 'RESTARTED' : 'SHUTDOWN'}</text><text x="489" y="302" class="node-detail">${recovered ? '13 May · reported' : '7 May · reported'}</text></g>
    <g class="component geography-component" data-claim="c-network" role="button" tabindex="0" aria-label="Inspect endpoint geography"><rect x="350" y="337" width="350" height="30" rx="5"/><text x="365" y="357" class="node-detail">Endpoint relationship only · inspect geography ↗</text></g>
    <g class="component attribution-component ${attributed ? 'revealed' : ''}" data-claim="${attributed ? 'c-attribution' : 'c-unknown'}" role="button" tabindex="0" aria-label="Inspect attribution status"><rect x="35" y="350" width="235" height="80" rx="10"/><text x="52" y="377">${attributed ? 'FBI → DarkSide ransomware' : 'Attribution not yet on timeline'}</text><text x="52" y="401" class="node-detail">${attributed ? '10 May statement · reported' : 'Select 10 May for the FBI statement'}</text></g>
    <g class="component response-component ${response ? 'revealed' : ''}" data-claim="${response ? 'c-emergency' : 'c-unknown'}" role="button" tabindex="0" aria-label="Inspect federal response"><rect x="35" y="255" width="235" height="70" rx="10"/><text x="52" y="283">${response ? 'Federal transport measures' : 'Response not yet on timeline'}</text><text x="52" y="306" class="node-detail">${response ? '9 May onward · reported' : 'Select 9 May to reveal response'}</text></g>
    <path d="M540 367V392" class="uncertain-link"/>
    <g class="component impact-component" data-claim="${recovered ? 'c-recovery' : 'c-unknown'}" role="button" tabindex="0" aria-label="Inspect downstream uncertainty"><rect x="350" y="392" width="350" height="58" rx="8"/><text x="366" y="418">${recovered ? 'Deliveries resumed; replenishment can lag' : 'Downstream fuel availability'}</text><text x="366" y="438" class="node-detail">${recovered ? 'No station-by-station recovery measurements' : 'Local impact is not measured in this bundle'}</text></g>
  </svg></div>
  <div class="scene-legend"><span><i></i>Reported relationship</span><span><i class="dashed"></i>Unresolved / contextual</span><span>Geography is reference; line is not pipeline alignment.</span></div>
  <div class="scene-focus-note">${entity === 'pipeline' ? 'Pipeline focus · endpoint geography and operating state' : entity === 'colonial' ? 'Operator focus · business IT and operational decision' : entity === 'usa' ? 'Geographic focus · sourced country outline and reported endpoint cities' : 'Follow the same system through the four milestones below.'}</div>
  </section>`;
}
