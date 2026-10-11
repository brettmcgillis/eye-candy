// Relative, not `@modules/fungi`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/fungi/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'SCENE_DEFAULTS',
  configFrom,
  name: (config) => `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'seed',
  scene: 'Fungi',
};

export default function fungiDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'fungi',
    tool: 'fungi',
  });
}
