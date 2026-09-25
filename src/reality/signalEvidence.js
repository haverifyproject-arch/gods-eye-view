const BASE = 'https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country/';
const METHODS = [
  { id: 'bgp', label: 'BGP route visibility', unit: 'visible prefixes' },
  {
    id: 'ping-slash24',
    label: 'Active probing',
    unit: 'responsive /24 blocks',
  },
];

export const SIGNAL_COMPARISON_POLICY = Object.freeze({
  windowSeconds: 86400,
  recentSeconds: 7200,
  minimumCoverage: 0.5,
  changeThreshold: 0.05,
  staleSeconds: 5400,
  description:
    'Compare the last two hours with the preceding 22 hours using medians. A 5% change is a descriptive local rule, not an IODA outage detector or confidence score.',
});

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(samples, from, until, step) {
  const selected = samples.filter(
    (sample) => sample.at >= from && sample.at < until,
  );
  const values = selected
    .filter((sample) => sample.value !== null)
    .map((sample) => sample.value);
  const expected = Math.max(selected.length, Math.floor((until - from) / step));
  return {
    from,
    until,
    median: median(values),
    count: values.length,
    expected,
    coverage: expected ? Math.min(1, values.length / expected) : 0,
  };
}

export function normalizeSignalEvidence(
  payload,
  method,
  { countryCode, from, until, queryUrl, retrievedAt },
) {
  const definition = METHODS.find((entry) => entry.id === method);
  if (!definition) throw new Error('Unsupported measurement method');
  const series = (
    Array.isArray(payload?.data) ? payload.data.flat(2) : []
  ).filter(
    (entry) =>
      entry?.datasource === method &&
      entry.entityType === 'country' &&
      entry.entityCode === countryCode &&
      !entry.subtype,
  );
  const row = series.length === 1 ? series[0] : null;
  const validStep = Number.isFinite(row?.step) && row.step > 0;
  const samples =
    validStep && Number.isFinite(row?.from) && Array.isArray(row?.values)
      ? row.values
          .map((value, index) => ({
            at: row.from + index * row.step,
            value:
              typeof value === 'number' && Number.isFinite(value) && value >= 0
                ? value
                : null,
          }))
          .filter((sample) => sample.at >= from && sample.at < until)
      : [];
  const observed = samples.filter((sample) => sample.value !== null);
  const latestSampleAt = observed.at(-1)?.at ?? null;
  const lagSeconds =
    latestSampleAt === null
      ? null
      : Math.max(0, retrievedAt / 1000 - latestSampleAt);
  const stale =
    lagSeconds === null || lagSeconds > SIGNAL_COMPARISON_POLICY.staleSeconds;
  const boundary = until - SIGNAL_COMPARISON_POLICY.recentSeconds;
  const baseline = summarize(
    samples,
    from,
    boundary,
    validStep ? row.step : 300,
  );
  const recent = summarize(
    samples,
    boundary,
    until,
    validStep ? row.step : 300,
  );
  const sufficient =
    !stale &&
    baseline.count >= 6 &&
    recent.count >= 3 &&
    baseline.coverage >= SIGNAL_COMPARISON_POLICY.minimumCoverage &&
    recent.coverage >= SIGNAL_COMPARISON_POLICY.minimumCoverage &&
    baseline.median > 0;
  const changeFraction = sufficient
    ? (recent.median - baseline.median) / baseline.median
    : null;
  let comparison = 'insufficient';
  if (changeFraction !== null)
    comparison =
      changeFraction <= -0.05
        ? 'lower'
        : changeFraction >= 0.05
          ? 'higher'
          : 'similar';
  const total = baseline.expected + recent.expected;
  return {
    ...definition,
    status: observed.length ? 'available' : 'missing',
    evidenceStatus: 'OBSERVED',
    comparisonEvidenceStatus: 'DERIVED',
    samples,
    latestSampleAt,
    lagSeconds,
    stale,
    coverage: {
      valid: observed.length,
      total,
      fraction: total ? Math.min(1, observed.length / total) : 0,
    },
    baseline,
    recent,
    changeFraction,
    comparison,
    sourceUrl: `https://ioda.inetintel.cc.gatech.edu/country/${countryCode}?from=${from}&until=${until}`,
    queryUrl,
    retrievedAt,
    providerRespondedAt: payload?.metadata?.responseTime ?? null,
    copyright: payload?.copyright ?? null,
    limitation:
      'Country aggregate; does not identify affected people, networks, infrastructure or cause. Different methods from the same publisher.',
  };
}

async function readWithDeadline(fetchImpl, url, signal, timeoutMs) {
  signal?.throwIfAborted();
  const controller = new AbortController();
  let rejectDeadline;
  const deadline = new Promise((_, reject) => {
    rejectDeadline = reject;
  });
  const abort = (reason) => {
    controller.abort(reason);
    rejectDeadline(reason);
  };
  const onAbort = () => abort(signal.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => {
    const error = new Error('IODA measurement request timed out');
    error.name = 'TimeoutError';
    abort(error);
  }, timeoutMs);
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`IODA HTTP ${response.status}`);
        return response.json();
      })(),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Two bounded ephemeral reads. No credentials, persisted payloads, or demo samples. */
export function createSignalEvidenceSource({
  fetchImpl = (...args) => fetch(...args),
  now = Date.now,
  timeoutMs = 20000,
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error('A positive finite timeout is required');
  return {
    async inspect(countryCode, { signal } = {}) {
      const code = String(countryCode).toUpperCase();
      if (!/^[A-Z]{2}$/.test(code))
        throw new Error('A two-letter country code is required');
      signal?.throwIfAborted();
      const until = Math.floor(now() / 1000);
      const from = until - SIGNAL_COMPARISON_POLICY.windowSeconds;
      const checks = await Promise.all(
        METHODS.map(async (method) => {
          const url = new URL(`${BASE}${code}`);
          url.search = new URLSearchParams({
            from: String(from),
            until: String(until),
            datasource: method.id,
          });
          const provenance = {
            countryCode: code,
            from,
            until,
            queryUrl: url.href,
          };
          try {
            const payload = await readWithDeadline(
              fetchImpl,
              url.href,
              signal,
              timeoutMs,
            );
            signal?.throwIfAborted();
            if (payload?.error)
              throw new Error('IODA returned a measurement error');
            return normalizeSignalEvidence(payload, method.id, {
              ...provenance,
              retrievedAt: now(),
            });
          } catch (error) {
            signal?.throwIfAborted();
            return {
              ...normalizeSignalEvidence(null, method.id, {
                ...provenance,
                retrievedAt: now(),
              }),
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'Measurement request failed',
            };
          }
        }),
      );
      signal?.throwIfAborted();
      const usable = checks.every(
        (check) => check.comparison !== 'insufficient',
      );
      const lower = checks.filter(
        (check) => check.comparison === 'lower',
      ).length;
      return {
        countryCode: code,
        retrievedAt: now(),
        window: { from, until },
        publisher: 'IODA / Georgia Tech',
        independentProviders: false,
        policy: SIGNAL_COMPARISON_POLICY,
        checks,
        agreement: !usable
          ? 'insufficient'
          : lower === 2
            ? 'both-lower'
            : lower === 1
              ? 'mixed'
              : 'neither-lower',
      };
    },
  };
}
