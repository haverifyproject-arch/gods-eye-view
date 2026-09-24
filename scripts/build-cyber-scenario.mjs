import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeKyivstar } from '../src/cyber/scenario.js';
import { validateScenario } from '../src/cyber/model.js';

const input = new URL('../public/cyber/ukraine.geojson', import.meta.url);
const output = new URL('../public/cyber/kyivstar.json', import.meta.url);
const feature = JSON.parse(readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
const canonical = validateScenario(normalizeKyivstar(feature.geometry));
const serialized = `${JSON.stringify(canonical, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== serialized)
    throw new Error('Canonical snapshot is stale. Run npm run cyber:data.');
  console.log('Canonical Kyivstar snapshot is valid and reproducible.');
} else {
  writeFileSync(output, serialized);
  console.log('Wrote validated public/cyber/kyivstar.json');
}
