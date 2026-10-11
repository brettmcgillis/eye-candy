// Relative, not `@modules/pushComesToShove`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/pushComesToShove/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.holeSeed}`,
  presetFromConfig,
  requires: 'holeSeed',
  scene: 'PushComesToShove',
};

export default function pushComesToShoveDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'push-comes-to-shove',
    tool: 'pushComesToShove',
  });
}
