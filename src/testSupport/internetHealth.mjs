import { normalizeInternetHealth } from '../layers/internetHealth/model.js';
export const countries = {
  features: [
    {
      properties: {
        iso2: 'AA',
        name: 'Fixture country',
        labelLon: 1,
        labelLat: 2,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [3, 0],
            [3, 3],
            [0, 0],
          ],
        ],
      },
    },
  ],
};
export const options = {
  from: 1000,
  until: 2000,
  retrievedAt: 2000000,
  limit: 100,
};
export const event = {
  entity: { code: 'AA', name: 'Fixture country', type: 'country' },
  from: 1200,
  until: 2000,
  score: 12,
  datasource: 'ping-slash24',
  method: 'median',
};
export const snapshot = () =>
  normalizeInternetHealth({ data: [event] }, countries, options);
