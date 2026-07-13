import { folder } from 'leva';

// Streamline controls for FieldLines. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9). Attractor/step/speed are read from the
// Swarm folder — field lines trace the same vector field the particles do.
export default function getFieldLineControls(p = {}) {
  return folder({
    showFieldLines: {
      label: 'Show Field Lines',
      value: p.showFieldLines ?? true,
    },
    fieldLineCount: {
      label: 'Line Count',
      value: p.fieldLineCount ?? 10,
      min: 1,
      max: 40,
      step: 1,
    },
    fieldLineColor: {
      label: 'Line Color',
      value: p.fieldLineColor ?? '#8fe3ff',
    },
    fieldLineOpacity: {
      label: 'Line Opacity',
      value: p.fieldLineOpacity ?? 0.8,
      min: 0,
      max: 1,
      step: 0.01,
    },
    fieldLineFade: {
      label: 'Trail Fade (s)',
      value: p.fieldLineFade ?? 3,
      min: 0.2,
      max: 10,
      step: 0.1,
    },
  });
}
