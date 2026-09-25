# Reality Debugger architecture review

Reviewed 24 September 2026 against the current source, master contract and handoff. This is an implementation review, not a completion claim.

## Native composition

Keep `/` as the upstream entry and select the mission with `?situation=tonga`. `src/main.js` creates one `createStandaloneApplication`; its `start()` resolves `{ scene, controls, data, tools }`. Reuse `scene.viewer`, `controls.styleManager`, `data.dataManager`, `tools.sceneDirector` and `tools.annotations`. Do not create a second viewer or copy the old Cyber application.

The strongest lifecycle seam is the `createTools` factory in `src/standalone/application.js`: create the native tools, then optionally import and mount the situation presentation, registering its destroy function with the existing `defer` while the factory is still executing. `src/app/application.js` rejects cleanup registration after a factory returns and destroys tools before controls/data/scene. A main-entry mount is possible but must explicitly join application teardown; a pagehide listener alone misses programmatic destroy and startup failure.

Inject a `skipInitialFlight` option through standalone composition into `src/app/controls.js`. Its unconditional no-share-state `flyToAustin(viewer)` schedules a flight after 500 ms. Cancelling only the current Cesium flight does not cancel that pending timer. Mission startup must suppress it at source, without altering normal upstream startup. Preserve shared-view behavior deliberately when both a share state and mission parameter exist.

## Camera and playback ownership

Use `styleManager._runExplicitNavigation(noun, navigate)` for each new user-owned navigation. It refuses cockpit mode before mutation, advances navigation generation, releases tracking/orbit and cancels existing camera motion. Subscribe through `styleManager.subscribeCameraHandoff` to cancel a mission when another owner takes control. A mission's own synchronous claim also emits a handoff, so guard the claim or install its active cancellation token afterward; otherwise it cancels itself.

Call `sceneDirector.stopScene('Reality Debugger')` when entering the mode to stop existing authored playback without replacing saved projects. Use `createCameraMotion` from `src/scenes/cameraMotion.js` for mission moves: `play({ from, to, easing, durationSec }, { signal })` resolves true only on completion and false on interruption. `src/director/camera.js` already interpolates the short longitude arc. Traverse successive ordered cable vertices, dividing duration by segment length; do not fly directly from landing to landing. Reorder the two international cable parts around the dateline before traversal.

Handle pointerdown/wheel on the globe, Escape, time scrubbing, new commands and mode exit as cancellation. Do not cancel on every HUD pointerdown: it would cancel the very action that button starts. Release all render-governor holds and listeners on completion, interruption and teardown. Reduced motion should jump to meaningful endpoints rather than performing prolonged flight. Avoid native street `flyRoute` defaults (260 m altitude and road-scale speeds) for this ocean-scale route.

## Runtime, geometry and presentation

`src/situations/model.js` and `runtime.js` are already portable and validate before rendering. Keep Cesium, DOM and mission constants out of them. Use a mission-owned CustomDataSource for time/lens-controlled geometry, with one generic record-to-world adapter. Request a render after visibility and material changes. Do not destroy shared imagery or globally clear user annotations.

The native annotation engine supports `annotate`, `clear`, `fadeOutAll`, `list`, `count` and `destroy`; its public API currently has no selective removal. Therefore use native annotations for explicit user annotation actions with bounded lifetime, and owned Cesium geometry for continuously filtered mission objects. Never call global `annotations.clear()` just to change the evidence lens.

Time and lens changes must derive the entire visible set, including relationships and their endpoints. OBSERVED must also suppress current-reference cable geometry. Geographic anchoring of a traffic summary is an illustrative display anchor, not a measured outage footprint. A reported 37 km distance locus must show unknown bearing and approximate distance; its drawn line width is not a confidence interval. Date-only reports and source publication times must remain distinct from event times.

## Shared actions and optional voice

`createSituationActions(runtime, presentation)` already supplies shared deterministic actions, cancellation and explicit failure outcomes. Buttons and text parsing should call this dispatcher; text parsing only maps intent to arguments. Presentation adapters must honor `signal` and `isCurrent()` before every later mutation, not just at their initial invocation. Aborting the dispatcher's Promise race alone cannot stop a careless adapter.

For optional voice, inject a situation action provider into `createGevActionRunner` in `src/voice/gevActions.js`, passed through native tools to `initGevVoiceCommands`. Add a narrow canonical tool in `src/voice/actionSchemas.js` plus matching description metadata, delegating to the same dispatcher and passing `runOptions.signal`. Check `runOptions.isCurrent()` before mutations and report actual completed/cancelled results. Do not claim voice support solely because an exported helper exists: the offered tool schema and runner both need wiring. Without an active mission return a structured unavailable result.

## Vercel and production

Current Vite config delegates to `server/standalone/vite.config.js`; its provider plugins are development/preview middleware, not deployable Vercel functions. Production emits the main and archived Cyber entries. No `vercel.json` currently exists. A static Tonga mode can ship from `dist` with bundled mission assets and keyless imagery; verify the built output over a plain static server, not Vite middleware.

Do not route missing `/api/*` requests to `index.html` and treat HTTP 200 HTML as provider success. Optional voice/provider APIs need explicit server functions or a documented disabled state; no core mission step may require them. Never embed server credentials into browser `define` values. Current Google/Cesium values are browser-facing settings and must not be reused for secret provider keys. Preserve upstream attribution and TeleGeography's separate CC BY-NC-SA terms in both product and source docs.

## Required validation before acceptance

- Native `/` behavior and startup remain intact; mission startup never snaps back to Austin.
- Mode entry/exit and application destroy leave no data source, listener, timer, render hold or invisible camera owner behind.
- Manual gesture, competing native navigation, scrub, Escape and aborted voice command stop replay/follow promptly and return cancellation rather than success.
- Follow crosses the dateline by the short arc along ordered cable geometry.
- Sources resolve from selected records; unrelated filtered objects cannot remain as clickable ghosts.
- Test all nine prescribed visual states on the production build, inspect screenshots, and verify an actual 60–120 second walkthrough. DOM assertions alone are insufficient.
