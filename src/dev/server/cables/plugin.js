// Relative, not `@modules/cables`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/cables/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'SAVED_BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.fieldSeed}`,
  presetFromConfig,
  requires: 'layout',
  scene: 'Cables',
};

export default function cablesDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'cables',
    tool: 'cables',
  });
}
