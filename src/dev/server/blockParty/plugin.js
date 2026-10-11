// Relative, not `@modules/blockParty`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/blockParty/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'PAPER',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'seed',
  scene: 'BlockParty',
};

export default function blockPartyDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'block-party',
    tool: 'blockParty',
  });
}
