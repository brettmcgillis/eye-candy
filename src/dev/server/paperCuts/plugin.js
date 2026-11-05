import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/paperCuts/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

export default function paperCutsDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: 'paper-cuts',
    tool: 'paperCuts',
    writePreset(rootDir, { name, sidecar }) {
      const config = configFrom(sidecar);
      if (!config.generationSeed)
        throw new Error('The generation has no seed.');
      return appendPreset(rootDir, {
        base: 'SAVED_BASE',
        declaration: 'export const FOLDED_FRAME_PRESETS = {',
        file: 'src/components/scenes/WebGL/PaperCuts/presets/presets.js',
        nameFor: uniqueName(
          String(name || sidecar.name || `Paper ${config.generationSeed}`)
            .replace(/[^\w -]/gu, '')
            .trim()
        ),
        value: { ...presetFromConfig(config), frame: 'generated' },
      });
    },
  });
}
