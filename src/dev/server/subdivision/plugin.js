// Relative, not `@modules/subdivision`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/subdivision/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';
import sourceImageRoutes from '../renderJobs/sourceImages';

const preset = {
  configFrom,
  name: (config) => `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'seed',
  scene: 'Subdivision',
};

export default function subdivisionDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    routes: sourceImageRoutes('images/subdivision-sources'),
    slug: 'subdivision',
    tool: 'subdivision',
  });
}
