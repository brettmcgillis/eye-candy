// Relative, not `@modules/networkTest`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/networkTest/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.pointSeed}`,
  presetFromConfig,
  requires: 'pointSeed',
  scene: 'NetworkTest',
};

export default function networkTestDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'network-test',
    tool: 'networkTest',
  });
}
