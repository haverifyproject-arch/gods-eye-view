# Situation model and runtime foundation

`src/situations/model.js` is portable and has no Cesium, DOM, provider or AI dependency. Schema version1 collects sources, evidence, entities, events, observations, claims and relationships. Record IDs are unique across record groups. The source registry preserves publisher, HTTPS URL, publication date (or explicit null), retrieval time and rights. Evidence holds original summaries and precise source locators.

Every world record carries categorical evidence status, supporting evidence IDs and a display-valid UTC interval. Intervals are half-open. Observation acquisition time is separate from display-valid time and source publication. Published measurement summaries can carry qualitative values; the model never generates numerical samples. Exact timestamp bounds are storage boundaries, not a license to imply exact acquisition. Mission data must also explain the source's original temporal precision.

Geometry explicitly separates historical basis, precision and supporting evidence. Current-reference geometry requires CURRENT_REFERENCE status. A DistanceLocus describes an approximate reported distance without a known bearing; it cannot be labeled exact. It must not be confused with a measured failure area. No inferred/reconstructed/derived record is valid without a method and acyclic supported premises.

Visibility is selected by time, lens and explicit hiding. Relationships appear only when both endpoints survive selection. Unknown records require an unanswered question, rather than invented facts.

`runtime.js` isolates the validated mission from caller mutation, publishes immutable snapshots and resolves contextual evidence. It has no renderer. Its action dispatcher is shared by future text, voice and button adapters. Presentation actions are injected and require explicit completion; superseded or aborted actions cannot report success. Cesium adapters must honor AbortSignal promptly and clean up their own animation frames/listeners. This is a foundation; mission-specific loading, cinematic staging, UI and voice wiring remain to be implemented.
