import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeKyivstar } from '../src/cyber/scenario.js';
import { normalizeColonial } from '../src/cyber/colonial.js';
import { validateScenario } from '../src/cyber/model.js';
import { addColonialSpatialContext } from '../src/cyber/spatial-context.js';
for (const [name, geography, normalize] of [
  ['colonial', 'united-states', normalizeColonial],
  ['kyivstar', 'ukraine', normalizeKyivstar],
]) {
  const feature = JSON.parse(
    readFileSync(
      new URL(`../public/cyber/${geography}.geojson`, import.meta.url),
      'utf8',
    ).replace(/^\uFEFF/, ''),
  );
  const data = normalize(feature.geometry);
  if (name === 'colonial') addColonialSpatialContext(data);
  const serialized = `${JSON.stringify(validateScenario(data), null, 2)}\n`;
  const output = new URL(`../public/cyber/${name}.json`, import.meta.url);
  if (process.argv.includes('--check')) {
    if (readFileSync(output, 'utf8') !== serialized)
      throw new Error(`${name} snapshot stale`);
  } else writeFileSync(output, serialized);
  console.log(`${name}: validated and reproducible`);
}
