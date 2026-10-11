// Relative, not `@modules/kumiko`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/kumiko/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'SCENE_DEFAULTS',
  configFrom,
  name: (config) => `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'seed',
  scene: 'Kumiko',
};

export default function kumikoDevPlugin() {
  return createSchemaToolPlugin({
    kinds: ['still'],
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'kumiko',
    tool: 'kumiko',
  });
}
