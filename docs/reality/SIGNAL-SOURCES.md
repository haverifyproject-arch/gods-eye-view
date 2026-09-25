# Live signal comparison

`src/reality/signalEvidence.js` reads two measurement methods from **one publisher, IODA / Georgia Tech**. They are not independent providers. BGP measures visible prefixes; active probing counts responsive /24 blocks. Neither is a population-offline percentage or proof of a physical cause.

## Verified production access

On 25 September 2026 at approximately 17:24–17:26 UTC, both unauthenticated public requests returned HTTP 200:

- `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country/PY?from=1790270632&until=1790357032&datasource=bgp`
- `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country/PY?from=1790270632&until=1790357032&datasource=ping-slash24`

Both echoed `Access-Control-Allow-Origin: http://127.0.0.1:4180`. Direct browser requests require neither credentials nor a Vite proxy. Retained probe payloads are ignored `output/signal-verified-*.json`, not product fixtures. A second real call through the implemented adapter returned `neither-lower`: BGP recent median 4,634 versus baseline 4,634; probing 1,807 versus 1,783. This example is verification, not a guaranteed current finding.

The [official IODA API documentation](https://api.ioda.inetintel.cc.gatech.edu/v2/) describes both methods and their raw-series schema. Samples arrive in nested `data` arrays with `from`, `step` and `values`. BGP was spaced at 300 seconds; probing at 600 seconds. Nulls at the end were observed and are kept as missing values. In the adapter probe, newest BGP lag was approximately 31 minutes and probing 16 minutes. These are observed latencies, not SLAs.

## Transparent local comparison

Each explicit inspection makes two bounded ephemeral reads over the latest 24 hours. The final two hours are compared with the preceding 22 hours using medians. The application calls a median at least 5% below its baseline `lower`, at least 5% above `higher`, otherwise `similar`. This is a descriptive application rule, **not IODA's anomaly detector, statistical significance, severity or confidence**.

Both windows require at least 50% valid sample coverage, plus at least six baseline and three recent observations; a zero baseline cannot yield a percentage. Newest samples older than 90 minutes make the comparison insufficient. Null, negative, string and nonfinite values do not become zeros. There is no interpolation. The raw observation is OBSERVED; median comparison is DERIVED. The aggregate agreement is `both-lower`, `mixed`, `neither-lower`, or `insufficient`.

This short baseline does not model daily/weekly seasonality and can already include disruption. A stable recent comparison does not disprove an earlier event or establish recovery. Comparing two country aggregates cannot establish all networks agree. Errors and empty/missing series remain visible rather than yielding a healthy conclusion. The result exposes exact query URLs, source page, measurement times, retrieval time, coverage, policy and copyright.

Each method has a 20-second deadline covering both fetch and body parsing; a timeout becomes an error check while external cancellation rejects the inspection. The adapter supports cancellation, does not retry or poll, and does not bundle or persist source payloads. Callers should suppress overlapping inspections and avoid repeated requests on every frame or selection change. Public API access is technically verified, but redistribution/commercial rights remain unresolved: responses state Georgia Tech Research Corporation copyright, All Rights Reserved. Preserve attribution separately from MIT code; see [the broader source evaluation](./INTERNET-SOURCES.md).

## Integration contract

`createSignalEvidenceSource({fetchImpl, now}).inspect(countryCode, {signal})` returns `{countryCode, retrievedAt, window, publisher, independentProviders:false, policy, checks, agreement}`. Check IDs are `bgp` and `ping-slash24`. Each has `status`, `samples`, `baseline`, `recent`, `coverage`, `comparison`, `changeFraction`, `latestSampleAt`, `lagSeconds`, `stale`, `sourceUrl`, `queryUrl`, and provenance. Epoch window/sample times are seconds; retrieval times are milliseconds. Individual HTTP failures yield an error check while preserving the other method; cancellation rejects the whole inspection.
