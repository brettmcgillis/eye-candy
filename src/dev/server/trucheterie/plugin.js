// Relative, not `@modules/trucheterieBlob`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/trucheterieBlob/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  configFrom,
  name: (config) => `Seed ${config.blobSeed}`,
  presetFromConfig,
  requires: 'blobSeed',
  scene: 'Trucheterie',
  value: (config) => ({ gridMode: 'field', ...presetFromConfig(config) }),
};

export default function trucheterieDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'trucheterie',
    tool: 'trucheterie',
  });
}
