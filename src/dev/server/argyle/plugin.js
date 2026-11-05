import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/argyle/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

export default function argyleDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: 'argyle',
    tool: 'argyle',
    preset: {
      base: 'SAVED_BASE',
      configFrom,
      presetFromConfig,
      name: (config, sidecar) => sidecar.name || `Seed ${config.seed}`,
      requires: 'pattern',
      scene: 'Argyle',
    },
  });
}
