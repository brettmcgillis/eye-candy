import path from 'node:path';

import appendPreset from '../renderJobs/presetFile';

// The names are three-digit strings in order, so the next one is the highest
// plus one. Gaps are left alone: filling a hole would point an old link at a
// new picture.
function nextPresetName(source) {
  const names = [...source.matchAll(/^ {2}'(\d+)': \{$/gmu)].map(([, name]) =>
    Number(name)
  );
  const next = names.length > 0 ? Math.max(...names) + 1 : 1;
  return String(next).padStart(3, '0');
}

// Promotes a generated still into a preset the 3D scene can open — the one
// direction the dev tool writes toward the scene.
export default function writeScenePreset(rootDir, preset) {
  return appendPreset(rootDir, {
    declaration: 'export const PRESETS = {',
    file: path.join(
      'src',
      'components',
      'scenes',
      'WebGPU',
      'Rorschach',
      'presets',
      'presets.js'
    ),
    nameFor: nextPresetName,
    value: preset,
  });
}
