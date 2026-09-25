# Live evidence investigation

The new entrance is **Investigate an Internet anomaly**. It selects a currently returned IODA detection, moves the native camera to its country, reveals bounded reference context, and checks two actual measurement methods. No scenario selection or AI credentials are required.

The assessment distinguishes corroboration, disagreement, non-reproduction and insufficient evidence. It explains the next useful check rather than treating a detection as a confirmed incident. Measurement plots retain missing samples. Sources and a Markdown finding carry the method, query window and uncertainty. Rechecking revises an existing conclusion only if new evidence changes that conclusion.

## Original engineering contribution

- A cancellable investigation runtime integrates native selection, camera, layers and annotations without a second viewer or navigation system.
- A bounded measurement adapter compares BGP visibility and active probing, preserving source failures, gaps and freshness. Twenty-second deadlines include response-body parsing.
- Deterministic assessment rules prevent stale evidence, duplicate methods and geographic proximity from becoming unsupported confirmation or causation.
- Evidence filtering and clearing operate owned world marks while preserving user-owned layers and annotations.
- An inspectable, downloadable result includes what is established, what remains unknown and what to check next.

The viewer, map presentation, voice foundation, navigation and native layer infrastructure are God's Eye View by Bilawal Sidhu and contributors. This extension must not be presented as the original creation of those foundations.

## Scope and limits

This is a working Internet-measurement triage workflow. Both methods are from IODA, not independent providers. The comparison is the last two-hour median against the preceding 22-hour median, using an explicitly local five-percent screening rule. It may miss brief or earlier events. It does not diagnose root cause, affected networks or nationwide impact. Current mapped cables and facilities are reference context, not fault observations.

The core is deterministic. Optional upstream AI controls are not needed for these checks. Synthetic counterexample tests establish rule behavior; they do not establish real-world accuracy or frontier-model superiority. A truthful portfolio demo shows actual source outcomes, including non-reproduction or missing evidence, rather than forcing a dramatic revision.

## Verification

- 47 focused assessment, adapter, relationship and lifecycle tests passed.
- 87 voice action and schema regression tests passed.
- Production build and import/package boundaries passed.
- Live production browser acceptance: 10/10 checks, zero page errors. Root and UX agent reviewed loaded-map desktop/mobile screenshots. Real Cape Verde signals returned a non-reproduced assessment. See `INVESTIGATION-ACCEPTANCE.json`; screenshots and the downloaded finding are in `artifacts/investigation` (generated locally).
- Formatting scan passed across 1,109 source files.
- Previous native navigation tracking passed 109/109 on the preceding delivery. This change reuses that navigation implementation; that broad tracking suite is not represented as a fresh run here.

Run the browser acceptance against a built static preview with `node scripts/qa-investigation.mjs`. It uses current public responses, so the selected country and finding vary. It checks entrance, camera movement, measured checks, export, source inspection, filtering, mobile fit and clearing. Inspect its screenshots as well as the JSON results.

The local preview is available at port 4180. Public Vercel hosting has not been performed by this delivery.
