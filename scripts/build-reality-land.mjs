import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Reproducible curation only: retain complete source polygons, without invented
// edges, coastline smoothing, coordinate rounding or boundary clipping.
const inputPath = process.argv[2] || 'output/natural-earth-countries.geojson';
const input = readFileSync(inputPath);
const source = JSON.parse(input);
const features = source.features
  .filter((feature) => ['Tonga', 'Fiji'].includes(feature.properties.ADMIN))
  .map((feature) => ({
    type: 'Feature',
    properties: {
      name: feature.properties.ADMIN,
      status: 'CURRENT_REFERENCE',
      source: 'Natural Earth 1:10m admin-0 country land polygons',
      attribution: 'Made with Natural Earth',
      license: 'Public domain',
    },
    geometry: {
      type: 'MultiPolygon',
      coordinates: feature.geometry.coordinates.filter((polygon) =>
        polygon[0].some(
          ([longitude, latitude]) =>
            (longitude >= 170 || longitude <= -170) &&
            latitude >= -25 &&
            latitude <= -10,
        ),
      ),
    },
  }));
if (
  features.length !== 2 ||
  features.some((feature) => !feature.geometry.coordinates.length)
) {
  throw new Error('Required Tonga/Fiji source polygons are missing');
}
const output = {
  type: 'FeatureCollection',
  metadata: {
    source:
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson',
    retrievedDate: '2026-09-24',
    sourceSha256: createHash('sha256').update(input).digest('hex'),
    license: 'Public domain',
    attribution: 'Made with Natural Earth',
    scope:
      'Generalized reference land; not January 2022 coastline or satellite imagery',
    curation:
      'Select Tonga and Fiji complete polygons intersecting longitude170..180/-180..-170, latitude-25..-10; retain original vertices and holes.',
  },
  features,
};
writeFileSync(
  'public/reality/pacific-land.geojson',
  `${JSON.stringify(output)}\n`,
);
console.log(
  JSON.stringify({
    countries: features.map((feature) => feature.properties.name),
    polygons: features.reduce(
      (sum, feature) => sum + feature.geometry.coordinates.length,
      0,
    ),
    bytes: Buffer.byteLength(JSON.stringify(output)),
  }),
);
