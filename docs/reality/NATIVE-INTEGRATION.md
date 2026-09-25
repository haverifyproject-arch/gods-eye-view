# Native Internet Health integration

Inspected 25 September 2026 against the corrective brief in attachment `09fc8a25-cc66-4275-a3f6-5dda696d18ea`. This replaces the mission/walkthrough integration direction. No application code was changed for this inspection.

## Existing ownership to preserve

God's Eye View already owns the viewer, layer registry, visibility lifecycle, selection, camera authority, annotation engine and voice dispatcher. Internet Health should enter those owners as one more layer. The temporary investigation controller should hold relationship IDs, evidence filters and annotation ownership only; it must not become another selected-entity store, layer manager, camera controller or application shell.

## Registration and data lifecycle

The construction path is:

`src/standalone/layerSources.js` → `src/standalone/catalog.js` → `src/app/constructCatalog.js` → `src/app/catalog.js` → `src/app/data.js`.

`createApplicationCatalog` validates source methods in `SOURCE_METHODS` before creating layer instances. `createLayerCatalog` requires an exact one-to-one match between layers and serialization metadata. `createApplicationData` registers every instance with `LayerLifecycle`, calls optional `attachDataManager`/`attachMapStackController`, and then calls `finalizeRegistrations(catalog.metadata)`. Restoration starts only after this seal. Do not dynamically inject a production layer through the QA registration hook.

The new minimum integration consists of:

- Provider-independent normalization and validation in `src/layers/internetHealth/records.js`; acquisition in `source.js`; one display/lifecycle owner in `index.js`.
- An application adapter like `src/app/layers/earthquakes.js`, injecting native overlay/context/input services.
- A source factory choice in `src/standalone/layerSources.js` and an `internetHealth: ['getSnapshot']` entry in the catalog source contract.
- Construction in `src/app/constructCatalog.js` with stable layer ID `internet-health`.
- A unique unused serialization token in `src/data/layerState.js`, initially `enabled-only`. Do not reuse an existing token or change old meanings.
- A placement in the native grouping table in `src/ui/layerPanel.js`; its toggles are generated from registered layers. No separate Reality layer panel is needed.

`src/data/lifecycle.js` is the real manager; `src/data/manager.js` is a compatibility facade. The lifecycle owns initialization, scheduled updates, visibility intent epochs, cancellation, refresh state and teardown. Use `dataManager.setEnabled(id, enabled, { origin })`, `isEnabled`, `getAll`, `layers.get(id).module` and, only when options exist, `setLayerParams`. Never mutate a registry row's `enabled` flag directly. Do not add a second polling timer around an already scheduled layer.

### Earthquake pattern: reuse with one important addition

`src/layers/earthquakes/source.js` implements abort-aware `getSnapshot({ signal })` and rejects invalid payloads before publishing. `records.js` normalizes provider data. `index.js` implements `init`, `enable`, `disable`, `update`, `destroy`, `getStats` and `getAnalystRecords`.

Its update replaces display state only after a successful complete snapshot and verifies the request still owns the result. Its `CustomDataSource` and native overlay source are shown/hidden together; disable aborts acquisition and removes overlays; destroy frees both. Static features do not take a continuous-render hold. `getStats` supplies count/update/error to the ordinary layer row. `getAnalystRecords` returns bounded JSON-safe records only when enabled.

**Earthquakes is not a complete selection template:** it currently has no shared context-store registration. Copy its source/lifecycle architecture, then add the existing local infrastructure selection pattern below. Also do not copy magnitude-scaled point circles for broad outage geography: country observations require sourced country polygons or explicitly broad regions, not an invented epicenter.

## Selection, tracked subjects and scene context

`src/data/contextStore.js` provides the shared entity registry and selected slot:

- `registerEntityContext(entity, metadata)` associates the real Cesium carrier with a stable ID through `__gevContextId`.
- `selectEntityContext(entity)` publishes `gev:entity-selected`.
- `getSelectedEntityContext({ dataManager })` rejects hidden/disabled/inactive records.
- `removeEntityContextsForLayer(layerId, { retainIds })` drops evicted records while preserving surviving identity.
- `clearSelectedEntityContextForLayer(layerId)` clears only that layer's selection.

