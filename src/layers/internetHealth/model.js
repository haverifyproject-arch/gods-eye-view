export const INTERNET_HEALTH_ID = 'internet-health';
export const IODA_BASE_URL =
  'https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events';

const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const point = (value) =>
  Array.isArray(value) &&
  value.length >= 2 &&
  finite(value[0]) &&
  finite(value[1]) &&
  Math.abs(value[0]) <= 180 &&
  Math.abs(value[1]) <= 90;

/** Reject unsupported geometry; country outlines provide context, not outage coverage measurements. */
export function validateCountryGeometry(geometry) {
  const polygons =
    geometry?.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : null;
  if (
    !polygons?.length ||
    !polygons.every(
      (polygon) =>
        polygon?.length &&
        polygon.every((ring) => ring.length >= 4 && ring.every(point)),
    )
  )
    throw new TypeError('Invalid country polygon');
  return geometry;
}

/** Administrative label anchor only. Pick the largest outer ring rather than inventing a sensor location. */
export function countryLabelAnchor(geometry) {
  validateCountryGeometry(geometry);
  const rings =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);
  const ring = rings.toSorted((a, b) => b.length - a.length)[0];
  const longitude =
    (Math.atan2(
      ring.reduce((sum, p) => sum + Math.sin((p[0] * Math.PI) / 180), 0),
      ring.reduce((sum, p) => sum + Math.cos((p[0] * Math.PI) / 180), 0),
    ) *
      180) /
    Math.PI;
  return {
    longitude,
    latitude: ring.reduce((sum, p) => sum + p[1], 0) / ring.length,
    basis:
      'Administrative label anchor derived from the country outline; not a measured outage location',
  };
}

/** Normalize only actual country detections. GTR and malformed rows never become geographic outage claims. */
export function normalizeInternetHealth(
  payload,
  countries,
  { from, until, retrievedAt, queryUrl, limit = 100 } = {},
) {
  if (
    !Array.isArray(payload?.data) ||
    payload.error ||
    !finite(from) ||
    !finite(until) ||
    from >= until ||
    !finite(retrievedAt)
  )
    throw new TypeError('Invalid IODA country response');
  const features = new Map(
    (countries?.features || []).map((feature) => [
      String(feature.properties?.iso2 || '').toUpperCase(),
      feature,
    ]),
  );
  if (!features.size) throw new TypeError('Country reference unavailable');
  const groups = new Map();
  let excluded = 0;
  for (const row of payload.data) {
    const code = String(row?.entity?.code || '').toUpperCase();
    if (
      row?.entity?.type !== 'country' ||
      !/^[A-Z]{2}$/.test(code) ||
      !finite(row.from) ||
      !finite(row.until) ||
      row.from >= row.until ||
      !finite(row.score) ||
      row.score < 0 ||
      typeof row.datasource !== 'string' ||
      !row.datasource ||
      /^gtr/i.test(row.method || '') ||
      /^gtr/i.test(row.datasource) ||
      row.until < from ||
      row.from > until
    ) {
      excluded++;
      continue;
    }
    const country = features.get(code);
    if (!country) {
      excluded++;
      continue;
    }
    const geometry = validateCountryGeometry(country.geometry);
    const id = `ioda-country-${code}`;
    if (!groups.has(id))
      groups.set(id, {
        id,
        layerId: INTERNET_HEALTH_ID,
        kind: 'internet-disruption',
        countryCode: code,
        name: row.entity.name || country.properties.name || code,
        label: `${row.entity.name || country.properties.name || code} · Internet observations`,
        status: 'recent-detections',
        evidenceState: 'OBSERVED',
        geometryState: 'CURRENT_REFERENCE',
        spatialScope: 'country',
        geometry,
        displayAnchor: point([
          country.properties.labelLon,
          country.properties.labelLat,
        ])
          ? {
              longitude: country.properties.labelLon,
              latitude: country.properties.labelLat,
              basis:
                'Natural Earth administrative label anchor; not a measured outage location',
            }
          : countryLabelAnchor(geometry),
        spatialDescription:
          'Country-level measurement aggregation. Country outline is context, not proof that every network, place or person was affected.',
        affectedNetworks: null,
        events: [],
        provenance: {
          publisher: 'IODA / Georgia Tech',
          url: queryUrl || IODA_BASE_URL,
          retrievedAt: new Date(retrievedAt).toISOString(),
          windowStart: new Date(from * 1000).toISOString(),
          windowEnd: new Date(until * 1000).toISOString(),
          rights:
            payload.copyright ||
            'Provider reserves rights; public API access does not establish commercial reuse permission',
          geographySource: 'Natural Earth · public domain country reference',
        },
      });
    const record = groups.get(id);
    const eventId = `${row.datasource}:${row.method || 'unspecified'}:${row.from}:${row.until}`;
    if (record.events.some((event) => event.id === eventId)) continue;
    record.events.push({
      id: eventId,
      from: row.from,
      until: row.until,
      startTime: new Date(row.from * 1000).toISOString(),
      endTime: new Date(row.until * 1000).toISOString(),
      observationType: row.datasource,
      method: String(row.method || 'unspecified'),
      score: row.score,
      scoreMeaning:
        'Raw provider detection score; not percentage, confidence or population impact',
      windowClipped: row.until >= until || row.from <= from,
      recoveryEstablished: false,
    });
  }
  return {
    records: [...groups.values()].map((record) => ({
      ...record,
      events: record.events.toSorted((a, b) => b.from - a.from),
    })),
    retrievedAt,
    window: { from, until },
    excluded,
    sourceLimited: payload.data.length >= limit,
    source: 'IODA · country connectivity anomaly detections',
  };
}

export function internetAnalystRecord(record) {
  return {
    id: record.id,
    name: record.name,
    countryCode: record.countryCode,
    lat: record.displayAnchor.latitude,
    lon: record.displayAnchor.longitude,
    timeMs: Math.max(...record.events.map((event) => event.from)) * 1000,
    observationCount: record.events.length,
    status: record.status,
    evidenceState: record.evidenceState,
    spatialScope: record.spatialScope,
    locationBasis: record.displayAnchor.basis,
    affectedNetworks: null,
    observations: record.events,
    provenance: record.provenance,
  };
}
