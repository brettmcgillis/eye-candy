import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/rugPull/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

// Writes a woven rug into the scene's PRESETS as a hand-written snapshot
// would be: only what differs from the scene defaults.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (config.design == null)
    throw new Error('The generation has no rug config.');
  const clean = String(name ?? '')
    .replace(/[^\w -]/gu, '')
    .trim();
  return appendPreset(rootDir, {
    base: 'FLOOR',
    declaration: 'export const PRESETS = {',
    file: path.join(
      'src',
      'components',
      'scenes',
      'WebGPU',
      'RugPull',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || sidecar.name || `Rug ${config.rugSeed}`),
    value: presetFromConfig(config),
  });
}
