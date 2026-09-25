/** Transparent triage rules, not a causal model or independent-provider verification. */
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const usable = (check) =>
  check.status === 'available' &&
  check.stale === false &&
  ['lower', 'similar', 'higher'].includes(check.comparison);

export function assessInvestigation({
  subject,
  signalEvidence = null,
  relationships = [],
  previous = null,
} = {}) {
  const label = subject?.label || subject?.name || 'Selected area';
  const subjectId = subject?.id || subject?.countryCode || label;
  const checks = (signalEvidence?.checks || []).map((check) => ({
    ...check,
    sourceUrl: safeUrl(check.sourceUrl),
    queryUrl: safeUrl(check.queryUrl),
    usable: usable(check),
    explanation: check.stale
      ? 'Latest measurement is stale; it cannot establish recent agreement.'
      : check.status === 'error'
        ? 'The source check failed. This is missing evidence, not evidence of recovery.'
        : check.status === 'missing' || check.comparison === 'insufficient'
          ? 'Insufficient measurements for the stated comparison window.'
          : check.comparison === 'lower'
            ? 'Recent measurements are below this signal’s comparison baseline.'
            : 'This signal does not reproduce a drop in the recent comparison window.',
  }));
  // Explicit method IDs prevent duplicate copies of one check from corroborating it.
  const methods = ['bgp', 'ping-slash24'].map((id) =>
    checks.find((check) => check.id === id && check.usable),
  );
  const complete = methods.every(Boolean);
  const lower = methods.filter((check) => check?.comparison === 'lower').length;
  let verdict = 'pending';
  let headline = `${label}: a detection is a lead, not an explanation.`;
  if (signalEvidence) {
    if (!complete) {
      verdict = 'inconclusive';
      headline = `${label}: there is not enough fresh evidence to compare both methods.`;
    } else if (lower === 2) {
      verdict = 'corroborated';
      headline = `${label}: routing and active probing both show a recent drop.`;
    } else if (lower === 1) {
      verdict = 'mixed';
      headline = `${label}: the two measurement methods disagree about a recent drop.`;
    } else {
      verdict = 'not-reproduced';
      headline = `${label}: neither method reproduces a drop in the recent window.`;
    }
  }
  const established = [];
  if (subject?.events?.length)
    established.push(
      'IODA reported one or more detection intervals for this country. A detection does not establish nationwide impact.',
    );
  if (verdict === 'corroborated')
    established.push(
      'Two different IODA measurement methods show lower recent values against their stated baselines.',
    );
  if (verdict === 'mixed')
    established.push(
      'A drop in one method is not corroborated by the other in this comparison window.',
    );
  if (verdict === 'not-reproduced')
    established.push(
      'The recent baseline comparison does not reproduce the detection. This does not disprove an earlier disruption or prove recovery.',
    );
  const physical = relationships.filter((item) => item.kind === 'physical');
  const hypotheses = relationships.filter(
    (item) => item.kind === 'hypothesis' && item.state === 'INFERRED',
  );
  const onsets = (subject?.events || [])
    .map((event) => event.from)
    .filter(Number.isFinite);
  const timedPhysical = physical
    .map((item) => ({
      label: item.label,
      at: Date.parse(item.provenance?.[0]?.time),
    }))
    .filter((item) => Number.isFinite(item.at));
  const laterPhysical = onsets.length
    ? timedPhysical.filter((item) => item.at > Math.max(...onsets) * 1000)
    : [];
  const physicalAssessment = {
    status: hypotheses.length ? 'unconfirmed' : 'unestablished',
    explanation: hypotheses.length
      ? 'A physical exposure screening rule matched. Timing and proximity are a reason to check, not evidence that this caused connectivity loss.'
      : physical.length
        ? 'Physical observations provide geographic context. No causal relationship is established.'
        : 'No relevant physical observations were returned. Coverage may be incomplete; a physical cause has not been ruled out.',
    evidenceNeeded:
      'An operator incident account, affected network measurements and event-time service mapping.',
  };
  const unknowns = [
    'The number of affected users, affected ASNs and geographic extent of impact are not established.',
    'Both measurement methods come from IODA; this is not independent-provider confirmation.',
    'Recent-window comparisons may miss short events or events outside that window.',
    'Current cable and facility references do not establish event-time dependencies or a fault.',
    physicalAssessment.explanation,
  ];
  if (laterPhysical.length)
    established.push(
      `${laterPhysical.map((item) => item.label || 'Physical observation').join(', ')} occurred after the listed detection onsets and cannot explain their onset. This does not exclude other causes or later effects.`,
    );
  if (!complete && signalEvidence)
    unknowns.push(
      'Missing, failed or stale checks cannot confirm or reject a disruption.',
    );
  const nextCheck =
    verdict === 'pending'
      ? {
          action: 'verify',
          label: 'Compare routing and active probing',
          reason:
            'Check whether two measurement methods support the same recent change.',
        }
      : verdict === 'inconclusive'
        ? {
            action: 'verify',
            label: 'Retry the missing or stale measurements',
            reason: 'Resolve the evidence gap before interpreting agreement.',
          }
        : {
            action: 'sources',
            label: 'Inspect the detection interval at the source',
            reason:
              verdict === 'mixed' || verdict === 'not-reproduced'
                ? 'Compare the actual detection interval with this recent window; different timing or method sensitivity can explain disagreement.'
                : 'Check event timing and seek an operator account before naming a cause.',
          };
  const citations = [
    { label: 'IODA detection', url: safeUrl(subject?.provenance?.url) },
    ...checks.map((check) => ({
      label: check.label || check.id,
      url: check.sourceUrl || check.queryUrl,
    })),
    ...relationships
      .flatMap((item) => item.provenance || [])
      .map((source) => ({
        label: source.label || 'Source',
        url: safeUrl(source.url),
      })),
  ].filter(
    (source, index, all) =>
      source.url &&
      all.findIndex((other) => other.url === source.url) === index,
  );
  const evidenceKey = JSON.stringify(
    checks.map((check) => [
      check.id,
      check.status,
      check.stale,
      check.comparison,
      check.latestSampleAt,
      check.baseline,
      check.recent,
    ]),
  );
  const revision =
    previous &&
    previous.subjectId === subjectId &&
    previous.verdict !== 'pending' &&
    previous.verdict !== verdict &&
    previous.evidenceKey !== evidenceKey
      ? {
          before: previous.headline,
          after: headline,
          reason:
            'New measurement evidence changed the assessment under the same published rules.',
        }
      : null;
  return {
    subjectId,
    label,
    headline,
    verdict,
    checks,
    revision,
    nextCheck,
    established,
    unknowns,
    physical: physicalAssessment,
    citations,
    evidenceKey,
    retrievedAt: signalEvidence?.retrievedAt || null,
    window: signalEvidence?.window || null,
    method:
      'Compare each method’s final two-hour median with the preceding 22-hour baseline. A decrease of at least 5% is a local descriptive screening rule, not an IODA alert threshold, severity or confidence. Require fresh, usable BGP and active-probing checks before assessing agreement. Both methods are from IODA. This is triage, not a causal conclusion.',
  };
}

