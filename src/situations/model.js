/** Portable, renderer-independent evidence model. All intervals are UTC and half-open. */
export const EVIDENCE_STATES = Object.freeze([
  'OBSERVED',
  'REPORTED',
  'DERIVED',
  'RECONSTRUCTED',
  'INFERRED',
  'CURRENT_REFERENCE',
  'UNKNOWN',
]);
export const RECORD_GROUPS = Object.freeze([
  'entities',
  'events',
  'observations',
  'claims',
  'relationships',
]);
export const EVIDENCE_LENSES = Object.freeze({
  ALL: EVIDENCE_STATES,
  OBSERVED: ['OBSERVED'],
  REPORTED: ['REPORTED'],
  RECONSTRUCTION: ['DERIVED', 'RECONSTRUCTED'],
  INFERRED: ['INFERRED'],
  CURRENT_REFERENCE: ['CURRENT_REFERENCE'],
  UNKNOWN: ['UNKNOWN'],
  NO_INFERENCE: EVIDENCE_STATES.filter((state) => state !== 'INFERRED'),
});

function requireValue(condition, message) {
  if (!condition) throw new TypeError(`Invalid situation: ${message}`);
}

export function utcMillis(value) {
  requireValue(
    typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value),
    'timestamps must be explicit UTC ISO strings',
  );
  const result = Date.parse(value);
  requireValue(
    Number.isFinite(result) &&
      new Date(result).toISOString().replace('.000Z', 'Z') ===
        value.replace('.000Z', 'Z'),
    `invalid timestamp ${value}`,
  );
  return result;
}

export function validateInterval(interval, label) {
  requireValue(
    interval && typeof interval === 'object',
    `${label} needs a time interval`,
  );
  const start = utcMillis(interval.start);
  const end = utcMillis(interval.end);
  requireValue(start < end, `${label} interval must have positive duration`);
}

/** Geometry is a representation with provenance, never an implicit measurement. */
export function validateGeometry(geometry) {
  if (geometry == null) return;
  requireValue(
    ['Point', 'LineString', 'MultiLineString', 'DistanceLocus'].includes(
      geometry.type,
    ),
    'unsupported geometry',
  );
  requireValue(
    ['EXACT', 'APPROXIMATE', 'SCHEMATIC'].includes(geometry.precision),
    'geometry needs precision',
  );
  requireValue(
    ['EVENT_TIME', 'CURRENT_REFERENCE', 'RECONSTRUCTED'].includes(
      geometry.basis,
    ),
    'geometry needs historical/reference basis',
  );
  requireValue(
    typeof geometry.description === 'string' && geometry.description.trim(),
    'geometry needs a description of its spatial basis',
  );
  requireValue(
    Array.isArray(geometry.evidenceIds) && geometry.evidenceIds.length > 0,
    'geometry needs evidence',
  );
  const coordinate = (point) => {
    requireValue(
      Array.isArray(point) &&
        point.length === 2 &&
        point.every(Number.isFinite) &&
        Math.abs(point[0]) <= 180 &&
        Math.abs(point[1]) <= 90,
      'invalid WGS84 coordinate',
    );
  };
  const line = (points) => {
    requireValue(
      Array.isArray(points) && points.length >= 2,
      'line needs at least two coordinates',
    );
    points.forEach(coordinate);
  };
  if (geometry.type === 'Point') coordinate(geometry.coordinates);
  if (geometry.type === 'LineString') line(geometry.coordinates);
  if (geometry.type === 'MultiLineString') {
    requireValue(
      Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0,
      'multiline geometry is empty',
    );
    geometry.coordinates.forEach(line);
  }
  if (geometry.type === 'DistanceLocus') {
    coordinate(geometry.center);
    requireValue(
      Number.isFinite(geometry.radiusMeters) &&
        geometry.radiusMeters > 0 &&
        geometry.radiusMeters < 20000000,
      'invalid distance locus',
    );
    requireValue(
      geometry.precision !== 'EXACT',
      'distance-only fault geography cannot be exact',
    );
  }
}

