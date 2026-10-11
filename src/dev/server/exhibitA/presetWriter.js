import path from 'node:path';

import {
  EXHIBIT_LABELS,
  configFrom,
  presetFromConfig,
} from '../../../modules/exhibitA/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';

const LABELS = new Set(Object.values(EXHIBIT_LABELS));

// Writes a generated exhibit into the scene's PRESETS as a hand-written
// preset would be: only what differs from the scene defaults. The scene's
// one-per-exhibit presets are built by a loop, so a saved one goes into the
// literal below it, and may not reuse an exhibit's own name.
export default function writeScenePreset(rootDir, { name, sidecar }) {
  const config = configFrom(sidecar);
  if (config.family == null) throw new Error('The generation has no form.');
  const clean = String(name ?? '')
    .replace(/[^\w -]/gu, '')
    .trim();
  const requested = clean || sidecar.name || config.family;
  return appendPreset(rootDir, {
    base: 'BASE',
    declaration: 'Object.assign(PRESETS, {',
    file: path.join(
      'src',
      'components',
      'scenes',
      'WebGPU',
      'ExhibitA',
      'presets',
      'presets.js'
    ),
    nameFor: uniqueName(LABELS.has(requested) ? `${requested} 2` : requested),
    value: presetFromConfig(config),
  });
}
