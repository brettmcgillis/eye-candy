// Relative, not `@modules/rugPull`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/rugPull/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'FLOOR',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Rug ${config.rugSeed}`,
  presetFromConfig,
  requires: 'design',
  scene: 'RugPull',
};

export default function rugPullDevPlugin() {
  return createSchemaToolPlugin({
    kinds: ['still'],
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'rug-pull',
    tool: 'rugPull',
  });
}
