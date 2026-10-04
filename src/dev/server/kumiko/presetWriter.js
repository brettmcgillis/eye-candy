import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/kumiko/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

// Writes a generated panel into the scene's PRESETS as a hand-written
// preset would be: only what differs from the scene defaults.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (!config.seed) throw new Error('The generation has no panel config.');
  const clean = String(name ?? '')
    .replace(/[^\w -]/gu, '')
    .trim();
  return appendPreset(rootDir, {
    base: 'SCENE_DEFAULTS',
    declaration: 'export const PRESETS = {',
    file: path.join(
      'src',
      'components',
      'scenes',
      'WebGPU',
      'Kumiko',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || `Seed ${config.seed}`),
    value: presetFromConfig(config),
  });
}
