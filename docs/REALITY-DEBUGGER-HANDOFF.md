# Reality Debugger — handoff

**SUPERSEDING UPDATE — 25 September 2026:** Read `docs/reality/NATIVE-CORRECTIVE-CONTRACT.md` and the top of `docs/reality/BUILD-JOURNAL.md`. The owner rejected historical missions and walkthroughs. Current work extends normal God's Eye View with a native Internet Health layer and generic Debug This action. The Tonga scope and implementation status below are archived history, not active requirements. Integration seams are documented in `docs/reality/NATIVE-INTEGRATION.md`; source findings in `docs/reality/INTERNET-SOURCES.md`.

Status: **RESUMED by the user's explicit request: "just start the full build." Cloud-first development, GitHub source control, Vercel deployment. See docs/reality/BUILD-JOURNAL.md for current execution state.**

**Current update (24 September 2026):** The cloud implementation is integrated and reviewed by parallel architecture, research and UX agents. Native Tonga mode lives in `src/situations/world.js`, with lifecycle in `src/standalone/realityMode.js`. The validated mission, source registry, offline geography, shared text/voice actions and visual harness exist. The build journal is authoritative for checks in progress. Baseline notes below are historical, not current implementation status.

## Governing request

Read the full master contract at `C:/Users/yulsl/.codex/attachments/a77bf8f9-7b16-49dc-b107-6cd79d0d5851/Pasted text.txt` on resume. It supersedes the old Cyber Situation Room scope in root AGENTS.md. User rejected the dashboard concept entirely. Preserve existing uncommitted work; do not reset the repository.

Build REALITY DEBUGGER as a native mode of Bilawal Sidhu's God's Eye View. THE WORLD IS THE INTERFACE. One mission: January 2022 Hunga Tonga eruption, cable damage, connectivity collapse, emergency fallback, repair and recovery. No Russia/Ukraine, Kyivstar, Colonial, SOC dashboard, permanent evidence sidebar, invented topology or precise cable break. Deterministic first; AI/voice optional. Reuse native viewer, navigation ownership, scene camera motion, annotations and action architecture. User authorized autonomous implementation through polished 60–120 second demo, tests and mandatory visual QA; pause overrides that until resumed.

## DONE

- Read contract; inspected current repository, docs/CURRENT-STATE.md and native architecture. No Reality Debugger application code has been implemented yet.
- Setup doctor passed with installed dependencies. Portable Node24.14.0 at `.local-runtime/node-v24.14.0-win-x64/node.exe`. Upstream foundation SHA `ce671ce500a393be27e3cbb2a08799fbca9b6e28`; working branch previously `feat/cyber-situation-room`, last recorded commit `86b5bb8`.
- Baseline unit run: 5,044 tests, 5,034 pass, 10 skip, 0 fail. Serialized allocation probes: 14 pass. Entire script exited0. `scripts/run-unit-tests.mjs` ignores passed concurrency arguments; don't assume `--test-concurrency=2` reaches Node.
- Baseline Vite build exited0; log `output/reality-baseline-build.log`.
- Created only one new QA script: `scripts/qa-reality-baseline.mjs`; baseline native screenshot `output/reality-baseline.png`, inspected. Viewer initialized. Screenshot has first-run welcome and a poorly loaded earth surface; map/terrain availability needs attention, not proof of visual quality.
- Baseline tracking launched, then interrupted with Ctrl-C to honor the pause (session38852 exited1). Partial output is in `output/reality-baseline-tracking.log`; rerun on resume. Earlier work had external terrain502 failures; do not assume this run's result.
- Researched primary/authoritative Tonga evidence, cable dataset and license below.

## CURRENT

Paused before implementation. Proposed integration: lazy native mode at `/?situation=tonga` using application components, NOT another standalone HTML/viewer. Main currently calls `application.start().catch(...)`. Start resolves `{scene,controls,data,tools}`. Decide whether lifecycle registration belongs in app tools or native entry; ensure cleanup. Avoid default delayed Austin flight stealing the mission camera (`src/app/controls.js`, `src/camera.js`).

Native primitives inspected:

