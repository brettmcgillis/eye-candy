// Relative, not `@modules/controlPanel`: this runs inside Vite's config
// loader, which resolves no aliases.
import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/controlPanel/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

const preset = {
  base: 'SAVED_BASE',
  configFrom,
  name: (config, sidecar) => sidecar.name || `Seed ${config.seed}`,
  presetFromConfig,
  requires: 'layout',
  scene: 'ControlPanel',
};

export default function controlPanelDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    preset,
    slug: 'control-panel',
    tool: 'controlPanel',
  });
}
