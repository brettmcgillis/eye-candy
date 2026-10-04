import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/subdivision/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (!config.seed)
    throw new Error('The generation has no Subdivision config.');
  const clean = String(name ?? '')
    .replace(/[^\w -]/gu, '')
    .trim();
  return appendPreset(rootDir, {
    declaration: 'export const PRESETS = {',
    file: path.join(
      'src',
      'components',
      'scenes',
      'WebGPU',
      'Subdivision',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || `Seed ${config.seed}`),
    value: presetFromConfig(config),
  });
}
