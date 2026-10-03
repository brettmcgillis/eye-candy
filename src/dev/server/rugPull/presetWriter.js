import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/rugPull/renderOptions.mjs';
import appendPreset from '../renderJobs/presetFile';

const KEY = /^ {2}(?:'([^']+)'|"([^"]+)"|(\w+)): \{$/gmu;

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

// Writes a woven rug into the scene's SNAPSHOTS as a hand-written snapshot
// would be: only what differs from the scene defaults.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (config.design == null)
    throw new Error('The generation has no rug config.');
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
      'RugPull',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || sidecar.name || `Rug ${config.rugSeed}`),
    value: presetFromConfig(config),
  });
}
