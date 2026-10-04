import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/trucheterie3d/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

// Writes a generated field into the scene's PRESETS as a hand-written
// preset would be: only what differs from the scene defaults.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (config.blobSeed == null) throw new Error('The generation has no seed.');
  const clean = String(name ?? '')
    .replace(/[^\w -]/gu, '')
    .trim();
  return appendPreset(rootDir, {
    base: 'BASE',
    declaration: 'export const PRESETS = {',
    file: path.join(
      'src',
      'components',
      'scenes',
      'WebGPU',
      'Trucheterie3D',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || sidecar.name || `Seed ${config.blobSeed}`),
    value: { ...presetFromConfig(config), blobSeed: config.blobSeed },
  });
}
