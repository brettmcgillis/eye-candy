// Relative, not `@modules/subdivisionRelief`: this runs inside Vite's config
// loader, which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/subdivisionRelief/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';
import sourceImageRoutes from '../renderJobs/sourceImages';

const preset = {
  configFrom,
  name: (config) => `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'seed',
  scene: 'SubdivisionRelief',
};

// Source images are Subdivision's own uploads, so either workbench sees both.
export default function subdivisionReliefDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    routes: sourceImageRoutes('images/subdivision-sources'),
    slug: 'subdivision-relief',
    tool: 'subdivisionRelief',
  });
}
