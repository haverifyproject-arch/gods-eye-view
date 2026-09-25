/** Authored explanation layered over the validated, source-linked Tonga mission. */
export const TONGA_STORY = Object.freeze({
  title: 'How Tonga lost its connection',
  introduction:
    'An eruption. A damaged cable. Weeks without normal internet access. Follow the connection that made Tonga vulnerable, the evidence of its failure, and the work that brought service back.',
  conclusion:
    'Tonga’s connection depended on infrastructure far beyond the shoreline. Emergency satellite access supported essential services while cable repairs restored the main link. Restoring the main link did not establish recovery for every island—and the evidence still leaves gaps.',
  chapters: Object.freeze([
    Object.freeze({
      id: 'dependency',
      title: 'One cable across an ocean',
      question: 'Why could one damaged connection matter so much?',
      body: 'Tonga’s international submarine cable connected the country to Fiji and onward to global networks. ITU described it as Tonga’s only international cable. Follow that long connection: a failure offshore could interrupt communications across the islands, far beyond the place where the cable was damaged.',
      takeaway:
        'A distant physical connection supported everyday digital life.',
      questionLabel: 'Why this cable mattered',
      questionAnswer:
        'ITU described a single international cable. It linked Tonga through Fiji to global networks, concentrating dependence on one physical connection across the ocean.',
      questionAction: 'follow',
      durationSec: 18,
      sourceRecordId: 'international-dependency',
      time: '2022-01-14T00:00:00Z',
      cameraTarget: 'pacific',
      visualType: 'dependency',
    }),
    Object.freeze({
      id: 'disruption',
      title: 'The connection falls silent',
      question: 'What changed on January 15?',
      body: 'Hunga Tonga–Hunga Haʻapai erupted. Cable faults were reported, and by about 05:30 UTC Cloudflare saw almost no traffic from Tonga’s two main internet providers. The network collapse is visible in those measurements; the exact underwater break locations are not established by this account.',
      takeaway:
        'Reported cable damage accompanied an observed network collapse.',
      questionLabel: 'Show the outage evidence',
      questionAnswer:
        'Cloudflare observed almost no traffic from Digicel and Kalianet by 05:30 UTC. That measures network disruption; it does not locate an underwater cable break.',
      questionAction: 'observed',
      durationSec: 18,
      sourceRecordId: 'traffic-collapse',
      time: '2022-01-15T05:30:00Z',
      cameraTarget: 'volcano',
      visualType: 'disruption',
    }),
    Object.freeze({
      id: 'evidence',
      title: 'The timeline has a gap',
      question: 'Does the evidence tell a simple cause-and-effect story?',
      body: 'Traffic was already declining around 03:00 UTC. NASA places the main explosion at 04:14; near-zero traffic followed by 05:30. That ordering matters. These sources show a major disruption, but they do not explain why the first decline began before the main explosion.',
      takeaway:
        'The first decline predates the main explosion. Its cause remains unresolved.',
      questionLabel: 'Compare the source accounts',
      questionAnswer:
        'Cloudflare’s initial decline is around 03:00. NASA’s main explosion is 04:14. Those times leave the cause of the earliest decline unresolved.',
      questionAction: 'timing',
      durationSec: 19,
      sourceRecordId: 'chronology-gap',
      time: '2022-01-15T05:35:00Z',
      cameraTarget: 'tonga',
      visualType: 'evidence',
    }),
    Object.freeze({
      id: 'emergency',
      title: 'A lifeline while repairs continued',
      question: 'How could essential services reconnect?',
      body: 'Satellite assistance gave essential services another way to communicate. ITU documented a weather-service terminal at Fuaʻamotu Airport realigned to reach an Intelsat satellite. Temporary bandwidth, equipment and satellite phones supported the response while the damaged submarine connection still needed repair.',
      takeaway:
        'Emergency access supported essential services; it did not mean full recovery.',
      questionLabel: 'Read the emergency response',
      questionAnswer:
        'Partners provided temporary satellite bandwidth and equipment. A repurposed weather-service terminal helped essential services reconnect; the report does not establish a precise activation time.',
      questionAction: 'fallback',
      durationSec: 18,
      sourceRecordId: 'emergency-access',
      time: '2022-02-10T00:00:00Z',
      cameraTarget: 'airport',
      visualType: 'emergency',
    }),
    Object.freeze({
      id: 'recovery',
      title: 'Back online was not everyone',
      question: 'What had recovered by February 22?',
      body: 'Cloudflare saw traffic climb toward earlier levels shortly after midnight on February 22. Digicel announced restored service on Tongatapu and Eua after cable repairs. But the domestic cable to outer islands still needed work. The main link’s return was a milestone, not the end for everyone.',
      takeaway:
        'The international connection returned before domestic recovery was complete.',
      questionLabel: 'Check what recovered',
      questionAnswer:
        'Digicel named Tongatapu and Eua in its restoration announcement. The same account says the domestic cable still needed repairs, leaving outer-island recovery incomplete.',
      questionAction: 'recovery',
      durationSec: 19,
      sourceRecordId: 'traffic-return',
      time: '2022-02-22T02:13:00Z',
      cameraTarget: 'tonga',
      visualType: 'recovery',
    }),
  ]),
});
