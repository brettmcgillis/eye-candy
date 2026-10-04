import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/apollian/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

// Writes a generated object into the scene's PRESETS as a hand-written
// preset would be: only what differs from the scene defaults.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (config.family == null) throw new Error('The generation has no form.');
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
      'Apollian',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || sidecar.name || config.family),
    value: presetFromConfig(config),
  });
}