- `src/app/application.js`: phased factories, signal/defer cleanup, start/getComponents/subscribe/destroy.
- `src/app/tools.js`: builds native SceneDirector, annotation engine, voice commands. `window.__godsEyeView` exposes viewer, styleManager, dataManager, sceneDirector, mapStackController, annotations, render helpers and voiceCommands.
- `src/ui/navigationController.js`: `_runExplicitNavigation(noun,navigate,releaseOptions)` stamps generation, releases tracking/orbit and camera, refuses cockpit. `subscribeCameraHandoff` is exposed through StyleManager shell facade. Use ownership subscription to cancel mission playback when superseded. Verified styleManager._runExplicitNavigation is callable in baseline browser.
- `src/scenes/cameraMotion.js`: `createCameraMotion({applyPose,now,requestFrame,cancelFrame})`, play(move,token), cancel/destroy. Promise true on completed, false on interruption. Native `src/director/camera.js` samples authored `{from,to,easing,durationSec}` poses with short longitude arcs. Useful for real cable traversal across the dateline. Street flyRoute assumes20/40/90m/s and260m AGL, unsuitable without adaptation for Tonga–Fiji cable.
- `src/scenes/director.js`: saved user scenes, own transient camera travel/playback. Reuse primitives, don't overwrite user's saved scenes.
- `src/annotations/index.js`: native hybrid world whiteboard engine. Engine annotate(), list(), count(), clear(), destroy(); clear is global, so avoid clearing unrelated user marks. Inspect selective removal/TTL if using native engine. Own mission CustomDataSource is reasonable for temporally filtered cable/observation geometry.
- `src/voice/gevActions.js`: createGevActionRunner returns async `(name,rawArgs,runOptions)` with signal/isCurrent semantics. Add narrow situation action routing via explicit dependency/registry, not duplicate voice/text business logic.
- `src/voice/gevRealtime.js` creates runner; `src/voice/actionSchemas.js` owns canonical tool schemas and createActionTools. `src/voice/sessionCommands.js` binds supplied runner and UI/session. Need inspect descriptions and tests before adding tool.
- Native HTML uses `src/ui/templates/*` through allowlisted build template system. Root body includes cesiumContainer, world-overlay-root/actions, title-bar, top-center-actions, command-dock, left-panel-stack, right-context-rail, scene-runtime, first-run-launcher, intel-hud, etc. Preserve native exit behavior and credits, hide clutter only while mission active.
- Security/import boundary checks in scripts/check-import-directions.mjs and check-package-boundaries.mjs. No new backend/network proxy needed for static mission.

## Verified source leads and constraints

Retrieved 24 September2026. Preserve publication time separately from event time. Use short original paraphrases; no unlicensed imagery copying. Measurement summaries are acceptable, don't fabricate raw samples or interpolated chart points.

1. Cloudflare: https://blog.cloudflare.com/tonga-internet-outage/
   - Degradation around03:00UTC January15; near-zero traffic by05:30UTC; BGP update spike05:35UTC. Cloudflare vantage, not total national census. Check publication date before registry entry (likely Jan19).
   - CRITICAL chronology:03:00 degradation precedes the main04:14 explosion timestamp. Preserve this ambiguity; do not force a clean causal sequence or claim main explosion explains the first degradation.
2. Cloudflare: https://blog.cloudflare.com/internet-is-back-in-tonga-after-38-days-of-outage/
   - Published February22,2022. Traffic increased to pre-eruption-like levels a little after midnightUTC February22. Approximate timestamp; don't manufacture exact00:00.
   - Digicel announcement02:13UTC reported restored data on Tongatapu/Eua after cable repair. Published account reports Reliance replacing92km of827km cable; no vessel track is available, omit one.
3. ITU: https://www.itu.int/hub/2022/02/restoring-connectivity-tonga-internet/
   - Published February10,2022. Reproduced diagram reports international fault about37km from Nuku'alofa, domestic about47km. No defensible exact bearing/location. Show reported distance locus/uncertainty, not precise pin. Visual band width must be explicitly illustrative, never measured confidence interval. Diagram image itself is third-party; do not copy indiscriminately.
   - ITU/Intelsat/SparkNZ/Wantok emergency assistance, meteorological-service Ku-band terminal at Fua'amotu Airport realigned to Horizon3E. Evidence supported by publication date, don't invent activation timestamp/precise satellite orbit geometry. Satellite phones also reported.
