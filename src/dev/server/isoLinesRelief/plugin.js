// Relative, not `@modules/isoLinesRelief`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/isoLinesRelief/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.fieldSeed}`,
  presetFromConfig,
  requires: 'fieldSeed',
  scene: 'IsoLinesRelief',
};

export default function isoLinesReliefDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'iso-lines-relief',
    tool: 'isoLinesRelief',
  });
}
