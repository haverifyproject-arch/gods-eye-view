# Internet Health source evaluation

Verified 25 September 2026. Research only; no application integration is implied by these probes.

## Decision

**IODA is technically viable without credentials for a current/recent measurement-anomaly layer.** Its public API returned current records, measurement series and geography. Keep a replaceable adapter and provider attribution. Do not label every detection a confirmed outage or infer a cause. Data redistribution/commercial license terms remain unverified: the response carries Georgia Tech Research Corporation copyright and “All Rights Reserved.” Public API access is not an open-data license.

Cloudflare Radar is a useful optional provider with a clearer published data license, but its official API needs a free account token. No token was requested or used. It is not the credential-free default.

## Actual probes and retained samples

All samples are in ignored `output/`, not bundled as current data.

| Sample | Exact request | Result |
| --- | --- | --- |
| `ioda-live-events.json` | `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?from=1790260527&until=1790346927&entityType=country&limit=5&orderBy=time&format=ioda` | HTTP 200, no authentication, provider response 2026-09-25T14:35:29Z; five country events |
| `internet-probe-events.json` | `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?from=1790260527&until=1790346927&entityType=country&limit=20&orderBy=score/desc&format=ioda&extendWindow=0` | HTTP 200; first ranked records include GTR SARIMA anomalies, illustrating why detection is not confirmation |
| `ioda-live-non-gtr-events.json` | `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?from=1790260527&until=1790346927&entityType=country&limit=10&orderBy=score/desc&format=ioda&ignoreMethods=gtr.*` | HTTP 200; measured active probing, BGP and telescope records, including CV, PM, PY, TN, TC, SO, BM, NG, NE, CG |
| `internet-probe-signals.json` | `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country/PY?from=1790343327&until=1790346927&datasource=bgp` | HTTP 200; 300-second sample spacing, trailing nulls; last non-null at 14:05 UTC versus provider response 14:36:35 UTC |
| `internet-probe-topo.json` | `https://api.ioda.inetintel.cc.gatech.edu/v2/topo/country` | HTTP 200; approximately 19.8 MB; TopoJSON object `ne_10m_admin_0.countries`, join field `usercode` |
| `internet-probe-cloudflare.json` | `https://api.cloudflare.com/client/v4/radar/annotations/outages?limit=5&dateRange=1d&format=json` | HTTP 400, error 9106: missing authentication headers |

IODA event/signal/topography responses echoed `Access-Control-Allow-Origin: https://example.org` when probed with that Origin. A same-origin server adapter remains preferable for caching, bounded requests and consistent failures. Do not depend on the Vite development proxy in production.

## IODA contract and normalization

