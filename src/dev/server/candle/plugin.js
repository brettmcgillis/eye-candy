// Relative, not `@modules/candle`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/candle/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Candle ${config.formSeed}`,
  presetFromConfig,
  requires: 'flame',
  scene: 'BurningAtBothEnds',
};

export default function candleDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'candle',
    tool: 'candle',
  });
}
