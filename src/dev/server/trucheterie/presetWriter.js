import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/trucheterieBlob/renderOptions.mjs';
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

// Writes a generated field into the scene's PRESETS as a hand-written preset
// would be: only what differs from the scene defaults. gridMode isn't a blob
// render option (it never varies here), so it is added explicitly — a
// preset written by this tool would otherwise land on whatever gridMode the
// scene happens to default to.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (!config.blobSeed) throw new Error('The generation has no field config.');
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
      'Trucheterie',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(clean || `Seed ${config.blobSeed}`),
    value: { gridMode: 'field', ...presetFromConfig(config) },
  });
}
