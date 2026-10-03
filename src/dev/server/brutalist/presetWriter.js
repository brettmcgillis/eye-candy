import path from 'node:path';

import {
  configFrom,
  snapshotForStage,
} from '../../../modules/brutalist/renderOptions.mjs';
import appendPreset from '../renderJobs/presetFile';

const KEY = /^ {2}(?:'([^']+)'|"([^"]+)"|(\w+)): \{$/gmu;
const SCENES = { forest: 'Brutalist', maquette: 'BrutalistMaquette' };

function uniqueName(requested) {
  return (source) => {
    const taken = new Set(
      [...source.matchAll(KEY)].map(([, a, b, c]) => a ?? b ?? c)
    );
    let name = requested;
    for (let n = 2; taken.has(name); n += 1) name = `${requested} ${n}`;
    return name;
  };
}

// Writes a generation into the SNAPSHOTS of the scene for the stage it was
// rendered on, as a hand-written snapshot would be: only what differs.
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
    declaration: 'const SNAPSHOTS = {',
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
