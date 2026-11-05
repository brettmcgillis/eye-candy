import { buildCables } from '@modules/cables';

// Laying a few hundred cables takes long enough to drop frames, so the
// scene lays them here.
// eslint-disable-next-line no-restricted-globals
self.onmessage = ({ data: { config, stops } }) => {
  const generation = buildCables(config, { stops });
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(
    generation,
    generation.cables.map(({ points }) => points.buffer)
  );
};
