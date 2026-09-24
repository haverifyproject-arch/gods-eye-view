<!-- Scope update, 24 Sep 2026: user authorized Colonial Pipeline (May 2021) as the primary case; Kyivstar remains optional. This supersedes the original single-case restriction below. -->
# Architecture decision 001: a separate application on the upstream globe

Upstream is vanilla JavaScript, CesiumJS and Vite. `src/app/application.js` owns phased lifecycle; `src/app/viewer.js` exposes its viewer constructor. `src/standalone/` assembles the full original experience; `server/providers/` owns secret-bearing access. See upstream `docs/APPLICATION.md` and `docs/CURRENT-STATE.md`.

Cyber Situation Room composes the upstream viewer in its own HTML entry, using the same Cesium instance and build. Existing `/` remains available. This avoids coupling the evidence workspace to 29 live layers or modifying page-scoped upstream controls. Bundled Natural Earth imagery and a pinned country outline make the scenario usable without credentials or external runtime data. Basemap geography is always reference context.

Pipeline: source document → curated source note → static adapter → validated canonical records → evidence/relationship selectors → Cesium renderer + investigation + timeline. Raw provider shapes never enter the UI. Future provider adapters must emit this same model. No live adapters or agent are implemented.

## Canonical records

All objects have stable IDs. Entities represent organization, network and country; events reference entities, claims and a time. Geometry is a separately sourced WGS84 Point/LineString/Polygon/MultiPolygon or orbital record with epoch and elements. Entity-to-geometry association requires an evidence-backed relationship. Nonspatial entities cannot acquire coordinates by default.

Claims reference subjects, evidence, time, status and limitations. Observations reference a metric, observer, method, time, evidence and scope; a published measurement summary is distinguished from raw samples. Evidence references a provenance record and a source locator. Provenance contains URL, publisher, publication/retrieval dates, access method, rights, transformations and limitations. Time records separate occurrence/valid time from publication/knowledge time; date-only precision stays date-only. Relationships reference typed endpoints, supporting claims, time and status. Inference must retain its premises.

The initial timeline is retrospective event-time navigation, not a simulation of what an analyst knew that day. Source publication dates are shown independently. It has discrete documented milestones, not interpolated traffic. Cloudflare's measured disruption interval is shown as an interval, not an invented numerical time series. Operator restoration is a separate lane. The network relationship graph is semantic, not physical routing.

## Validation and evolution

Reject duplicate IDs, missing references, unsupported statuses, reversed intervals, invalid coordinates, unsourced geometry and unsupported spatial associations. A source-only claim cannot be OBSERVED without a measurement record. CURRENT_REFERENCE geometry cannot be relabelled EVENT_TIME. Unknown/disputed states remain explicit. Version the bundle before changing schema semantics. A later agent should retrieve claims with evidence, limitations and dates, never just rendered labels.

## Ownership and attribution

Upstream owns Cesium integration, viewer settings, original globe application and provider ecosystem. Cyber Situation Room owns the canonical model, curated Kyivstar bundle, validation, semantic graph, retrospective timeline, evidence UI and dedicated visual design. Preserve upstream MIT license and third-party notices. Scenario source rights are separate from code rights.
