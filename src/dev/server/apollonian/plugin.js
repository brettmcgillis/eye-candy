// Relative, not `@modules/apollonian`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/apollonian/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'SAVED_BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || config.family,
  presetFromConfig,
  requires: 'family',
  scene: 'Apollonian',
};

export default function apollonianDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'apollonian',
    tool: 'apollonian',
  });
}
