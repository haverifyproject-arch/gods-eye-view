// 2021 Census Gazetteer internal points, not pipeline terminal coordinates.
export function addColonialSpatialContext(data) {
  const places = [
    ['houston', 'Houston, Texas', '48', '4835000', -95.388806, 29.785743],
    ['linden', 'Linden, New Jersey', '34', '3440350', -74.23631, 40.627337],
  ];
  for (const [id, name, state, geoid, lon, lat] of places) {
    const limitation =
      'City reference point from Census INTPTLONG/INTPTLAT; not a terminal, incident location or measured impact.';
    data.provenance.push({
      id: `src-${id}`,
      publisher: 'U.S. Census Bureau',
      title: `2021 Gazetteer · ${name}`,
      url: `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2021_Gazetteer/2021_gaz_place_${state}.txt`,
      publishedAt: null,
      publicationLabel: '2021 geography edition',
      retrievedAt: '2026-09-24',
      locator: `GEOID ${geoid}; INTPTLONG, INTPTLAT`,
      summary: limitation,
      access: 'Public tab-delimited Gazetteer; exact row reviewed',
      rights: 'U.S. government geographic data; Census attribution retained.',
      transformation:
        'Select the city GEOID; retain its internal point as CURRENT_REFERENCE.',
    });
    data.evidence.push({
      id: `ev-${id}`,
      provenanceId: `src-${id}`,
      locator: `GEOID ${geoid}`,
      summary: `${name} internal point: ${lat}, ${lon}. ${limitation}`,
    });
    data.entities.push({
      id,
      type: 'region',
      name,
      description: `Reported pipeline endpoint city. ${limitation}`,
    });
    data.geometries.push({
      id: `geo-${id}`,
      type: 'Point',
      coordinates: [lon, lat],
      crs: 'EPSG:4326',
      timeId: 't-reference',
      evidenceIds: [`ev-${id}`],
      role: 'REFERENCE_CONTEXT',
    });
    data.claims.push({
      id: `c-${id}`,
      text: `${name} is a reported endpoint city; the marker locates the city only.`,
      status: 'REPORTED',
      subjects: [id, 'pipeline'],
      evidenceIds: ['ev-eia', `ev-${id}`],
      timeId: 't-reference',
      limitation,
    });
    data.relationships.push(
      {
        id: `r-${id}`,
        from: 'pipeline',
        to: id,
        predicate: 'reported endpoint city',
        status: 'REPORTED',
        claimIds: [`c-${id}`],
        timeId: 't-disruption',
      },
      {
        id: `r-geo-${id}`,
        from: id,
        to: `geo-${id}`,
        predicate: 'reference internal point',
        status: 'REPORTED',
        claimIds: [`c-${id}`],
        timeId: 't-reference',
      },
    );
  }
  return data;
}
