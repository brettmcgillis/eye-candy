// Relative, not `@modules/nestingBoxes`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/nestingBoxes/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'levels',
  scene: 'NestingBoxes',
};

export default function nestingBoxesDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'nesting-boxes',
    tool: 'nestingBoxes',
  });
}
