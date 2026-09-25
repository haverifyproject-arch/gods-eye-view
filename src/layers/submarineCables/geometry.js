export function featureReference(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return null;

  const props = feature?.properties || {};
  const propertyCoords = coordsFromProperty(props.coordinates);
  if (propertyCoords) {
    return {
      lon: propertyCoords[0],
      lat: propertyCoords[1],
    };
  }

  if (geometry.type === 'Point') {
    const coords = coordsFromPoint(geometry.coordinates);
    if (!coords) return null;
    return { lon: coords[0], lat: coords[1] };
  }

  const coords = [];
  collectLonLat(geometry.coordinates, coords);
  if (!coords.length) return null;

  let lonSum = 0;
  let latSum = 0;
  for (const [lon, lat] of coords) {
    lonSum += lon;
    latSum += lat;
  }
  return {
    lon: lonSum / coords.length,
    lat: latSum / coords.length,
  };
}

export function coordsFromProperty(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lon = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

export function coordsFromPoint(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lon = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

export function collectLonLat(value, out) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    const lon = Number(value[0]);
    const lat = Number(value[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      out.push([lon, lat]);
    }
    return;
  }
  for (const child of value) collectLonLat(child, out);
}

export function featureLabel(feature) {
  const props = feature?.properties || {};
  return String(props.name || props.id || feature?.id || '').trim();
}

export function normalizeFeatures(json, kind) {
  const features = Array.isArray(json?.features) ? json.features : [];
  return features.map((feature, index) => {
    const id = feature?.properties?.id || feature?.id || `${kind}-${index}`;
    return {
      ...feature,
      id: String(id),
    };
  });
}

/** Bounded reference records; geometry proximity does not invent network membership. */
export function cableDebugRecords(
  cables,
  landings,
  { limit = 3000, kind, ids } = {},
) {
  const maximum = Math.min(
    3000,
    Math.max(0, Number.isFinite(limit) ? Math.floor(limit) : 3000),
  );
  const wanted = Array.isArray(ids) ? new Set(ids) : null;
  const records = [];
  for (const [collection, recordKind] of [
    [cables, 'cable'],
    [landings, 'landing-point'],
  ]) {
    if (kind && kind !== recordKind) continue;
    for (const feature of collection?.features || []) {
      if (records.length >= maximum) return records;
      const referenceId = String(feature.properties?.id || feature.id || '');
      if (!referenceId || !feature.geometry) continue;
      const id = `telegeography-submarine-cables:${recordKind}:${referenceId}`;
      if (wanted && !wanted.has(id) && !wanted.has(referenceId)) continue;
      records.push({
        id,
        referenceId,
        kind: recordKind,
        label: featureLabel(feature),
        status: 'CURRENT_REFERENCE',
        geometry: structuredClone(feature.geometry),
        reference: featureReference(feature),
        source: 'TeleGeography',
        sourceUrl: 'https://www.submarinecablemap.com/',
        snapshotDate: '2026-05-24',
        rights: '© TeleGeography — CC BY-NC-SA 3.0; not MIT',
        associations: [],
        limitation:
          'Generalized current route/reference point. This bundle supplies no cable-to-landing membership or event-time dependency.',
      });
    }
  }
  return records;
}
