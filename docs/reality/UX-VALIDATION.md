# Reality Debugger UX acceptance

This is the acceptance protocol, not a claim that validation has passed. A passing build or browser assertion does not constitute visual acceptance. Record actual runs and inspect the captured images before marking the mission complete.

## Nine required views

| Capture | World must explain | Reject if |
| --- | --- | --- |
| 01 Start | Pacific context, Tonga's isolation, a clear invitation to begin | Blank globe, default Austin camera, native first-run prompt obscuring mission |
| 02 Approach | Tonga and the volcanic site at a readable regional scale | Merely a changed title; place labels overlap or location is arbitrary |
| 03 Cable follow | Schematic Tonga–Fiji reference cable and traversal along its actual supplied geometry, crossing the dateline by the short route | Straight invented route, global camera spin, invisible cable, historical geometry claim |
| 04 Outage | Published near-zero traffic observation at the Tonga regional anchor; source vantage and approximate timing are explicit | Whole-country outage heatmap, invented raw graph, exact national percentage |
| 05 Observed only | Only observed records remain; unobserved cable/fault/reconstructed layers disappear | Same world as all-evidence view, or measured status inferred from visual styling alone |
| 06 Full reconstruction | Reference geography and reported/reconstructed context return with distinguishable labels and styles | Unsupported causal arrows or undifferentiated certainty |
| 07 Fault uncertainty | An approximately 37 km distance locus around the stated reference location, with unknown bearing | Exact break pin, statistically implied confidence band, known fault on cable intersection |
| 08 Recovery | Changed temporal world, published recovery observation and separately attributed repair report | Merely green recoloring of the same outage; all islands declared restored |
| 09 Source interaction | Temporary, dismissible source-specific evidence at the selected object | Permanent evidence sidebar, undated source, missing geographic caveat or broken source association |

All nine views must be captured at 1440 × 900 or a documented equivalent and inspected at their rendered size. Repeat the approach and source interaction at 390 × 844. The mission must have no horizontal page overflow; important actions and provenance must remain accessible. Text should remain readable without browser zoom. Respect reduced motion and retain keyboard focus visibility.

## Interaction checks

1. Start through the actual visible UI. Follow the cable. Confirm both camera position and world selection change, rather than only DOM text.
2. Click a world object and request “how do we know?” Inspect its publisher, publication date, event/observation time, retrieval date, geographic precision, source link, limitations and rights. Close the temporary popup and return to the unobstructed scene.
3. Move the time scrubber across outage, fallback and recovery. Compare rendered entity IDs/counts and inspect the world; text changes alone fail.
4. Apply OBSERVED through the visible lens control or text command. Check all visible Situation records are OBSERVED and unsupported relationship/context geometry disappears. Restore all evidence and confirm those geometries return.
5. Run the deterministic command surface without an AI key: GO, REVEAL/FILTER, FOLLOW, TRACE, REPLAY, COMPARE, INTERROGATE and ANNOTATE. Invalid destinations must report failure, never success. Commands and buttons must invoke the same action dispatcher.
6. Start a camera action, then press Stop. Verify the promise reports cancellation, camera stops, and the next command works. Repeat interruption using a pointer gesture on the canvas and an explicit native camera handoff. No old action may resume or report completed afterward.
7. Run the authored walkthrough at normal motion settings. It must finish in 60–120 seconds with visible, purposeful transitions and reading time. Separately check reduced motion skips long animation while preserving the same explanatory sequence.
8. Exit mission mode. Native chrome and interaction must return, the original Cesium viewer must remain, mission data sources/listeners/popups must be removed, and native annotations must remain intact. Re-enter and check for duplicate handlers/geometry.

## Evidence safeguards

- Cloudflare degradation around 03:00 UTC precedes the main 04:14 UTC eruption timestamp. The interface must preserve that chronology and explicitly avoid claiming a resolved initiating cause.
- Cable geometry is a 2026 reference snapshot with separate TeleGeography CC BY-NC-SA attribution. It cannot be presented as surveyed event-time seabed geometry.
- Published traffic summaries are direct observations from one provider vantage. Qualitative summaries must not become synthetic chart samples.
- No precise vessel tracks, satellite orbit paths, impact polygons or break locations without evidence supporting those geometries.
- A source publication date is not its event date. Emergency support must not appear as active before the available evidence supports it.

## Visual judgment gate

The world must carry the explanation. No persistent card column, panel grid or dashboard may dominate it. The user should understand the broad chain by following space, time and evidence without reading a long article. If replacing the interactive world with one static screenshot preserves most of the value, the experience fails.

Review globe detail/fallback quality, label overlap, cable contrast at every scale, source popup footprint, uncertainty legibility, dead space, animation pacing and mobile reachability. Native upstream credit and mission data attribution must be available. Capture successful provider imagery and the documented fallback where feasible; record provider failures separately from application failures.

## Validation record

Store screenshots and machine checks under `output/reality-qa/` (or `QA_OUTPUT_DIR`). The automation report records behavior and capture locations. Visual acceptance remains **pending** until a reviewer opens every required image and records concrete findings and fixes in the build journal. Do not infer acceptance from the existence of screenshot files.

## Initial local visual inspection — 24 September 2026