/** A portable conclusion with its limits, not a generated incident report. */
export function serializeInvestigation(input) {
  const assessment = input.investigation || input;
  const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ');
  const lines = [
    `# ${clean(assessment.label)} — evidence check`,
    '',
    clean(assessment.headline),
    '',
    '## Established',
    ...assessment.established.map((item) => `- ${clean(item)}`),
    '',
    '## Still unknown',
    ...assessment.unknowns.map((item) => `- ${clean(item)}`),
    '',
    `Next check: ${clean(assessment.nextCheck.label)}. ${clean(assessment.nextCheck.reason)}`,
    '',
    '## Sources',
    ...assessment.citations.map(
      (source) => `- ${clean(source.label)}: ${source.url}`,
    ),
    '',
    `Method: ${clean(assessment.method)}`,
  ];
  if (assessment.retrievedAt)
    lines.push(`Retrieved: ${new Date(assessment.retrievedAt).toISOString()}`);
  if (assessment.window)
    lines.push(
      `Comparison window: ${new Date(assessment.window.from * 1000).toISOString()} – ${new Date(assessment.window.until * 1000).toISOString()}`,
    );
  if (assessment.revision)
    lines.push(
      '',
      `Revised from: ${clean(assessment.revision.before)}`,
      clean(assessment.revision.reason),
    );
  return lines.join('\n');
}
