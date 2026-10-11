// Relative, not `@modules/isoLines`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/isoLines/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.fieldSeed}`,
  presetFromConfig,
  requires: 'fieldSeed',
  scene: 'IsoLines',
};

export default function isoLinesDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'iso-lines',
    tool: 'isoLines',
  });
}
