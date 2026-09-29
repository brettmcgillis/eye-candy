import path from 'node:path';

import {
  configFrom,
  presetFromConfig,
} from '../../../modules/subdivision/renderOptions.mjs';
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
