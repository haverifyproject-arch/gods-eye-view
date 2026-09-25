# Country aggregation context

`countries.geojson` is a public-domain Natural Earth 1:50m country reference layer, retrieved 25 September 2026 from [pinned revision ca96624a56bd078437bca8184e78163e5039ad19](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_50m_admin_0_countries.geojson). [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) permit reuse. **Made with Natural Earth**.

Properties: `iso2` from source `ISO_A2_EH`, `name` from `ADMIN`, and `labelLon`/`labelLat` from source `LABEL_X`/`LABEL_Y`. These cartographic label positions are not outbreak, outage, sensor or infrastructure locations. Geometry is Polygon or MultiPolygon with holes/dateline parts retained. It indicates a measurement's country aggregation context, never universal impact on every network inside it.

Coordinates are rounded to 0.001 degrees, with original coordinates preserved for any small ring that would collapse. Source parts sharing a source-assigned ISO code are collected into one MultiPolygon (Australia and its source-coded territories), retaining every polygon. No islands are replaced by circles or invented coordinates. Source entries without a two-letter code are explicitly skipped and listed in metadata (no guessed political mappings). Unmatched IODA codes must remain an explicit no-geometry result, not an arbitrary point. Boundaries are generalized source cartography, not a geopolitical determination or historical survey.

Rebuild: download the pinned GeoJSON to `output/natural-earth-countries-50m.geojson`, then run `node scripts/build-internet-countries.mjs`. The output embeds the original source SHA-256 and retrieval date. No IODA event payload is bundled in this product asset.
