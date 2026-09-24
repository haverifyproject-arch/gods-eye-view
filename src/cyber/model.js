export const STATUSES = Object.freeze([
  'OBSERVED',
  'REPORTED',
  'DERIVED',
  'INFERRED',
  'DISPUTED',
  'UNKNOWN',
]);
const collections = [
  'entities',
  'events',
  'geometries',
  'observations',
  'claims',
  'evidence',
  'relationships',
  'times',
  'provenance',
];

/** Fail closed on malformed canonical data, dangling evidence or dishonest geography. */
export function validateScenario(data) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (data?.schemaVersion !== 1) fail('Unsupported schema version');
  const groups = Object.fromEntries(
    collections.map((key) => [
      key,
      Array.isArray(data?.[key]) ? data[key] : (fail(`Missing ${key}`), []),
    ]),
  );
  const ids = new Map();
  for (const [group, records] of Object.entries(groups))
    for (const record of records) {
      if (!record?.id || ids.has(record.id))
        fail(`Missing or duplicate ID: ${record?.id}`);
      else ids.set(record.id, group);
    }
  const ref = (id, group, owner) => {
    if (!id || !ids.has(id) || (group && ids.get(id) !== group))
      fail(`${owner}: invalid ${group || 'object'} reference ${id}`);
  };
  const refs = (list, group, owner, required = true) => {
    if (!Array.isArray(list) || (required && !list.length))
      return fail(`${owner}: missing ${group} references`);
    for (const id of list) ref(id, group, owner);
  };
  const status = (r) => {
    if (!STATUSES.includes(r.status)) fail(`${r.id}: invalid epistemic status`);
  };
  for (const t of groups.times) {
    const pattern =
      t.precision === 'day'
        ? /^\d{4}-\d{2}-\d{2}$/
        : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (
      !['day', 'minute', 'second'].includes(t.precision) ||
      !pattern.test(t.start) ||
      !pattern.test(t.end) ||
      !Number.isFinite(Date.parse(t.start)) ||
      !Number.isFinite(Date.parse(t.end)) ||
      Date.parse(t.end) < Date.parse(t.start)
    )
      fail(`${t.id}: invalid time interval or precision`);
    if (!['EVENT_TIME', 'CURRENT_REFERENCE'].includes(t.basis))
      fail(`${t.id}: invalid temporal basis`);
  }
  for (const p of groups.provenance) {
    if (
      !/^https:\/\//.test(p.url) ||
      !p.publisher ||
      !p.retrievedAt ||
      !p.rights ||
      !p.transformation
    )
      fail(`${p.id}: incomplete provenance`);
  }
  for (const e of groups.evidence) {
    ref(e.provenanceId, 'provenance', e.id);
    if (!e.locator || !e.summary)
      fail(`${e.id}: missing source locator or summary`);
  }
  for (const e of groups.entities)
    if ('coordinates' in e || 'geometryId' in e)
      fail(`${e.id}: geometry requires an evidenced relationship`);
  for (const c of groups.claims) {
    status(c);
    refs(c.subjects, 'entities', c.id);
    refs(c.evidenceIds, 'evidence', c.id, c.status !== 'UNKNOWN');
    ref(c.timeId, 'times', c.id);
    if (!c.text || !c.limitation)
      fail(`${c.id}: missing claim text or limitation`);
    if (c.status === 'OBSERVED') refs(c.observationIds, 'observations', c.id);
    if (c.status === 'INFERRED') refs(c.premiseIds, 'claims', c.id);
    if (c.status === 'DERIVED' && !c.derivation)
      fail(`${c.id}: missing derivation`);
    if (
      c.status === 'DISPUTED' &&
      new Set(
        (c.evidenceIds || []).map(
          (id) => groups.evidence.find((e) => e.id === id)?.provenanceId,
        ),
      ).size < 2
    )
      fail(`${c.id}: dispute requires competing sources`);
  }
  for (const o of groups.observations) {
    ref(o.subjectId, 'entities', o.id);
    ref(o.timeId, 'times', o.id);
    refs(o.evidenceIds, 'evidence', o.id);
    if (!o.method || !o.metric || !o.observer || !o.limitation)
      fail(`${o.id}: incomplete observation`);
  }
  for (const e of groups.events) {
    ref(e.timeId, 'times', e.id);
    refs(e.entityIds, 'entities', e.id);
    refs(e.claimIds, 'claims', e.id);
  }
  const position = (p) =>
    Array.isArray(p) &&
    p.length >= 2 &&
    p.every(Number.isFinite) &&
    Math.abs(p[0]) <= 180 &&
    Math.abs(p[1]) <= 90;
  const ring = (r) =>
    Array.isArray(r) &&
    r.length >= 4 &&
    r.every(position) &&
    JSON.stringify(r[0]) === JSON.stringify(r.at(-1));
  for (const g of groups.geometries) {
    ref(g.timeId, 'times', g.id);
    refs(g.evidenceIds, 'evidence', g.id);
    const valid =
      g.type === 'Point'
        ? position(g.coordinates)
        : g.type === 'LineString'
          ? g.coordinates?.length >= 2 && g.coordinates.every(position)
          : g.type === 'Polygon'
            ? g.coordinates?.length > 0 && g.coordinates.every(ring)
            : g.type === 'MultiPolygon'
              ? g.coordinates?.length > 0 &&
                g.coordinates.every((p) => p.length && p.every(ring))
              : g.type === 'Orbital'
                ? !!g.epoch && Array.isArray(g.tle) && g.tle.length === 2
                : false;
    if (!valid) fail(`${g.id}: invalid geometry`);
    const t = groups.times.find((t) => t.id === g.timeId);
    if (g.role === 'EVENT_TIME_OBSERVATION' && t?.basis === 'CURRENT_REFERENCE')
      fail(`${g.id}: current reference cannot be an event-time observation`);
  }
  for (const r of groups.relationships) {
    ref(r.from, null, r.id);
    ref(r.to, null, r.id);
    ref(r.timeId, 'times', r.id);
    refs(r.claimIds, 'claims', r.id);
    status(r);
    if (ids.get(r.to) === 'geometries') {
      const entity = groups.entities.find((e) => e.id === r.from);
      if (
        !entity ||
        !['country', 'facility', 'route', 'region', 'satellite'].includes(
          entity.type,
        )
      )
        fail(`${r.id}: non-spatial entity cannot directly own geometry`);
    }
  }
  if (errors.length)
    throw new Error(`Scenario validation failed:\n${errors.join('\n')}`);
  return data;
}

/** Build lookup tables only after validation. */
export function indexScenario(data) {
  validateScenario(data);
  return Object.fromEntries(
    collections.map((key) => [
      key,
      new Map(data[key].map((record) => [record.id, record])),
    ]),
  );
}

/** Select evidence without losing source context or duplicating shared sources. */
export function evidenceForClaims(data, claimIds) {
  const index = indexScenario(data);
  return [
    ...new Set(
      claimIds.flatMap((id) => index.claims.get(id)?.evidenceIds || []),
    ),
  ].map((id) => {
    const evidence = index.evidence.get(id);
    return {
      ...evidence,
      provenance: index.provenance.get(evidence.provenanceId),
    };
  });
}
