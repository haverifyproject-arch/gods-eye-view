# Offline Pacific reference land

`pacific-land.geojson` contains generalized Fiji and Tonga land polygons from Natural Earth 1:10m admin-0 countries. These are reference coastlines, not imagery, a surveyed shoreline, or a reconstruction of the January 2022 volcanic island.

- Source: [Natural Earth vector repository, pinned revision ca96624a56bd078437bca8184e78163e5039ad19](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson).
- Retrieved: 24 September 2026. Source SHA-256 is recorded in the GeoJSON metadata.
- License: [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- Credit: **Made with Natural Earth**.
- Processing: select country features Tonga and Fiji; retain complete island polygons intersecting 170°E–170°W and 25°S–10°S. No new coastline edges, simplification, invented islands, or coordinate rounding. Source holes and original vertices are retained. Administrative properties are discarded because the pack serves geographic context only.
- Reproduce: download the pinned source to `output/natural-earth-countries.geojson`, then run `node scripts/build-reality-land.mjs`.

This public-domain land pack is independent of the separate TeleGeography cable dataset and its CC BY-NC-SA license.
