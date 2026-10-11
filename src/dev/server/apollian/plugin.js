// Relative, not `@modules/apollian`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/apollian/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || config.family,
  presetFromConfig,
  requires: 'family',
  scene: 'Apollian',
};

export default function apollianDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'apollian',
    tool: 'apollian',
  });
}
