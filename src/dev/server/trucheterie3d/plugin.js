// Relative, not `@modules/trucheterie3d`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/trucheterie3d/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.blobSeed}`,
  presetFromConfig,
  requires: 'blobSeed',
  scene: 'Trucheterie3D',
  value: (config) => ({
    ...presetFromConfig(config),
    blobSeed: config.blobSeed,
  }),
};

export default function trucheterie3dDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'trucheterie3d',
    tool: 'trucheterie3d',
  });
}
