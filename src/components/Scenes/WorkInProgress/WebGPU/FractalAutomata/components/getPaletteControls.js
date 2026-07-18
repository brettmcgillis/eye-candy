import { folder } from 'leva';

import { COLOR_MODES } from '../utils/paletteNode';

// Palette controls, keys 1:1 with presets/presets.js. `colorMode` picks
// which per-cell scalar drives the 3-stop gradient (see utils/paletteNode.js):
// growth order/age, height, distance from the structure's core, or CA state/tier.
export default function getPaletteControls(p = {}) {
  return folder(
    {
      colorMode: {
        label: 'Color Mode',
        value: p.colorMode ?? 'growthOrder',
        options: COLOR_MODES,
      },
      paletteStart: {
        label: 'Color Start',
        value: p.paletteStart ?? '#3fd0ff',
      },
      paletteMid: { label: 'Color Mid', value: p.paletteMid ?? '#a742ff' },
      paletteEnd: { label: 'Color End', value: p.paletteEnd ?? '#ffd27a' },
      paletteMidpoint: {
        label: 'Midpoint',
        value: p.paletteMidpoint ?? 0.5,
        min: 0.05,
        max: 0.95,
        step: 0.01,
      },
      // Per-state visibility — hides cells of that state regardless of
      // colorMode, live-tunable (no regenerate needed). Only covers the core
      // 3-state system (hierarchical/Life); Cyclic CA's extra states beyond
      // 3 are always shown, unaffected by these.
      showState1: { label: 'Show State 1', value: p.showState1 ?? true },
      showState2: { label: 'Show State 2', value: p.showState2 ?? true },
      showState3: { label: 'Show State 3', value: p.showState3 ?? true },
    },
    { collapsed: true }
  );
}
