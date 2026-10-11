// Relative, not `@modules/brutalist`: this runs inside Vite's config loader,
// which resolves no aliases.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/brutalist/renderOptions.mjs';
import createSchemaToolPlugin from '../renderJobs/schemaTool';
import writeScenePreset from './presetWriter';

export default function brutalistDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    writePreset: writeScenePreset,
    slug: 'brutalist',
    tool: 'brutalist',
  });
}
