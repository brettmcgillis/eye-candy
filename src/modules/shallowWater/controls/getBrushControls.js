import { folder } from 'leva';

// Sculpting is opt-in because a stroke and an orbit are the same gesture: with
// this off the pointer belongs to the camera, and only with it on does the
// domain start catching drags.
export const BRUSH_MODES = ['Deposit', 'Scour', 'Push Ground', 'Push Water'];

export default function getBrushControls(p) {
  return folder(
    {
      brushEnabled: { label: 'Sculpt', value: p.brushEnabled },
      brushMode: {
        label: 'Tool',
        value: p.brushMode,
        options: BRUSH_MODES,
      },
      brushRadius: {
        label: 'Brush Size',
        value: p.brushRadius,
        min: 0.3,
        max: 12,
        step: 0.1,
      },
      brushStrength: {
        label: 'Brush Force',
        value: p.brushStrength,
        min: 0.05,
        max: 8,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}
