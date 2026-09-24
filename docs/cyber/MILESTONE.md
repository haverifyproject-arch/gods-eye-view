# Development history

Current behavior and verification entry points: [CURRENT-EXPERIENCE.md](CURRENT-EXPERIENCE.md). The sections below record earlier milestones and may describe superseded interfaces.

Open `http://127.0.0.1:4173/cyber.html`. The original upstream app remains at `/`.

## Checkout and baseline

- Fork: https://github.com/haverifyproject-arch/gods-eye-view (`origin`).
- Original: https://github.com/bilawalsidhu/gods-eye-view (`upstream`).
- Starting SHA: `ce671ce500a393be27e3cbb2a08799fbca9b6e28`.
- Working branch: `feat/cyber-situation-room`.
- Upstream requires Node >=24.14.0 <25 or >=26 <27. System Node was 22.17; a portable Node 24.14.0 was installed under ignored `.local-runtime/node-v24.14.0-win-x64`, leaving the system installation alone. npm 11.9.0 is bundled with that runtime.
- Locked dependencies installed with `npm ci`; audit reported zero vulnerabilities at installation. No credentials added.
- Upstream doctor and production build passed. The initial unrestricted-concurrency test invocation overwhelmed local resources and was stopped. The same upstream test plan then ran with `--test-concurrency=2`: 5,030 ordinary tests, 5,020 passes, 10 skips, zero failures; both serialized allocation gates passed (14 tests).
- Original app initialized in Chromium and registered 29 layers. First browser baseline had blocked external requests. The network-enabled-browser run completed with 103 passes / 6 failures; the development server still lacked external access and returned terrain HTTP 502s. Raw logs are in ignored `output/`. This baseline was not represented as entirely green.

## Delivered behavior

The left rail selects subjects and reference layers. The upstream Cesium viewer renders bundled Natural Earth imagery and a pinned Ukraine outline. The semantic graph connects the reported incident, operator, AS15895 and a published Cloudflare measurement summary. Click a node/edge or an investigation claim to inspect supporting evidence.

The bottom timeline selects four documented recovery milestones; UTC/Kyiv display preserves date-only precision. It is retrospective, using sources published after the event where explicitly disclosed. Milestones are discrete steps, not proportionally spaced samples or a replay of contemporaneous analyst knowledge. The 79.5-hour interval comes from the published Cloudflare endpoints, not fabricated traffic points.

The right panel distinguishes KNOWN (observed/derived), REPORTED, INFERRED, DISPUTED and UNKNOWN, and exposes evidence, publication/retrieval dates, locators, source URLs, method, rights, limitations and next questions. Empty DISPUTED means no reviewed conflicting claims, not proof that no disagreement exists. The bundle export includes every normalized record and provenance reference.

`public/cyber/kyivstar.json` is the static canonical artifact. Source notes and the normalization adapter live in `src/cyber/scenario.js`; `scripts/build-cyber-scenario.mjs` regenerates it. `src/cyber/model.js` validates both build-time and runtime data. `public/cyber/ukraine.geojson` is the pinned adapter input. Its SHA-256 is `B0D8AD47153DFBD85579C7219F762B5B0A12A60C7FADC457C765224FE46F1C89`.

## Reproduce checks

In PowerShell, prepend the portable runtime to this shell's PATH:

```powershell
$env:Path = "$PWD\.local-runtime\node-v24.14.0-win-x64;$env:Path"
npm.cmd run cyber:data
npm.cmd run cyber:validate
npm.cmd run test:cyber
npm.cmd run build
npm.cmd run format:check
npm.cmd run check:boundaries
npm.cmd run qa:cyber
```

The browser gate expects the dev server on port 4173. It also accepts a built-preview URL: `node scripts/qa-cyber.mjs http://127.0.0.1:4174/cyber.html`. Chromium must be allowed to launch; restricting process/network interception can stall Cesium worker loads. The gate uses browser-level HTTPS blocking and rejects any external request. It validates actual nonuniform globe pixels, tile readiness, provenance, milestone and subject selection, layer toggles, timezone conversion, evidence search, keyboard navigation, and 1440/1100/390px layouts. Screenshots under `output/cyber-*.png` use SwiftShader; these establish software-renderer appearance, not a hardware-GPU performance benchmark.

## Final verification

The canonical snapshot reproducibility check and all 13 focused model tests pass. Production build, repository formatting (1,085 source files), and package/import boundary checks pass. The focused browser gate passes against the production preview, with external HTTPS blocked and zero external requests. It verifies visible globe pixels and captures desktop, laptop, mobile and evidence views; those screenshots were visually inspected. The inherited large-bundle build warning remains.

A further upstream tracking run with both server and browser network access was stopped after it became resource-heavy; it is not counted as a passing result. The completed baseline result above remains the reported upstream browser limitation. No upstream terrain logic was changed.

## Deliberate evidence limits

No raw Cloudflare samples or IODA signals have been imported. No event-time facility inventory or physical dependency routes were established. PeeringDB is researched but not bundled or treated as 2023 topology. The current country outline is not a telecom coverage polygon. Independent forensic confirmation of initial access, affected facilities and data exposure remains outside this verified bundle. Sources and access limitations are recorded in `SOURCES.md`; research can continue without pretending those gaps are facts.

No live feeds, agent, enterprise telemetry, authentication, other scenarios or deployment are part of this milestone. Optional upstream integrations remain available through the original app. Code MIT licensing does not grant redistribution rights to every source or upstream dataset.

## Colonial Pipeline follow-up

Default `/cyber.html` now opens the United States May 2021 case; the case selector retains Kyivstar. Added a separately normalized, reproducible canonical bundle and parameterized the existing globe, evidence, export and timeline controls. The U.S. outline is reference geography only. No actual route or measured outage geometry is available in this bundle.

Validation: both canonical bundles reproduce; 14 focused model tests; production build; import/package boundaries; formatting. Real Chromium/SwiftShader browser acceptance covers default Colonial evidence/restart/country selection, mobile layout, case-switch navigation, existing Kyivstar timeline/timezone/provenance, offline globe pixels and zero external requests. Desktop and mobile screenshots inspected. Existing upstream baseline limitations recorded above remain unchanged; the large upstream suite was not rerun for this focused scenario addition.
`nInteraction follow-up: subject, graph and milestone selections now focus and highlight country reference context, update the stage heading, and reveal the relevant section on mobile. Added zoom controls and Overview reset. Geographic detail remains limited to the sourced country outline. Browser acceptance checks include visible canvas change and linked graph selection.

Visual follow-up: Colonial selections now render source-linked incident explainers for shutdown, IT/operations dependency, endpoint geography, emergency response, attribution, restart and evidence gaps. Endpoint diagram is explicitly schematic, not route geometry. Country selection retains the globe. Browser checks exercise four milestone visuals, pipeline diagram and evidence steps; production build, formatting and boundaries pass.

Persistent-scene redesign: replaced interchangeable three-card explainers with a stable system diagram. Milestones update pipeline, response and attribution states; subject selections highlight system components. Evidence preserves the scene DOM, layout and timeline, with a mobile drawer. Country outline is reference; endpoint line is explicitly schematic. Removed duplicate graph and empty status groups for Colonial. Browser acceptance now asserts scene continuity, reversible state, matching evidence, subject focus, mobile drawer and Kyivstar provenance regression. Build, focused model tests and boundary checks pass.
