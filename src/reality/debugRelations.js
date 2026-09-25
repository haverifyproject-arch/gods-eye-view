import { pointInRing } from '../data/naturalEarthRegions.js';

const radians = (value) => (value * Math.PI) / 180;
export function distanceKm(a, b) {
  const h =
    Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(radians(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Unwrap around the query meridian; preserve polygon holes and dateline islands. */
export function containsPoint(geometry, point) {
  const polygons =
    geometry?.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];
  const inside = (ring) => {
    let previous = ring[0][0];
    const unwrapped = ring.map(([lon, lat]) => {
      const value = previous + (((((lon - previous) % 360) + 540) % 360) - 180);
      previous = value;
      return [value, lat];
    });
    const center =
      unwrapped.reduce((sum, p) => sum + p[0], 0) / unwrapped.length;
    const longitude = point.lon + 360 * Math.round((center - point.lon) / 360);
    return pointInRing(unwrapped, point.lat, longitude);
  };
  return polygons.some(
    (rings) => inside(rings[0]) && !rings.slice(1).some(inside),
  );
}

export function coordinatesOf(record) {
  const lat = record?.lat ?? record?.latitude ?? record?.reference?.lat;
  const lon = record?.lon ?? record?.longitude ?? record?.reference?.lon;
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}

export function inScope(scope, point) {
  if (!point) return false;
  if (scope.geometry) return containsPoint(scope.geometry, point);
  return coordinatesOf(scope)
    ? distanceKm(coordinatesOf(scope), point) <= (scope.radiusKm || 150)
    : false;
}

export function routeParts(record) {
  return record.geometry?.type === 'LineString'
    ? [record.geometry.coordinates]
    : record.geometry?.type === 'MultiLineString'
      ? record.geometry.coordinates
      : [];
}

export function referenceInScope(scope, record) {
  if (record.geometry?.type === 'Point') {
    const [lon, lat] = record.geometry.coordinates;
    return inScope(scope, { lon, lat });
  }
  const parts = routeParts(record);
  return parts.length
    ? parts.some((path) =>
        path.some(([lon, lat]) => inScope(scope, { lon, lat })),
      )
    : inScope(scope, coordinatesOf(record));
}

/** No model guesses. Broad geographic overlap is context, never a network dependency. */
export function buildDebugRelations({
  subject,
  references = [],
  physical = [],
  now = Date.now(),
}) {
  const relationships = [];
  const unknowns = [
    'No cause is established by geographic proximity.',
    'Affected ASNs and service dependencies are not supplied by the country-level outage feed.',
  ];
  const relevant = references.filter((record) =>
    referenceInScope(subject, record),
  );
  const bounded = [
    ...relevant.filter((record) => routeParts(record).length).slice(0, 2),
    ...relevant.filter((record) => !routeParts(record).length).slice(0, 2),
  ];
  for (const reference of bounded) {
    const relevantPart = (path) =>
      path.some(([lon, lat]) => inScope(subject, { lon, lat }));
    const parts = routeParts(reference).toSorted(
      (a, b) => Number(relevantPart(b)) - Number(relevantPart(a)),
    );
    const point =
      reference.geometry?.type === 'Point'
        ? {
            lon: reference.geometry.coordinates[0],
            lat: reference.geometry.coordinates[1],
          }
        : coordinatesOf(reference);
    relationships.push({
      id: `reference:${reference.id}`,
      label: reference.label || reference.name || reference.id,
      state: 'CURRENT_REFERENCE',
      kind: parts.length ? 'cable' : 'landing',
      explanation: subject.geometry
        ? 'Reference geometry has a sampled point inside the selected country outline. This is geographic context, not proof that the cable carries affected traffic.'
        : `Reference geometry has a sampled point within ${subject.radiusKm || 150} km of the selected location. No service dependency is established.`,
      provenance: [
        {
          label: reference.source || 'TeleGeography',
          url: reference.sourceUrl || 'https://www.submarinecablemap.com/',
          time: reference.snapshotDate || null,
          detail:
            reference.rights ||
            'CC BY-NC-SA; current reference, event-time topology unknown',
        },
      ],
      evidenceNeeded:
        'Operator service mapping and incident reports are needed to establish an affected dependency.',
      parts,
      point,
      recordId: reference.id,
      visible: true,
    });
  }
  const physicalInScope = physical.filter((record) =>
    inScope(subject, coordinatesOf(record)),
  );
  const contextual = physicalInScope
    .filter((record) => record.layerId === 'local-datacenters')
    .slice(0, 2);
  const observations = physicalInScope
    .filter((record) => record.layerId !== 'local-datacenters')
    .slice(0, 4);
  for (const record of [...observations, ...contextual]) {
    const point = coordinatesOf(record);
    const time = record.timeMs;
    const recent =
      Number.isFinite(time) && time <= now && time >= now - 86400000;
    const state =
      record.evidenceState ||
      (record.layerId === 'earthquakes' ? 'OBSERVED' : 'CURRENT_REFERENCE');
    relationships.push({
      id: `physical:${record.layerId}:${record.id}`,
      label:
        record.layerId === 'earthquakes'
          ? `M${record.magnitude} · ${record.place || 'Earthquake'}`
          : record.name || record.label || record.id,
      state,
      kind: record.layerId === 'local-datacenters' ? 'facility' : 'physical',
      point,
      parts: [],
      visible: true,
      explanation: `${subject.geometry ? 'Inside the selected country outline' : 'Within the stated location search radius'}. ${record.layerId === 'local-datacenters' ? 'OSM facility reference; extraction date and network membership are unknown.' : recent ? 'Observed in the past 24 hours.' : 'Observation time must be inspected before comparison.'} Geographic coincidence does not establish causation.`,
      provenance: [
        {
          label: record.source || record.layerId,
          url: record.sourceUrl || null,
          time: Number.isFinite(time) ? new Date(time).toISOString() : null,
          detail: `${record.rights || ''} Position from the native source; geographic membership is a deterministic derivation.`,
        },
      ],
      evidenceNeeded:
        'Event-time measurements and an operator account are needed to connect this observation to connectivity loss.',
    });
    // A deliberately narrow triage hypothesis, not a causal model. Country
    // co-occurrence alone is insufficient: require a substantial measured
    // quake, a nearby actual route sample and a subsequent anomaly onset.
    const subsequent = subject.events?.find(
      (event) =>
        Number.isFinite(event.from) &&
        Number.isFinite(time) &&
        event.from * 1000 >= time &&
        event.from * 1000 - time <= 6 * 3600000,
    );
    if (
      record.layerId === 'earthquakes' &&
      record.magnitude >= 5.5 &&
      recent &&
      subsequent
    ) {
      let nearest = null;
      for (const reference of bounded) {
        for (const path of routeParts(reference)) {
          for (const [lon, lat] of path) {
            const km = distanceKm(point, { lon, lat });
            if (!nearest || km < nearest.km)
              nearest = { km, lon, lat, reference };
          }
        }
      }
      if (nearest && nearest.km <= 50) {
        relationships.push({
          id: `hypothesis:${record.id}:${nearest.reference.id}`,
          label: 'Possible physical exposure · unconfirmed',
          state: 'INFERRED',
          kind: 'hypothesis',
          point: null,
          parts: [
            [
              [point.lon, point.lat],
              [nearest.lon, nearest.lat],
            ],
          ],
          visible: true,
          explanation: `A measured M${record.magnitude} earthquake precedes an IODA detection by less than six hours and lies ${nearest.km.toFixed(1)} km from a mapped cable sample. This is a triage hypothesis, not evidence of a cable fault or outage cause. Distance is to a generalized route sample, not the nearest surveyed cable point.`,
          provenance: [
            {
              label: 'USGS earthquake',
              url: record.sourceUrl,
              time: new Date(time).toISOString(),
            },
            {
              label: 'IODA anomaly',
              url: subject.provenance?.url,
              time: subsequent.startTime,
              retrievedAt: subject.provenance?.retrievedAt,
            },
            {
              label: 'TeleGeography current reference',
              url: nearest.reference.sourceUrl,
              time: nearest.reference.snapshotDate,
              detail: nearest.reference.rights,
            },
          ],
          evidenceNeeded:
            'Operator fault reports, affected network routing and event-time cable/service topology. The magnitude, 50 km and six-hour thresholds are transparent screening choices, not probabilities.',
        });
      }
    }
  }
  if (!physical.length)
    unknowns.push(
      'No usable physical observations are loaded. An empty result is not proof that no physical event occurred.',
    );
  if (!relationships.some((item) => item.kind === 'cable'))
    unknowns.push(
      'No cable with a sampled route point in this scope was found. Offshore segments and service paths may be omitted.',
    );
  return { relationships, unknowns };
}

export function visibleEvidence(state, filter) {
  if (state === 'UNKNOWN') return false;
  if (filter === 'observed') return state === 'OBSERVED';
  if (filter === 'reported')
    return state === 'OBSERVED' || state === 'REPORTED';
  if (filter === 'hide_reference') return state !== 'CURRENT_REFERENCE';
  if (filter === 'clear_inference') return state !== 'INFERRED';
  return true;
}
