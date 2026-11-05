// Relative, not `@modules/dumpsterFire`: this runs inside Vite's config
// loader, which resolves no aliases.
import path from 'node:path';

import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
  presetFromConfig,
} from '../../../modules/dumpsterFire/renderOptions.mjs';
import liveCaptureRoute from '../renderJobs/liveCapture';
import createRenderJobPlugin from '../renderJobs/plugin';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';
import { createSchemaJobService } from '../renderJobs/schemaTool';

const SLUG = 'dumpster-fire';
const PRESET_FILE = path.join(
  'src',
  'components',
  'scenes',
  'WebGL',
  'DumpsterFire',
  'presets',
  'index.js'
);

// Scene settings and their saved base are materialized together; render-only
// camera and mood settings remain on the generation's sidecar.
function writePreset(rootDir, { name: requested, sidecar }) {
  const config = configFrom(sidecar);
  const clean = String(requested ?? '')
    .replace(/[^\w -]/gu, '')
    .trim();
  return appendPreset(rootDir, {
    base: 'SAVED_BASE',
    declaration: 'export const PRESETS = {',
    file: PRESET_FILE,
    nameFor: uniqueName(clean || sidecar.name || 'Generated'),
    value: presetFromConfig(config),
  });
}

export default function dumpsterFireDevPlugin() {
  const service = createSchemaJobService({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: SLUG,
    tool: 'dumpsterFire',
  });
  return createRenderJobPlugin({
    routes: [
      {
        handler: async (rootDir, body) => ({
          preset: await writePreset(rootDir, body),
        }),
        method: 'POST',
        path: '/presets',
      },
      liveCaptureRoute({ service, slug: SLUG }),
    ],
    service,
    tool: 'dumpsterFire',
  });
}
