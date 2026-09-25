# Investigation reasoning evaluation

This release uses explicit deterministic triage rules. It does not ask an LLM to invent an explanation, claim an independent-provider consensus, or manufacture an impressive reversal. IODA BGP and active probing are different measurement methods from the same provider.

The reproducible evaluation is `src/reality/investigation.test.mjs`. Run `node --test src/reality/investigation.test.mjs` with the repository-supported Node version. The 16 checks passed during implementation. Inputs in this unit suite are deliberately synthetic counterexamples; they are not product data, historical evidence, or a live accuracy benchmark.

| Challenge                                             | Required outcome                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A detector flag, no measurements checked              | Pending lead; no outage confirmation                                                      |
| Both fresh methods lower                              | Corroborated measurement change; no nationwide-impact claim                               |
| One lower, one similar                                | Mixed evidence; explicitly state disagreement                                             |
| Neither lower                                         | Recent change not reproduced; do not erase an earlier event or assert recovery            |
| Missing, failed, stale, or insufficient check         | Inconclusive; retry is actionable                                                         |
| Freshness unspecified                                 | Inconclusive rather than optimistic interpretation                                        |
| Duplicate BGP records                                 | Cannot substitute for a second measurement method                                         |
| New evidence changes an assessed verdict              | Preserve actual previous conclusion and explain revision                                  |
| First check completes, or another country is selected | Do not manufacture a reversal                                                             |
| Repeated identical evidence                           | Do not manufacture a reversal                                                             |
| Physical screening hypothesis                         | Unconfirmed, with operator/service evidence still required                                |
| Physical observation after detection onset            | Reject that observation as an explanation of onset; retain uncertainty about other causes |
| Physical timestamps missing                           | Cannot reject physical explanations using nonexistent chronology                          |
| Exported takeaway                                     | Preserve method, uncertainty, provenance, comparison and retrieval times                  |

The local comparison rule describes median changes: baseline first 22 hours of a shared 24-hour window versus the final two hours, with at least a 5% decrease counted as lower. That is a transparent screening choice, not a validated alarm threshold, severity rating, or confidence score. Source adapter tests separately cover coverage and freshness requirements.

These tests establish rule behavior, not predictive accuracy. Live browser inspection must separately establish public data access, readable findings, useful world interaction and interruption. No outcome should be marketed as causal discovery without corroborating incident evidence.