function indexRecords(records, label) {
  requireValue(Array.isArray(records), `${label} must be an array`);
  const result = new Map();
  for (const record of records) {
    requireValue(
      record &&
        typeof record.id === 'string' &&
        /^[a-z][a-z0-9-]*$/.test(record.id),
      `${label} contains an invalid ID`,
    );
    requireValue(!result.has(record.id), `duplicate ID ${record.id}`);
    result.set(record.id, record);
  }
  return result;
}

export function validateSituation(situation) {
  requireValue(situation?.schemaVersion === 1, 'unsupported schema version');
  requireValue(
    typeof situation.id === 'string' &&
      situation.id.length > 0 &&
      typeof situation.title === 'string' &&
      situation.title.length > 0,
    'missing identity',
  );
  validateInterval(situation.timeRange, 'situation');
  const sources = indexRecords(situation.sources, 'sources');
  const evidence = indexRecords(situation.evidence, 'evidence');
  for (const source of sources.values()) {
    requireValue(
      typeof source.publisher === 'string' &&
        source.publisher.trim() &&
        typeof source.rights === 'string' &&
        source.rights.trim(),
      'source needs publisher and rights',
    );
    requireValue(/^https:\/\//.test(source.url), 'source URL must use HTTPS');
    try {
      new URL(source.url);
    } catch {
      requireValue(false, 'invalid source URL');
    }
    utcMillis(source.retrievedAt);
    requireValue(
      source.publishedAt === null || typeof source.publishedAt === 'string',
      'source publication date must be preserved or explicitly unknown',
    );
  }
  for (const item of evidence.values()) {
    requireValue(sources.has(item.sourceId), `missing source for ${item.id}`);
    requireValue(
      typeof item.summary === 'string' &&
        item.summary.trim() &&
        typeof item.locator === 'string' &&
        item.locator.trim(),
      'evidence needs summary and locator',
    );
  }
  const groups = RECORD_GROUPS.map((key) => [
    ...indexRecords(situation[key], key).values(),
  ]);
  const records = indexRecords(groups.flat(), 'all records');
  const entities = new Map(
    situation.entities.map((entity) => [entity.id, entity]),
  );
  const checkEvidence = (ids, label) => {
    requireValue(
      Array.isArray(ids) && ids.every((id) => evidence.has(id)),
      `${label} has missing evidence references`,
    );
  };
  for (const record of records.values()) {
    requireValue(
      EVIDENCE_STATES.includes(record.status),
      `invalid status on ${record.id}`,
    );
    requireValue(
      typeof record.label === 'string' && record.label.trim(),
      `${record.id} needs a label`,
    );
    validateInterval(record.validTime, record.id);
    checkEvidence(record.evidenceIds, record.id);
    requireValue(
      record.status === 'UNKNOWN' || record.evidenceIds.length > 0,
      `${record.id} needs evidence`,
    );
    if (record.status === 'UNKNOWN') {
      requireValue(
        typeof record.question === 'string' && record.question.trim(),
        'unknown must preserve an unanswered question',
      );
    }
    if (['INFERRED', 'RECONSTRUCTED', 'DERIVED'].includes(record.status)) {
      requireValue(
        typeof record.method === 'string' && record.method.trim(),
        `${record.id} needs a transformation/reasoning method`,
      );
      requireValue(
        Array.isArray(record.premiseIds) &&
          record.premiseIds.length > 0 &&
          record.premiseIds.every((id) => records.has(id) && id !== record.id),
        `${record.id} needs supported premises`,
      );
    }
    if (record.premiseIds !== undefined) {
      requireValue(
        Array.isArray(record.premiseIds) &&
          record.premiseIds.every((id) => records.has(id) && id !== record.id),
        `${record.id} contains invalid premises`,
      );
    }
    validateGeometry(record.geometry);
    if (record.anchorId !== undefined) {
      const anchor = entities.get(record.anchorId);
      requireValue(
        typeof record.anchorId === 'string' &&
          anchor &&
          anchor.id !== record.id &&
          anchor.geometry?.type === 'Point' &&
          anchor.anchorId === undefined,
        `${record.id} needs a direct point entity anchor; missing, recursive or non-point anchors are invalid`,
      );
      requireValue(
        record.geometry == null &&
          typeof record.spatialDescription === 'string' &&
          record.spatialDescription.trim(),
        `${record.id} anchor needs explicit spatial context and cannot also supply geometry`,
      );
    }
    if (record.geometry) {
      checkEvidence(record.geometry.evidenceIds, `${record.id} geometry`);
      if (record.geometry.basis === 'CURRENT_REFERENCE') {
        requireValue(
          record.status === 'CURRENT_REFERENCE',
          'current-reference geometry cannot masquerade as event-time evidence',
        );
      }
    }
  }
  for (const observation of situation.observations) {
    requireValue(
      observation.status === 'OBSERVED' &&
        ['published-summary', 'raw-measurement', 'sensor-summary'].includes(
          observation.method,
        ),
      'observations need a measurement method',
    );
    requireValue(
      typeof observation.metric === 'string' &&
        observation.metric.trim() &&
        Object.hasOwn(observation, 'value') &&
        observation.value != null &&
        typeof observation.scope === 'string' &&
        observation.scope.trim(),
      'observations need metric, value and scope',
    );
    validateInterval(observation.observedTime, 'measurement acquisition');
  }
  for (const record of [
    ...situation.entities,
    ...situation.events,
    ...situation.claims,
    ...situation.relationships,
  ]) {
    if (record.status === 'OBSERVED') {
      requireValue(
        Array.isArray(record.observationIds) &&
          record.observationIds.length > 0 &&
          record.observationIds.every((id) =>
            situation.observations.some((item) => item.id === id),
          ),
        `${record.id} cannot claim observation without a measurement record`,
      );
    }
  }
  for (const edge of situation.relationships) {
    requireValue(
      records.has(edge.from) && records.has(edge.to) && edge.from !== edge.to,
      `invalid relationship endpoints on ${edge.id}`,
    );
    requireValue(
      typeof edge.type === 'string' && edge.type.trim(),
      'relationship needs a type',
    );
  }
  // Premise cycles cannot justify themselves, even when each reference exists.
  const visiting = new Set();
  const visited = new Set();
  const visit = (record) => {
    if (visited.has(record.id)) return;
    requireValue(!visiting.has(record.id), 'circular evidence premises');
    visiting.add(record.id);
    for (const id of record.premiseIds || []) visit(records.get(id));
    visiting.delete(record.id);
    visited.add(record.id);
  };
  for (const record of records.values()) visit(record);
  requireValue(
    Array.isArray(situation.timeline) && situation.timeline.length > 0,
    'missing timeline',
  );
  let previous = -Infinity;
  for (const moment of situation.timeline) {
    const time = utcMillis(moment.time);
    requireValue(
      time >= previous &&
        time >= utcMillis(situation.timeRange.start) &&
        time < utcMillis(situation.timeRange.end),
      'timeline outside range or out of order',
    );
    requireValue(
      typeof moment.label === 'string' && moment.label.trim(),
      'timeline needs labels',
    );
    previous = time;
  }
  return situation;
}

export function activeAt(record, time) {
  const instant = utcMillis(time);
  return (
    instant >= utcMillis(record.validTime.start) &&
    instant < utcMillis(record.validTime.end)
  );
}

/** Relationship visibility cannot leak a filtered or temporally absent endpoint. */
export function visibleRecords(
  situation,
  { time, lens = 'ALL', hiddenIds = [] },
) {
  requireValue(Object.hasOwn(EVIDENCE_LENSES, lens), 'unknown evidence lens');
  const hidden = new Set(hiddenIds);
  const visible = (record) =>
    !hidden.has(record.id) &&
    activeAt(record, time) &&
    EVIDENCE_LENSES[lens].includes(record.status);
  const records = RECORD_GROUPS.filter((group) => group !== 'relationships')
    .flatMap((group) => situation[group])
    .filter(visible);
  const ids = new Set(records.map((record) => record.id));
  return {
    records,
    relationships: situation.relationships.filter(
      (edge) => visible(edge) && ids.has(edge.from) && ids.has(edge.to),
    ),
  };
}
