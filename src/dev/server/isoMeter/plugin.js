// Relative, not `@modules/isoMeter`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/isoMeter/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config) => `${config.piece} ${String(config.seed).slice(0, 10)}`,
  presetFromConfig,
  requires: 'seed',
  scene: 'IsoMeter',
};

export default function isoMeterDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'iso-meter',
    tool: 'isoMeter',
  });
}