4. NASA/JPL AIRS: https://airs.jpl.nasa.gov/news/184/airs-observations-of-the-tonga-undersea-volcano-eruptions-in-january-2022/
   - Published February28,2022. Main eruption04:14UTC Jan15 (17:14local). AIRS atmospheric measurements10:59–16:11UTC Jan15, about6–12hours later. Distinguish event timestamp from sensor acquisition. Earlier eruption15:20UTC Jan13 (04:20Jan14local). No fake satellite imagery; reconstructed event marker acceptable.
5. Smithsonian GVP: https://volcano.si.edu/volcano.cfm?vn=243040
   - Geographic catalog/current reference. Coordinates NOT yet verified (search20.536 failed); don't silently use remembered coordinates.
   - Alternative primary paper https://www.nature.com/articles/s43247-022-00616-1 cites USGS main event04:14:45UTC,20.546S175.390W; must inspect if using exact numbers.
6. Cloudflare Q1 summary: https://blog.cloudflare.com/q1-2022-internet-disruption-summary/
   - Search returned January20 limited connectivity/satellite lead; need read relevant Tonga section fully before encoding. Same publisher, not independent corroboration.

Bundled cable geometry:

- `src/data/local_data/telegeography_submarine_cables/{cable-geo.json,landing-point-geo.json,source.json,README.md}`. Source snapshot2026-05-24. CC BY-NC-SA3.0, NOT upstream MIT. Attribution © TeleGeography — submarinecablemap.com; portfolio noncommercial use, derived subset retains license/notice. Replaceable adapter needed for commercial use.
- Relevant features `tonga-cable`, `tonga-domestic-cable-extension-tdce`. Extract subset, don't load whole globe of cables. CURRENT REFERENCE, not2022 surveyed route.
- Tonga Cable line parts: [-179.99979825051412,-19.305384072361306] → [-175.9498011195701,-20.995131543025785] → [-175.20000165073512,-21.133465659292966]; other part [179.9999603175593,-19.305384072361306] → [179.09996095512733,-18.66711083815884] → [178.43744782917764,-18.123810943537187]. Reorder for Tonga→Fiji, bridge dateline safely. Route is schematic reference geometry, not exact seabed survey.
- Domestic parts read from actual GeoJSON; re-extract on resume, no need entire dataset output. Need landing-point feature metadata.

## NEXT after explicit resume

1. Inspect baseline tracking log and finish remaining targeted native API/source reads. Preserve previous cyber work, update scope docs without deleting it.
2. Implement canonical Situation schema/validation (entities/events/observations/claims/relationships/evidence/sources/scenes/timeline), generic runtime and verified Tonga static mission.
3. Native mode, world rendering, minimal HUD, evidence/time filters, real cable follow, interruptible90sec walkthrough, before/after, spatial uncertainty and contextual provenance.
4. Shared deterministic actions for GO/REVEAL/FOLLOW/TRACE/REPLAY/COMPARE/INTERROGATE/FILTER/ANNOTATE; text commands; optional voice integration through existing runner.
5. Focused tests: validation, references, invalid geometry, time/lens filtering, relationship visibility, unsupported inference, current-reference labels, load and action cancellation/success/failure.
6. Screenshots and actual inspection of start, approach, follow, outage, observed-only, full reconstruction, fault uncertainty, recovery, source interaction. Fix framing/clutter and imagery fallback. Run native regression/build/format/boundary checks, finish docs and demo. Do not call feature done before contract criteria pass.

## BLOCKERS / decisions

No genuine escalation blocker. User requested pause. Need address native imagery loading honestly and chronology ambiguity. No AI key or paid account is needed. No subagents started. Do not spawn unless user or applicable instructions explicitly asks. Use apply_patch for local edits. Browser QA uses installed Puppeteer and escalated Chrome execution; baseline browser closed normally. Dev server remains at127.0.0.1:4173. The user's open `/cyber.html?case=colonial` tab is old product, not Reality Debugger.
