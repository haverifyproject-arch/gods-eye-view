/** Source-backed historical statements. Coordinates are approximate or current reference. */
const START = '2022-01-14T00:00:00Z';
const END = '2022-02-24T00:00:00Z';
const interval = (start = START, end = END) => ({ start, end });
const point = (coordinates, evidenceIds, description) => ({
  type: 'Point',
  coordinates,
  precision: 'APPROXIMATE',
  basis: 'RECONSTRUCTED',
  description,
  evidenceIds,
});
const source = (
  id,
  publisher,
  url,
  publishedAt,
  rights = 'Source page: linked; paraphrases only',
) => ({
  id,
  publisher,
  url,
  publishedAt,
  retrievedAt: '2026-09-24T00:00:00Z',
  rights,
});
const record = (id, label, status, evidenceIds, start = START, extra = {}) => ({
  id,
  label,
  status,
  evidenceIds,
  validTime: interval(start),
  ...extra,
});
export const tongaSituation = {
  schemaVersion: 1,
  id: 'tonga-2022',
  title: 'The Tonga connection',
  subtitle: 'Eruption · submarine cable · network collapse · return',
  timeRange: interval(),
  sources: [
    source(
      'cloudflare-outage',
      'Cloudflare Radar',
      'https://blog.cloudflare.com/tonga-internet-outage/',
      '2022-01-19',
    ),
    source(
      'cloudflare-return',
      'Cloudflare Radar',
      'https://blog.cloudflare.com/internet-is-back-in-tonga-after-38-days-of-outage/',
      '2022-02-22',
    ),
    source(
      'itu-response',
      'International Telecommunication Union',
      'https://www.itu.int/hub/2022/02/restoring-connectivity-tonga-internet/',
      '2022-02-10',
    ),
    source(
      'nasa-airs',
      'NASA JPL AIRS',
      'https://airs.jpl.nasa.gov/news/184/airs-observations-of-the-tonga-undersea-volcano-eruptions-in-january-2022/',
      '2022-02-28',
    ),
    source(
      'diaz-seismic',
      'Jordi Diaz · Communications Earth & Environment',
      'https://www.nature.com/articles/s43247-022-00616-1',
      '2022-11-16',
    ),
    source(
      'telegeography',
      'TeleGeography',
      'https://www.submarinecablemap.com/',
      null,
      '© TeleGeography · CC BY-NC-SA 3.0; current generalized reference, not 2022 route',
    ),
  ],
  evidence: [
    {
      id: 'sole-international-link',
      sourceId: 'itu-response',
      locator:
        'Opening account, paragraph immediately before the cable-cut diagram',
      summary:
        'ITU described the damaged international cable as Tonga’s sole submarine cable connection to the rest of the world. This is a retrospective report about the 2022 disruption, not a claim that satellite access was impossible.',
    },
    {
      id: 'fiji-international-link',
      sourceId: 'cloudflare-return',
      locator: 'Repair account immediately below the 45-day traffic chart',
      summary:
        'Cloudflare’s February 22 repair account identifies the submarine cable as connecting Tonga with Fiji and international networks. The present-day route drawing provides geographic context, not proof of its precise 2022 seabed alignment.',
    },
    {
      id: 'event-location',
      sourceId: 'diaz-seismic',
      locator: 'Results: Temporal evolution of the Hunga-Tonga eruption',
      summary:
        'The paper quotes the USGS catalog location as 20.546°S, 175.390°W. The display rounds this estimate; it is not a surveyed vent outline.',
    },
    {
      id: 'traffic',
      sourceId: 'cloudflare-outage',
      locator: 'Traffic by ASN and BGP sections',
      summary:
        'Cloudflare saw traffic decline after 03:00 UTC, close to none by 05:30, and a BGP update spike at 05:35 on January 15.',
    },
    {
      id: 'restoration',
      sourceId: 'cloudflare-return',
      locator: 'February 22 restoration account',
      summary:
        'Cloudflare traffic increased toward earlier levels shortly after midnight UTC February 22. Digicel announced service on Tongatapu and Eua at 02:13 UTC. Domestic repairs remained incomplete.',
    },
    {
      id: 'fault-distance',
      sourceId: 'itu-response',
      locator: 'Cable cut points diagram',
      summary:
        'An ITU-reproduced diagram reports faults about 37 km and 47 km from Nuku’alofa. Bearing and radial versus along-cable distance convention are unspecified.',
    },
    {
      id: 'fallback',
      sourceId: 'itu-response',
      locator: 'Emergency telecommunications response',
      summary:
        'A Ku-band terminal at Fua’amotu Airport was realigned to Intelsat Horizon 3E for emergency access; activation time is unspecified.',
    },
    {
      id: 'eruption',
      sourceId: 'nasa-airs',
      locator: 'January 15 eruption and AIRS observations',
      summary:
        'NASA JPL gives the main eruption time as 04:14 UTC January 15; AIRS measurements were acquired later, 10:59–16:11 UTC.',
    },
    {
      id: 'cable-map',
      sourceId: 'telegeography',
      locator: 'Bundled 2026-05-24 cable-geo.json subset',
      summary:
        'Generalized present-day route illustration, not surveyed 2022 fault geometry.',
    },
  ],
  entities: [
    record(
      'volcano',
      'Hunga Tonga–Hunga Haʻapai',
      'REPORTED',
      ['eruption'],
      START,
      {
        geometry: point(
          [-175.39, -20.55],
          ['event-location'],
          'Rounded seismic catalog estimate quoted by Diaz; not a surveyed vent boundary',
        ),
      },
    ),
    record(
      'tonga',
      'Tongatapu · Nukuʻalofa',
      'CURRENT_REFERENCE',
      ['cable-map'],
      START,
      {
        geometry: {
          type: 'Point',
          coordinates: [-175.2, -21.13],
          precision: 'APPROXIMATE',
          basis: 'CURRENT_REFERENCE',
          description:
            'Country context at the rounded bundled Tonga cable endpoint; not a sensor, terminal or historical landing survey.',
          evidenceIds: ['cable-map'],
        },
      },
    ),
    record(
      'fiji',
      'Fiji connection',
      'CURRENT_REFERENCE',
      ['cable-map'],
      START,
      {
        geometry: {
          type: 'Point',
          coordinates: [178.44, -18.12],
          precision: 'APPROXIMATE',
          basis: 'CURRENT_REFERENCE',
          description:
            'Current-reference route endpoint vicinity, not historical landing survey',
          evidenceIds: ['cable-map'],
        },
      },
    ),
    record(
      'international-cable',
      'Tonga cable · current reference',
      'CURRENT_REFERENCE',
      ['cable-map'],
    ),
    record(
      'domestic-cable',
      'Domestic extension · current reference',
      'CURRENT_REFERENCE',
      ['cable-map'],
    ),
    record(
      'airport',
      'Fuaʻamotu emergency terminal',
      'REPORTED',
      ['fallback'],
      '2022-02-10T00:00:00Z',
      {
        anchorId: 'tonga',
        spatialDescription:
          'Country context · not the terminal location. ITU names Fuaʻamotu Airport but supplies no coordinates.',
      },
    ),
    record(
      'fault-unknown',
      '37 km report · exact break unknown',
      'UNKNOWN',
      [],
      '2022-01-15T05:30:00Z',
      {
        question:
          'Where was the break? The ITU caption gives distance from Nukuʻalofa, but no bearing, coordinate, or radial-versus-along-cable convention.',
        geometry: {
          type: 'DistanceLocus',
          center: [-175.2, -21.13],
          radiusMeters: 37000,
          precision: 'APPROXIMATE',
          basis: 'RECONSTRUCTED',
          description:
            'Illustrative 37 km distance comparison only, not a fault boundary. The report does not establish radial versus along-cable distance.',
          evidenceIds: ['fault-distance', 'cable-map'],
        },
      },
    ),
  ],
  events: [
    record(
      'main-eruption',
      '15 Jan eruption · 04:14 UTC',
      'REPORTED',
      ['eruption'],
      '2022-01-15T04:14:00Z',
      {
        geometry: point(
          [-175.39, -20.55],
          ['event-location'],
          'Reconstructed event marker at approximate volcanic area',
        ),
      },
    ),
    record(
      'cable-damage',
      'International and domestic faults reported',
      'REPORTED',
      ['fault-distance'],
      '2022-01-15T05:30:00Z',
      {
        timePrecision: 'UNSPECIFIED',
        timeDescription:
          'Retrospective damage report associated with the January outage; 05:30 is a display anchor, not a measured break time.',
      },
    ),
    record(
      'emergency-access',
      'Emergency satellite access documented by ITU',
      'REPORTED',
      ['fallback'],
      '2022-02-10T00:00:00Z',
      {
        timePrecision: 'BY_PUBLICATION_DATE',
        timeDescription:
          'Known to have been operating by ITU publication on February 10; activation time unspecified.',
      },
    ),
    record(
      'cable-repaired',
      'Primary cable repaired',
      'REPORTED',
      ['restoration'],
      '2022-02-22T02:13:00Z',
      {
        timePrecision: 'ANNOUNCEMENT',
        timeDescription:
          'Digicel announcement time, not exact physical completion time.',
      },
    ),
  ],
  observations: [
    record(
      'traffic-decline',
      'Cloudflare traffic decline after ~03:00',
      'OBSERVED',
      ['traffic'],
      '2022-01-15T03:00:00Z',
      {
        validTime: interval('2022-01-15T03:00:00Z', '2022-01-15T05:30:00Z'),
        timePrecision: 'APPROXIMATE',
        method: 'published-summary',
        metric: 'Traffic to Cloudflare',
        value: 'Declining',
        scope: 'Tonga main ISPs at Cloudflare vantage',
        observedTime: interval('2022-01-15T03:00:00Z', '2022-01-15T05:30:00Z'),
        anchorId: 'tonga',
        spatialDescription:
          'Country context · not a network sensor location or measured coverage area.',
      },
    ),
    record(
      'traffic-collapse',
      'Near-zero Cloudflare traffic ~05:30',
      'OBSERVED',
      ['traffic'],
      '2022-01-15T05:30:00Z',
      {
        validTime: interval('2022-01-15T05:30:00Z', '2022-02-22T00:00:00Z'),
        timePrecision: 'APPROXIMATE',
        timeDescription:
          'Near-zero by approximately 05:30. observedTime identifies the containing UTC date, not a measurement duration. Small satellite traffic later returned; the display interval is not continuous measured zero traffic.',
        method: 'published-summary',
        metric: 'Traffic to Cloudflare',
        value: 'Close to none',
        scope: 'Digicel and Kalianet at Cloudflare vantage',
        observedTime: interval('2022-01-15T00:00:00Z', '2022-01-16T00:00:00Z'),
        observedAt: '2022-01-15T05:30:00Z',
        observedTimePrecision: 'CONTAINING_DAY',
        anchorId: 'tonga',
        spatialDescription:
          'Country context · not a network sensor location or measured coverage area.',
      },
    ),
    record(
      'bgp-spike',
      'BGP updates spike · 05:35',
      'OBSERVED',
      ['traffic'],
      '2022-01-15T05:35:00Z',
      {
        method: 'published-summary',
        metric: 'BGP updates',
        value: 'Spike',
        scope: 'Tonga ASNs seen by Cloudflare',
        observedTime: interval('2022-01-15T00:00:00Z', '2022-01-16T00:00:00Z'),
        observedAt: '2022-01-15T05:35:00Z',
        observedTimePrecision: 'CONTAINING_DAY',
        timeDescription:
          'Published spike timestamp 05:35; duration unspecified. observedTime is the containing UTC date, not a measured one-minute interval.',
      },
    ),
    record(
      'airs-acquisition',
      'AIRS atmospheric acquisitions · 10:59–16:11',
      'OBSERVED',
      ['eruption'],
      '2022-01-15T10:59:00Z',
      {
        method: 'sensor-summary',
        metric: 'AIRS 4.3 micrometre infrared radiance',
        value: 'Concentric atmospheric wave patterns',
        scope: 'AIRS over Tonga region',
        observedTime: interval('2022-01-15T10:59:00Z', '2022-01-15T16:11:00Z'),
      },
    ),
    record(
      'traffic-return',
      'Traffic returns to similar levels · Feb 22',
      'OBSERVED',
      ['restoration'],
      '2022-02-22T00:00:00Z',
      {
        timePrecision: 'APPROXIMATE',
        timeDescription:
          'Shortly after midnight UTC, not precisely 00:00. Midnight anchors the approximate day-level summary.',
        method: 'published-summary',
        metric: 'Traffic to Cloudflare',
        value: 'Similar to pre-eruption',
        scope: 'Tonga at Cloudflare vantage',
        observedTime: interval('2022-02-22T00:00:00Z', '2022-02-23T00:00:00Z'),
        anchorId: 'tonga',
        spatialDescription:
          'Country context · not a network sensor location or measured coverage area.',
      },
    ),
  ],
  claims: [
    record(
      'international-dependency',
      'Tonga’s sole international cable connected through Fiji',
      'REPORTED',
      ['sole-international-link', 'fiji-international-link'],
      START,
      {
        timePrecision: 'RETROSPECTIVE_CONTEXT',
        timeDescription:
          'Historical dependency described in February 2022 reports. The January 14 display anchor is not a date of construction or publication.',
      },
    ),
    record(
      'chronology-gap',
      'Initial decline precedes main explosion',
      'UNKNOWN',
      ['traffic', 'eruption'],
      '2022-01-15T04:14:00Z',
      {
        question:
          'What caused the initial network decline around 03:00, before the main explosion at 04:14? These sources alone do not resolve it.',
      },
    ),
    record(
      'domestic-recovery-unknown',
      'Outer-island recovery unresolved',
      'UNKNOWN',
      ['restoration'],
      '2022-02-22T00:00:00Z',
      {
        question:
          'When did all outer-island services recover? The February 22 report explicitly says domestic repairs remained incomplete.',
      },
    ),
  ],
  relationships: [
    record(
      'damage-connection',
      'Reported cable faults coincide with connectivity collapse',
      'REPORTED',
      ['fault-distance', 'traffic'],
      '2022-01-15T05:30:00Z',
      { from: 'cable-damage', to: 'traffic-collapse', type: 'ASSOCIATED_WITH' },
    ),
    record(
      'repair-connection',
      'Cable repair and traffic return',
      'REPORTED',
      ['restoration'],
      '2022-02-22T02:13:00Z',
      { from: 'cable-repaired', to: 'traffic-return', type: 'ASSOCIATED_WITH' },
    ),
  ],
  timeline: [
    { time: '2022-01-14T00:00:00Z', label: 'Before' },
    { time: '2022-01-15T03:00:00Z', label: 'Traffic declines' },
    { time: '2022-01-15T04:14:00Z', label: 'Main eruption' },
    { time: '2022-01-15T05:30:00Z', label: 'Outage' },
    { time: '2022-02-10T00:00:00Z', label: 'Fallback documented' },
    { time: '2022-02-22T02:13:00Z', label: 'Recovery reported' },
  ],
};
