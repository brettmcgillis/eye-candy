// Relative, not `@modules/hyperCubes`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/hyperCubes/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.rectSeed}`,
  presetFromConfig,
  requires: 'structure',
  scene: 'HyperCubes',
};

export default function hyperCubesDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'hyper-cubes',
    tool: 'hyperCubes',
  });
}
