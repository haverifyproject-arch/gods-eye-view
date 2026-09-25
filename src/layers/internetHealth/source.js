import { IODA_BASE_URL, normalizeInternetHealth } from './model.js';

/** A fresh, bounded public API query; provider payloads are never bundled or persisted. */
export function createInternetHealthSource({
  fetchImpl = (...args) => fetch(...args),
  now = Date.now,
  countriesUrl = '/reality/countries.geojson',
  limit = 100,
} = {}) {
  let countries = null;
  return {
    async getSnapshot({ signal } = {}) {
      signal?.throwIfAborted();
      const retrievedAt = now();
      const until = Math.floor(retrievedAt / 1000);
      const from = until - 86400;
      const url = new URL(IODA_BASE_URL);
      url.search = new URLSearchParams({
        from: String(from),
        until: String(until),
        entityType: 'country',
        limit: String(limit),
        orderBy: 'score/desc',
        format: 'ioda',
        ignoreMethods: 'gtr.*',
      });
      const read = async (target) => {
        const response = await fetchImpl(target, { signal });
        if (!response.ok)
          throw new Error(`Internet Health source HTTP ${response.status}`);
        const body = await response.json();
        signal?.throwIfAborted();
        return body;
      };
      const [payload, boundaries] = await Promise.all([
        read(url.href),
        countries || read(countriesUrl),
      ]);
      signal?.throwIfAborted();
      const snapshot = normalizeInternetHealth(payload, boundaries, {
        from,
        until,
        retrievedAt,
        queryUrl: url.href,
        limit,
      });
      countries = boundaries;
      return snapshot;
    },
  };
}
