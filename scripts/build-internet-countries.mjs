import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const source = readFileSync(
  process.argv[2] || 'output/natural-earth-countries-50m.geojson',
);
const raw = JSON.parse(source);
const round = (point) => point.map((number) => Number(number.toFixed(3)));
const ring = (points) => {
  const rounded = points
    .map(round)
    .filter(
      (point, index, all) =>
        !index ||
        point[0] !== all[index - 1][0] ||
        point[1] !== all[index - 1][1],
    );
  // Never lose a small island to quantization. Keep its original vertices.
  if (new Set(rounded.map((point) => point.join(','))).size < 3) return points;
  if (rounded[0].join(',') !== rounded.at(-1).join(','))
    rounded.push([...rounded[0]]);
  return rounded;
};
const skipped = [];
const parts = raw.features.flatMap((feature) => {
  const iso2 = feature.properties.ISO_A2_EH;
  if (!/^[A-Z]{2}$/.test(iso2)) {
    skipped.push(feature.properties.ADMIN);
    return [];
  }
  const coordinates =
    feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates.map(ring)
      : feature.geometry.coordinates.map((polygon) => polygon.map(ring));
  return [
    {
      type: 'Feature',
      properties: {
        iso2,
        name: feature.properties.ADMIN,
        labelLon: feature.properties.LABEL_X,
        labelLat: feature.properties.LABEL_Y,
        status: 'CURRENT_REFERENCE',
        primaryIso: feature.properties.ISO_A2 === iso2,
      },
      geometry: { type: feature.geometry.type, coordinates },
    },
  ];
});
const grouped = new Map();
for (const part of parts) {
  const polygons =
    part.geometry.type === 'Polygon'
      ? [part.geometry.coordinates]
      : part.geometry.coordinates;
  const previous = grouped.get(part.properties.iso2);
  if (!previous)
    grouped.set(part.properties.iso2, {
      ...part,
      geometry: { type: 'MultiPolygon', coordinates: polygons },
    });
  else {
    previous.geometry.coordinates.push(...polygons);
    if (part.properties.primaryIso) previous.properties = part.properties;
  }
}
const features = [...grouped.values()];
for (const feature of features) delete feature.properties.primaryIso;
const output = {
  type: 'FeatureCollection',
  metadata: {
    source:
      'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_50m_admin_0_countries.geojson',
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    retrievedDate: '2026-09-25',
    license: 'Public domain',
    attribution: 'Made with Natural Earth',
    curation:
      'ISO_A2_EH join; group parts sharing source code without boundary invention; retain polygons and holes, round coordinates to 0.001 degrees, preserve original tiny rings if rounding collapses them. Labels are source-provided cartographic positions, not outage locations.',
    skippedWithoutIso2: skipped,
  },
  features,
};
writeFileSync(
  'public/reality/countries.geojson',
  `${JSON.stringify(output)}\n`,
);
console.log(
  JSON.stringify({
    features: features.length,
    bytes: Buffer.byteLength(JSON.stringify(output)),
    skipped,
  }),
);
