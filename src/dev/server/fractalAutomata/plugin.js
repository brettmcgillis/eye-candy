// Relative, not `@modules/fractalAutomata`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/fractalAutomata/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'level',
  scene: 'FractalAutomata',
};

export default function fractalAutomataDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'fractal-automata',
    tool: 'fractalAutomata',
  });
}