`src/app/localGeojsonServices.js` is the existing application injection bundle for these operations and native overlays. `src/data/localGeojsonCore.js` shows concrete registration metadata (`id`, `layerId`, `layerName`, `source`, `dataSource`, `label`, geometry-derived position/properties), assigns `viewer.selectedEntity` when clicked, then calls `selectEntityContext`. Reuse the shared operations, not the entire infrastructure module's automatic click-to-fly behavior: selecting an outage need not move the camera.

All pointer handlers must yield when `isPointerFree()` from `src/data/inputOwnership.js` is false. Native drawing and other tools own pointer input independently. On layer disable/destroy, remove its context records so old outages cannot remain queryable as current selections. On refresh, retain selected surviving IDs and never resurrect an older subject after the user selected another object.

Aircraft/vessels already publish tracked subjects into this same store. An outage is a stationary selectable observation; it should not impersonate a trackable moving object. Debug This reads the existing selected record, so switching from outage to ship/fire immediately changes the subject without an investigation-mode switch.

Country-level geography may include an administrative display anchor, but metadata must explicitly distinguish that anchor from measured location. Retain polygon/bounds and geographic scope in the normalized record; distance-to-country-centroid is not a valid cable fault correlation.

## Existing agent query and action seams

`src/voice/gevActions.js` contains `createGevActionRunner` and the existing `set_layer_visibility`, `get_current_view_state`, `get_entity_context` and `analyst_query` handlers.

`get_current_view_state` already exposes camera, active controls/context, tracked subjects, layers and feed provenance from manager stats. `get_entity_context` prioritizes the shared selected record, then visible registered contexts; its internal `getSceneContext` gathers scene/location context. Registering Internet Health properly makes it available through the existing selected-object path.

The analyst engine is `src/data/analystEngine.js`. Its `ANALYST_LAYERS` explicitly allowlists filter fields per layer. The runner's `analystProviders().getRecords` already calls an enabled layer's `getAnalystRecords`. Add the Internet Health record schema to that allowlist and the tool enum; do not build a parallel current-scene query engine. Add layer aliases in `gevActions.js`, layer enums in `src/voice/actionSchemas.js`, and matching wording in `server/providers/openai/toolDescriptions.js`/`instructions.js`. Preserve existing tool definitions and update only deliberate additive test inventories.

Implement Debug This as an injected service called by a narrow native action, with all text, voice and compact selected-object controls calling the same action handler. It should read selected context and current enabled-layer records on each invocation, carry the action's abort signal/generation, and return explicit completed/cancelled/unavailable results. It must not default to Tonga or a saved scene. Missing network data means unknown/unavailable, not a generated explanation.

## Native annotations, filtering and camera operations

`src/app/tools.js` creates the one annotation engine via `src/annotations/index.js` and exposes it to the action runner. `src/annotations/annotationEngine.js` already supports annotation specs including arrows/routes/areas and world labels. Reuse it for derived or reported relationships and temporary explanations. The public API currently has `annotate`, `clear`, `fadeOutAll`, `list`, `count`, `destroy`; **there is no selective public remove API**. Minimal safe extension: add an ownership/group field plus selective removal/filtering to this native engine, with tests. An investigation clear must never call global `clear()` and erase unrelated user whiteboard marks. UNKNOWN should have no speculative relationship line.

`src/ui/navigationController.js` and the StyleManager facade provide `_runExplicitNavigation(noun, navigate)` and `subscribeCameraHandoff`. These release tracking/orbit and serialize camera intent; use them instead of direct competing flights. Only explicit user navigation/follow should claim the camera. Debug context acquisition itself should not move it.

`src/cameraVerbs.js` supplies `flyRoute`, `createRouteFlight`, cancellation and shared motion ownership. The existing `flyRoute(annotations, args, floorFn, runNavigation, warmFn)` expects native route annotations and uses road-scale flight defaults. For ocean cables, expose a cable-appropriate altitude/speed profile through this existing primitive or adapt the existing `src/scenes/cameraMotion.js` sampler under the same authority. Do not copy a separate follow loop into Internet Health. Route geometry must come from the existing cable layer, including dateline part ordering, rather than straight lines between labels.

## Existing cable and facility capabilities: facts and gaps

