// Relative, not `@modules/exhibitA`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/exhibitA/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';
import writeScenePreset from './presetWriter';

export default function exhibitADevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    writePreset: writeScenePreset,
    slug: 'exhibit-a',
    tool: 'exhibitA',
  });
}
