# Current experience · 24 September 2026

This document supersedes UI descriptions of earlier iterations in MILESTONE.md.

Colonial Pipeline is the default case. The upstream Cesium viewer is again the primary investigation surface. Geography and Dependencies are explicit modes. Selecting Houston or Linden flies to a Census city reference point and filters the evidence. A dashed geodesic connects the endpoint cities schematically; it is not pipeline alignment. Its color reflects the selected reported system milestone, not measured flow or a city-specific outage.

Comparison supports any two of the four documented milestones and contrasts operations, federal response and attribution. Either side can be selected on the shared scene. The five-stop guided reconstruction moves through endpoint context and milestones using manual Next/Back controls; users can exit at any step. Camera transitions honor reduced motion. No continuous flow animation is used.

Copy view link records case, milestone, selected subject, evidence claim and mode. This is a local-host URL, not a public deployment or external share service. Evidence selection preserves geographic focus and the dependency scene. On narrow displays evidence opens in a bottom drawer.

New canonical geography comes from 2021 Census Gazetteer rows: Texas GEOID 4835000 (Houston), New Jersey GEOID 3440350 (Linden). INTPTLONG/INTPTLAT are city internal points, not terminal coordinates. The spatial adapter adds provenance, evidence, claims, region entities, point geometries and evidenced relationships. Country geography and city points remain CURRENT_REFERENCE. The EIA May 11, 2021 article supports the endpoint relationship.

Remaining limits: two endpoint cities, no surveyed pipeline alignment, no terminal inventory, no measured local shortage footprint, no independent fuel-flow series. The dependencies view is schematic. Live APIs, agent, enterprise integrations and public deployment remain outside this milestone.

Run cyber:data, cyber:validate, test:cyber, build, format:check, check:boundaries and qa:cyber with the portable Node runtime. The current browser gate is scripts/qa-cyber-explorer.mjs. It checks rendered geography, camera drill-down, Census evidence, date comparison, guided navigation, scene continuity, mobile evidence, URL restoration and the optional Kyivstar case, with zero external data requests. Build emits the inherited large-chunk warning.
