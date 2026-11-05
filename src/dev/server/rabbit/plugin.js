// Relative, not `@modules/rabbit`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/rabbit/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'SAVED_BASE',
  configFrom,
  name: (config, sidecar) =>
    sidecar.name ||
    (config.volley === 'rolled'
      ? `Volley ${config.volleySeed}`
      : 'Painting variation'),
  presetFromConfig,
  requires: 'volley',
  scene: 'StayHunted',
};

export default function rabbitDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'rabbit',
    tool: 'rabbit',
  });
}