The native cable ID is `telegeography-submarine-cables`. The factory is `src/app/layers/submarineCables.js`; implementation is under `src/layers/submarineCables/`. `bundledSource.js` loads both bundled full cable and landing-point GeoJSON through a replaceable `fetch(signal)` adapter. Its lifecycle handles cached loading, aborts, visible geometry, source stats and overlay cleanup. The dataset is separately licensed **CC BY-NC-SA 3.0**, not MIT.

At initial inspection, the cable layer lacked public `getAnalystRecords`, geometry/query APIs and context-store publication. `interaction.js` recognized private `__gevTeleGeography` metadata and directly flew to a reference at 6,500 m. The prescribed integration is bounded public reference/route queries and shared selection registration on this owner, with explicit focus routed through native navigation authority. The subsequent native implementation adds these seams to the existing layer. The existing full dataset must not be duplicated into a new Tonga or outage-specific cable bundle.

`src/data/infrastructure.js` constructs the native `local-datacenters` layer through `localGeojsonCore`. These **are OpenStreetMap-derived facilities, not PeeringDB**. The bundled README records 4,351 features and ODbL 1.0, and explicitly says extraction date/query were not preserved. Treat them as datedness-unknown current reference; do not assert ASN presence, peering, IXP membership or service dependency from proximity. There is no existing PeeringDB source/relationship adapter in the inspected code. A later contextual PeeringDB adapter must preserve its own provider IDs, retrieval time, provenance and actual network-facility/network-IX memberships.

## State, production and minimal acceptance

`src/data/layerState.js`, `src/sharelink.js` and `src/ui/shareRestoration.js` own persisted/shared native state. Add the layer to their existing metadata contracts; do not add a parallel URL codec. Temporary hypotheses and annotations should not silently become persisted facts. Keep the source refresh cadence and transient investigation state out of share URLs unless an explicit, validated representation is added.

Server provider wiring lives under `server/providers/` and `server/standalone/vite.config.js`; Vite middleware is not a Vercel backend. Choose the Internet source only after real access/terms/geography checks. If browser CORS does not work, add an allowlisted provider proxy with bounded request parameters and a production function using the same adapter; do not ship development-only live access. A dated refreshable snapshot is acceptable if labeled with acquisition time and stale status, never presented as live.

The minimum native smoke test is: open normal `/`; enable Internet Health through the ordinary layer toggle; select two different outage polygons; inspect each through existing `get_entity_context`; select an existing physical object and verify the subject changes; Debug This reveals only defensible current-reference/derived relationships; evidence filters remove owned geometry; clear leaves native layers/whiteboard usable; disable removes stale outage contexts. Verify aborted refreshes, selection eviction, shared-layer restoration and native camera interruption. No mission loader, autoplay, fixed chapter order or replacement shell participates.

## Implemented native acquisition and action contracts

`createInternetHealthSource().getSnapshot({signal})` queries the public IODA API directly with a rolling 24-hour window, country scope, GTR exclusion and a bounded 100-event response. Only country reference geometry is cached. IODA event payloads remain ephemeral. The normalizer groups detections by country, retains source timestamps and raw score semantics, and records truncation; a cutoff-aligned endpoint never establishes recovery. Natural Earth polygons and administrative label anchors are explicitly CURRENT_REFERENCE, separate from OBSERVED connectivity detections.

The registered, disabled-by-default `internet-health` module offers `getDebugRecords()`, `getAnalystRecords(max)`, `selectById(id)` and native lifecycle/stats methods. Debug records carry country geometry, displayAnchor, events and provenance. Both export methods return independent snapshots. Click selection uses the existing context store and Cesium selected entity without camera movement; refresh replaces carriers without stealing selection and disable removes owned context. Country footprint emphasis responds to native selection changes. The existing earthquake layer now publishes selectable native context by the same mechanism, with `reported-epicenter` spatial scope.

`debug_world` replaces the mission-specific globally offered action. It delegates to injected `debugWorld.run(args, runOptions)` and accepts `debug`, `context`, `infrastructure`, `observed`, `reported`, `all`, `hide_reference`, `clear_inference`, `clear`, `follow`, `another` and `sources`, plus an optional `id`. Internet Health is also available through native layer actions, `get_entity_context` and `analyst_query`; analyst coverage explicitly describes bounded country detections and administrative anchors. Earthquake selection is now exposed through `get_entity_context`.
