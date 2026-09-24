export function normalizeColonial(geometry) {
  const notes = [
    [
      'doe',
      'U.S. Department of Energy',
      'Colonial Pipeline cyber incident',
      'https://www.energy.gov/ceser/colonial-pipeline-cyber-incident',
      null,
      'Incident summary and response timeline',
      'Colonial shut its pipeline on 7 May 2021 after ransomware. DOE records emergency transport measures on 9 May and the announcement of full-system restart and deliveries to all markets on 13 May.',
    ],
    [
      'eia',
      'U.S. Energy Information Administration',
      'Colonial Pipeline outage affects gasoline supply',
      'https://www.eia.gov/todayinenergy/detail.php?id=47917',
      '2021-05-11',
      'Opening paragraphs and system description',
      'EIA describes a roughly 5,500-mile petroleum-products system from Houston to Linden. Mainlines remained stopped on 10 May, while smaller lines operated. Shipment transit means restart does not immediately replenish every market.',
    ],
    [
      'fbi',
      'Federal Bureau of Investigation',
      'Statement on compromise of Colonial Pipeline networks',
      'https://www.fbi.gov/news/press-releases/fbi-statement-on-compromise-of-colonial-pipeline-networks',
      '2021-05-10',
      'Agency statement',
      'The FBI attributed the compromise to DarkSide ransomware. Attribution is an official reported finding; this bundle assigns no actor location.',
    ],
    [
      'hearing',
      'U.S. Senate / Government Publishing Office',
      'Colonial Pipeline CEO testimony',
      'https://www.govinfo.gov/content/pkg/CHRG-117shrg46569/html/CHRG-117shrg46569.htm',
      null,
      '8 June 2021 hearing: Blount answers to Senators Lankford and Hawley',
      'CEO Joseph Blount described detection in business IT and a precautionary shutdown. At the hearing, he said investigators had not confirmed evidence in operational technology. The investigation was still ongoing.',
    ],
    [
      'geography',
      'Natural Earth',
      'Admin 0 countries · 1:110m · v5.1.2',
      'https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson',
      null,
      'Feature ADM0_A3 = USA',
      'Generalized United States outline used only to locate the investigation. It is not a pipeline route, outage footprint or map of fuel shortages.',
    ],
  ];
  const provenance = notes.map(
    ([id, publisher, title, url, publishedAt, locator, summary]) => ({
      id: `src-${id}`,
      publisher,
      title,
      url,
      publishedAt,
      locator,
      summary,
      retrievedAt: '2026-09-24',
      publicationLabel:
        id === 'hearing'
          ? 'Hearing 8 Jun 2021; GPO edition 2022'
          : id === 'geography'
            ? 'Version 5.1.2 · reference cartography'
            : 'Undated incident page',
      access: 'Public source; manually reviewed',
      rights:
        id === 'geography'
          ? 'Public domain. Courtesy: Natural Earth.'
          : 'Original paraphrase and source link only. Third-party testimony and embedded materials are not assumed openly licensed.',
      transformation:
        'Curated factual summary; day precision retained; source publication and event dates kept separate.',
    }),
  );
  const claim = (
    id,
    text,
    subjects,
    evidenceIds,
    timeId,
    limitation,
    status = 'REPORTED',
  ) => ({ id, text, subjects, evidenceIds, timeId, limitation, status });
  const time = (id, start, end = start, basis = 'EVENT_TIME') => ({
    id,
    start,
    end,
    precision: 'day',
    basis,
  });
  return {
    schemaVersion: 1,
    id: 'colonial-2021',
    title: 'Colonial Pipeline',
    subtitle: 'Ransomware & precautionary operational shutdown',
    provenance,
    evidence: provenance.map((p) => ({
      id: p.id.replace('src-', 'ev-'),
      provenanceId: p.id,
      locator: p.locator,
      summary: p.summary,
    })),
    times: [
      time('t-attack', '2021-05-07'),
      time('t-emergency', '2021-05-09'),
      time('t-attribution', '2021-05-10'),
      time('t-recovery', '2021-05-13'),
      time('t-disruption', '2021-05-07', '2021-05-13'),
      time('t-hearing', '2021-06-08'),
      time('t-reference', '2026-09-24', '2026-09-24', 'CURRENT_REFERENCE'),
    ],
    entities: [
      {
        id: 'colonial',
        type: 'organization',
        name: 'Colonial Pipeline',
        description:
          'Pipeline operator; a logical subject with no assigned point location.',
      },
      {
        id: 'pipeline',
        type: 'route',
        name: 'Pipeline system',
        description:
          'Reported Houston–Linden petroleum-products system. No verified route geometry is included.',
      },
      {
        id: 'usa',
        type: 'country',
        name: 'United States',
        description:
          'Country-level context only. The outline does not represent outage extent or fuel availability.',
      },
    ],
    observations: [],
    geometries: [
      {
        id: 'geo-usa',
        ...geometry,
        crs: 'EPSG:4326',
        timeId: 't-reference',
        evidenceIds: ['ev-geography'],
        role: 'REFERENCE_CONTEXT',
      },
    ],
    claims: [
      claim(
        'c-attack',
        'Colonial shut its pipeline on 7 May after a ransomware attack.',
        ['colonial', 'pipeline'],
        ['ev-doe'],
        't-attack',
        'Reported shutdown, not a measured flow series. Exact start time is not established here.',
      ),
      claim(
        'c-emergency',
        'Federal emergency transport measures began on 9 May.',
        ['usa'],
        ['ev-doe'],
        't-emergency',
        'Response measures do not establish a geographic outage footprint.',
      ),
      claim(
        'c-attribution',
        'The FBI attributed the network compromise to DarkSide ransomware on 10 May.',
        ['colonial'],
        ['ev-fbi'],
        't-attribution',
        'Official attribution is reported, not independently reproduced by this application.',
      ),
      claim(
        'c-recovery',
        'On 13 May, Colonial announced full-system restart and deliveries to all markets.',
        ['colonial', 'pipeline'],
        ['ev-doe'],
        't-recovery',
        'Restart does not mean immediate replenishment of every station or recovery of all downstream impacts.',
      ),
      claim(
        'c-link',
        'Business IT detection led to a precautionary operational shutdown, according to the CEO.',
        ['colonial', 'pipeline'],
        ['ev-hearing'],
        't-attack',
        'Retrospective 8 June testimony. Do not interpret the shutdown as proof of direct control-system compromise.',
      ),
      claim(
        'c-network',
        'EIA describes the system as connecting Houston, Texas, with Linden, New Jersey.',
        ['pipeline', 'usa'],
        ['ev-eia'],
        't-disruption',
        'Service geography only. No pipeline alignment or affected-area polygon is supplied.',
      ),
      claim(
        'c-unknown',
        'The reviewed bundle does not establish a measured outage footprint or prove direct operational-technology compromise.',
        ['colonial', 'pipeline', 'usa'],
        ['ev-hearing'],
        't-disruption',
        'Absence of confirmation is not proof of absence; the CEO described an ongoing investigation.',
        'UNKNOWN',
      ),
      claim(
        'c-geography',
        'The United States outline is reference cartography.',
        ['usa'],
        ['ev-geography'],
        't-reference',
        'Current reference, not event-time observation.',
        'REPORTED',
      ),
    ],
    events: [
      [
        'event-attack',
        'Shutdown',
        '07 MAY',
        't-attack',
        ['c-attack'],
        'Ransomware prompts a precautionary pipeline shutdown.',
      ],
      [
        'event-emergency',
        'Emergency response',
        '09 MAY',
        't-emergency',
        ['c-emergency'],
        'Federal measures support alternative fuel transportation.',
      ],
      [
        'event-attribution',
        'FBI attribution',
        '10 MAY',
        't-attribution',
        ['c-attribution'],
        'An official statement identifies DarkSide ransomware.',
      ],
      [
        'event-recovery',
        'System restarted',
        '13 MAY',
        't-recovery',
        ['c-recovery'],
        'Restart and deliveries are reported; downstream recovery can lag.',
      ],
    ].map(([id, title, label, timeId, claimIds, summary]) => ({
      id,
      title,
      label,
      timeId,
      claimIds,
      summary,
      entityIds: ['colonial', 'pipeline', 'usa'],
    })),
    relationships: [
      ['r-target', 'event-attack', 'colonial', 'affected operator', 'c-attack'],
      ['r-network', 'colonial', 'pipeline', 'operates system', 'c-link'],
      [
        'r-observation',
        'pipeline',
        'usa',
        'reported service geography',
        'c-network',
      ],
      ['r-geometry', 'usa', 'geo-usa', 'reference outline', 'c-geography'],
    ].map(([id, from, to, predicate, c]) => ({
      id,
      from,
      to,
      predicate,
      claimIds: [c],
      status: 'REPORTED',
      timeId: id === 'r-geometry' ? 't-reference' : 't-disruption',
    })),
    questions: [
      'What independent flow measurements resolve the shutdown and restart interval?',
      'Which downstream impacts can be tied to dated local measurements?',
      'What later forensic evidence resolves the IT / OT boundary?',
    ],
  };
}
