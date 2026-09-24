# Cyber Situation Room

Read `docs/cyber/CHARTER.md`, `docs/cyber/ARCHITECTURE.md`, and `docs/cyber/SOURCES.md` before changing this product. Preserve upstream compatibility and attribution. Baseline: `ce671ce500a393be27e3cbb2a08799fbca9b6e28` (Bilawal Sidhu / God's Eye View, MIT).

Build only the December 2023 Kyivstar scenario until its evidence and interaction quality are excellent. No live integrations, AI agent, authentication, enterprise telemetry, billing, or other scenarios in this milestone.

Important assertions must carry OBSERVED, REPORTED, DERIVED, INFERRED, DISPUTED, or UNKNOWN status and evidence references. Never turn inference into fact. Never assign arbitrary geography to a CVE, technique, actor, ASN, or organization. Current infrastructure is CURRENT REFERENCE, never EVENT-TIME OBSERVATION. Country context is not measured outage extent.

Keep provider payloads behind adapters; validate normalized records before rendering. Keep secrets server-side. Preserve source dates, retrieval dates, temporal scope, limitations, and rights. Unverified rights mean no commercial clearance.

The upstream experience stays at `/`; Cyber Situation Room lives at `/cyber.html`. Original product code belongs in `src/cyber/`. Follow upstream ES modules, two spaces, single quotes, semicolons. Run focused data/UI tests, production build, formatting and boundary checks. Record pre-existing baseline failures honestly. Use Node >=24.14 <25 or >=26 <27. This checkout has an ignored portable Node runtime under `.local-runtime/`.