The strengthened `scripts/qa-reality.mjs` writes to `artifacts/reality/` by default. `QA_START_ONLY=1` captures only the opening to bound local GPU work. It uses ordinary browser security, reduced motion for deterministic screenshots and one sequential browser; the full pass additionally tests real pointer interruption with normal motion.

Inspected `artifacts/reality/01-start.png`: native single-viewer assertion and Pacific camera assertion passed. Visual acceptance failed: no geographic texture was visible (blue globe); Tonga location labels overlapped; native style/bolt controls leaked into mission mode; the bottom control slab occupied excessive space. The console recorded blocked network resources and no unhandled page exceptions. This sandboxed run cannot establish external map-provider health. Fix or provide a defensible geographic fallback, then recapture with appropriately authorized network access. Remaining eight required views were deliberately not captured against this defective opening.

## Full browser pass and visual inspection

After geographic fallback and initial UI fixes, all automated assertions passed, including all nine desktop captures, two mobile captures, text-command evidence/recovery changes, actual camera travel, invalid destination failure, pointer interruption, native camera handoff interruption, subsequent action recovery and removal of both owned data sources on exit. No unhandled page exceptions occurred. The uninterrupted normal-motion walkthrough completed in **92.195 seconds**. `artifacts/reality/report-realtime.json` preserves this run.

Every image was opened and inspected. Pacific context, regional approach, Fiji endpoint, observed-only removal, uncertainty qualifications and recovery distinction are legible. Follow-up fixes remain required before final visual acceptance: regional cable occasionally missing during render, Tongatapu label beneath outage/recovery annotations, source popup incorrectly behind an annotation, mobile annotation clipping and excess mobile control height. Those findings were sent to the implementation owner for correction and recapture. Do not confuse the passing behavioral assertions with acceptance of those visual defects.

## Final inspection after corrections

All nine required desktop views and both mobile views were recaptured and opened. The reported faults, traffic observations and recovery facts now have clear geographic anchors without overlapping the Tonga label. The contextual source popup paints above annotations and remains readable; mobile controls use horizontal rows and out-of-view world annotations are hidden. The Fiji endpoint and final outage screenshots both show the cable. The final outage caption preserves `05:30` minute precision. No remaining blocking defect was identified in these reviewed states.

The harness now waits for a rendered frame, `viewer.dataSourceDisplay.ready` (bounded to 15 seconds), and a final rendered frame before capture. This prevents photographing a transient Cesium geometry rebuild as if it were the completed scene. The application also keeps cable width stable across state changes. External imagery may still load progressively; bundled geographic outlines preserve context when external imagery is unavailable. This is an honest loading limitation, not a claim of photographic offline imagery.

Validation evidence is deliberately retained separately:

- `report-realtime.json`: 24 passing assertions, including the measured 92.195-second walkthrough and both interruption paths.
- `report.json`: final broad recapture; 22 passing assertions and one pointer assertion failure after the test changed reduced-motion preference immediately before starting motion. That test also used a location that could be covered by a world annotation, so it did not reliably establish a canvas gesture during active motion.
- `report-targeted.json`: seven passing checks after fixing the harness to await the actual media-query change and confirm that the pointer hits the canvas. Actual pointer cancellation passed; minute precision also passed.
- `report-outage.json`: three passing checks and the final ready-aware outage capture, opened and visually accepted with the cable visible.

Do not erase the intermediate failed run. Its cause and successful focused retest are part of the audit trail. Native tracking validation is owned by the architecture agent and is recorded separately.

## Annotation and relationship acceptance

The source popup offers **Pin to world** only for a currently visible record with source evidence and declared geographic context. Pins use the record's point, distance-locus center, or explicit `anchorId`; unsupported records cannot receive invented coordinates. Pinning moves the camera to that context, stages a selectable source-backed annotation, and preserves its geographic limitation. Removing the annotation or resetting the mission clears it; evidence/time filtering hides unsupported content and exiting cleans up its DOM and render listener.

Relationship connectors come from visible normalized relationship records, not a hard-coded arrow. They are individually selectable and expose status and `ASSOCIATED_WITH` semantics. A relationship with no declared geographic anchor disables pinning with an explanation. The final production harness tests these controls, real trace traversal and before/after comparison in addition to the original views.

## Production acceptance — complete

The final Vite production build was served by a plain static file server at `http://127.0.0.1:4180`, with no Vite development proxy middleware. **All 35 browser assertions passed.** All 13 resulting images were opened and inspected: nine contract states, two mobile layouts, actual relationship trace and a source-backed pinned annotation. The reviewed screenshots and report are preserved in [validation/production](validation/production/report.json), with URL, server mode, Git revision and working-tree provenance. Camera movement, filtering, comparison, source inspection, annotation removal/reset, cancellation and exit cleanup worked against the production assets.

The screenshot review found no remaining blocking visual issue in these states. Labels, cables, contextual provenance and pinned geographic caveats are readable; mobile content remains within the viewport. External geographic imagery loads progressively and can show temporary tile seams, while bundled outlines maintain geographic context. The console recorded 404 and 405 resource responses during the static run, which remain in the report; this is **not** a claim of a clean browser console. There were no unhandled page exceptions, and the core static mission completed independently of optional backend services. Exact failed resource URLs were not captured by this run, so those responses are not assigned conclusively to a particular provider.