The [official API documentation](https://api.ioda.inetintel.cc.gatech.edu/v2/) embeds an OpenAPI specification. A fetched copy is in `output/ioda-openapi.json`. Its events endpoint accepts country/region/ASN scope, epoch-second bounds, pagination, ranking, detection-method exclusions and cross-source merging. The default `extendWindow` is 1,209,600 seconds: detections overlapping the requested window can begin up to fourteen days earlier. An event whose `until` equals the query cutoff is not evidence of recovery.

| Normalized field | Provider field / rule |
| --- | --- |
| `id` | Stable key from provider + `entity.type` + `entity.code` + `datasource` + `method` + `from`; no upstream unique ID supplied |
| `entityType`, `countryCode`, `name` | `entity.type`, `entity.code`, `entity.name`; only map country records through a real ISO-code polygon join |
| `startTime` | Epoch seconds `from` converted to UTC; preserve query window and extension so a clipped boundary is not treated as exact onset |
| `endTime` | `until` only as detection interval endpoint; when equal to request cutoff expose open/window-clipped status rather than confirmed recovery |
| `measurement` | `datasource`, with `method` retained; BGP visibility, active probing and telescope are different observations |
| `providerScore` | Numeric `score`, labeled IODA detector score; not percentage population offline, probability, global severity class or cross-provider confidence |
| `evidenceStatus` | The native layer uses OBSERVED for the source-published anomaly detection that was actually retrieved. IODA computes that detection from measurements; the event endpoint does not provide raw samples. This label does not establish a nationwide outage, affected network, current failure, recovery or cause. Our geographic relationship calculations remain DERIVED and speculative explanations remain INFERRED. |
| `fetchedAt`, `providerRespondedAt` | Local fetch completion and `metadata.responseTime`, separately preserved |
| `latestSampleAt` | For requested raw signals, `from + index * step` for last non-null value. Never use response time as measurement freshness |
| `geometry` | Country Polygon/MultiPolygon from an attributed geographic dataset; scope is country aggregation, not measured universal outage coverage |
| `sourceUrl` | IODA country view `https://ioda.inetintel.cc.gatech.edu/country/{code}?from={from}&until={until}` plus exact API request in provenance |
| `rights` | Preserve response `copyright`; redistribution/commercial rights unresolved |

The [IODA resource glossary](https://ioda.inetintel.cc.gatech.edu/resources?tab=glossary) explains the measurement methods and threshold-based anomaly detection. A signal drop is not proof of censorship or cable damage. The tested sample demonstrates roughly 31 minutes of BGP lag; this is an observed example, not an SLA. Nulls must remain gaps. Ranking by score alone selected many GTR anomalies; excluding `gtr.*` was tested successfully but is a product scope choice, not validation that the remaining events are true nationwide outages.

No numerical request quota or availability SLA was found in the reviewed official documentation, and the tested responses supplied no rate-limit header. Recommended local policy: one shared cached event request per five minutes, on-demand bounded raw series, backoff on errors, honor Retry-After, explicit stale/error states. This is our conservative policy, not a provider-published limit. Do not load-test the service to discover limits.

## Rights and alternative provider

[IODA publishes its API for retrieving event and series data](https://ioda.inetintel.cc.gatech.edu/resources?tab=repositories), but the current API response expressly reserves copyright. Its software being open source does not establish a data license. Do not label live data MIT or commercially cleared; preserve provenance and make the limitation explicit in project documentation.

[Cloudflare Radar is free on all plans and licenses API data under CC BY-NC 4.0](https://developers.cloudflare.com/radar/). Its [first-request instructions](https://developers.cloudflare.com/radar/get-started/first-request/) require an API token, and the [outages endpoint](https://developers.cloudflare.com/radar/investigate/outages/) exposes start/end, scope, locations, ASNs and attributed causes. Keep any token server-side. Published noncommercial terms are clearer, but authentication remains an initial setup dependency.

## Geographic inventory and safe path

- Existing `src/data/local_data/natural_earth/regions.json` contains named physical regions and island-group envelopes, not a global administrative country boundary layer. Do not use those envelopes as country polygons.
- `public/reality/pacific-land.geojson` has Fiji/Tonga only. `public/cyber/` has United States/Ukraine prototype shapes only. None is a global join source.
- `output/natural-earth-countries.geojson` already contains the full original Natural Earth 1:10m country dataset from pinned revision `ca96624a56bd078437bca8184e78163e5039ad19`. The [source](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson) and [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/) are verified. Curate an ISO-alpha2 Polygon/MultiPolygon pack directly from it; retain dateline parts/holes, explicit unmatched-code handling and public-domain attribution.
- IODA's `/topo/country` is usable technically, but the [IODA polygon repository](https://github.com/CAIDA/ioda-geo-polygons) describes its derivative data as noncommercial. Prefer direct Natural Earth for simpler rights and a smaller packaged country layer.
- Do not manufacture country centroids or ASN coordinates. For camera fitting, derive the bounding region from actual selected polygon geometry. A country-fill is aggregation context, never a statement that every address inside it is disconnected.

## PeeringDB current infrastructure evaluation

On 25 September 2026 these unauthenticated requests returned HTTP 200; the facility response echoed a supplied browser Origin:

- `https://www.peeringdb.com/api/fac?country=US&depth=0&limit=2` → `output/peeringdb-fac-sample.json`. Facility records include `id`, `name`, `country`, real `latitude`/`longitude`, `updated`, and network/exchange counts. Use only the minimal fields needed; do not display contact information.
- `https://www.peeringdb.com/api/ix?country=US&depth=0&limit=1` → `output/peeringdb-ix-sample.json`. IXP id 1 has a city and country, **no coordinates**. Do not invent a point for it. An exchange may span multiple facilities.
- `https://www.peeringdb.com/api/netfac?fac_id=1&depth=0&limit=1` → `output/peeringdb-netfac-sample.json`. Returned relationship id 22 connects `net_id:2`, `local_asn:20940`, `fac_id:1`; its `updated` is 2016-03-14. This is listed current-reference presence, not real-time traffic, outage involvement, or historical topology.

The [API specification](https://docs.peeringdb.com/api_specs/) allows guest reads with bounded `limit`, `depth=0`, selected `fields` and filters. The [query-limit policy](https://docs.peeringdb.com/howto/work_within_peeringdbs_query_limits/) publishes 20 anonymous queries/minute/IP, identical requests twice/minute, and identical responses over 100 KB once/hour. It asks automated clients to use an API key and identifying User-Agent. Cache contextual reads, avoid background bulk harvesting, and do not infer that successful guest probes remove those recommendations.

[PeeringDB's AUP](https://www.peeringdb.com/aup) reserves copyright and constrains reproduction/redistribution to approved Internet operational purposes; it includes network troubleshooting and Internet research/analysis while excluding marketing and other commercial applications. It is not CC0, MIT, or unrestricted commercial data. A production portfolio redistribution requires a clear permitted-use assessment; keep probe samples outside public assets. This evaluation establishes technical access, not new permission to republish the database.

Recommended contextual model: `facility` with source coordinates and update time, `network` without arbitrary geography, and `networkListedAtFacility` only from actual `netfac` records. Shared country is merely co-location context, never an asserted outage dependency. An IODA country anomaly does not identify affected ASNs. This provider is optional enrichment; current bundled cable context can support the initial product without PeeringDB credentials or rights assumptions.

## Prepared geographic asset

`public/reality/countries.geojson` now contains 237 source-coded country MultiPolygons, 1.69 MB uncompressed / approximately 568 KB gzip. Properties are `iso2`, `name`, `labelLon`, `labelLat`, `status`. Label coordinates come directly from Natural Earth's cartographic label fields; they are not incident coordinates. Source parts sharing a code are combined without inventing edges. All ten country codes from the non-GTR IODA probe resolve, including small territories absent from many 1:110m maps. Source revision, hash and curation are embedded; see `countries.README.md` and `scripts/build-internet-countries.mjs`.
