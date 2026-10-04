import path from 'node:path';

import {
  configFrom,
  snapshotForStage,
} from '../../../modules/brutalist/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

const SCENES = { forest: 'Brutalist', maquette: 'BrutalistMaquette' };

// Writes a generation into the PRESETS of the scene for the stage it was
// rendered on, as a hand-written preset would be: only what differs.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (config.family == null) {
    throw new Error('The generation has no structure config.');
  }
  const stage = sidecar.render?.stage === 'maquette' ? 'maquette' : 'forest';
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
      SCENES[stage],
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || sidecar.name || `Seed ${config.formSeed}`),
    value: snapshotForStage(config, stage),
  }).then((preset) => ({ ...preset, scene: SCENES[stage] }));
}
