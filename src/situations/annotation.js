/** Resolve only declared geography; unsupported records cannot acquire invented anchors. */
export function resolveAnnotation(runtime, id) {
  const context = runtime.getContext();
  const record = context.records.find((item) => item.id === id);
  if (!record)
    throw new Error('Choose a record visible at this time and evidence lens');
  const evidence = runtime.inspect(id);
  if (!evidence.sources.length)
    throw new Error('This record has no source-backed annotation');
  const anchorRecord = record.anchorId
    ? runtime.inspect(record.anchorId).record
    : record;
  const geometry = anchorRecord.geometry;
  const coordinates =
    geometry?.type === 'Point'
      ? geometry.coordinates
      : geometry?.type === 'DistanceLocus'
        ? geometry.center
        : null;
  if (!coordinates)
    throw new Error('This record has no declared geographic anchor');
  return {
    id: record.id,
    label: record.label,
    status: record.status,
    coordinates,
    basis: record.spatialDescription || geometry.description,
    publishers: [
      ...new Set(evidence.sources.map((source) => source.publisher)),
    ],
  };
}
