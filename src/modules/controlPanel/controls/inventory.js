import { MATRIX_MODES } from './matrix';
import { EXTRA_MODES } from './screenModes';

// One of every control and every variant it can roll, at a size it fits:
// the Inventory layout lays these out instead of rolling a panel.
const unit = (id, variant = null) => ({
  h: 1,
  id,
  kind: 'unit',
  variant,
  w: 1,
});
const area = (id, w, h, variant = null) => ({
  h,
  id,
  kind: 'area',
  variant,
  w,
});

export const INVENTORY = [
  ...['pair', 'triple', 'airliner'].map((v) => area('throttle', 2, 2, v)),
  ...['single', 'dual'].map((v) => area('recorder', 3, 2, v)),
  ...MATRIX_MODES.map((v) => area('ledMatrix', 3, 2, v)),
  unit('dipswitches', 'four'),
  unit('dipswitches', 'six'),
  unit('thumbwheel'),
  unit('trackball'),
  area('cluster', 3, 3),
  area('fader', 1, 3),
  area('meter', 1, 3),
  area('keypad', 2, 3),
  area('faderBank', 3, 2),
  area('piano', 5, 2),
  ...['scope', 'spectrum', 'terminal'].map((mode) =>
    area('screen', 3, 2, mode)
  ),
  ...['plasma', 'radar', 'lissajous'].map((mode) => area('screen', 2, 2, mode)),
  ...EXTRA_MODES.map((mode) => area('screen', 2, 2, mode)),
  area('bigKnob', 2, 2),
  area('bigGauge', 2, 2, 'dark'),
  area('bigGauge', 2, 2, 'light'),
  ...['handle', 'ball'].map((variant) => area('joystick', 2, 2, variant)),
  ...['holes', 'slots', 'cone'].map((variant) =>
    area('speaker', 2, 2, variant)
  ),
  area('patchBay', 4, 2),
  area('hal', 1, 2),
  area('printer', 1, 2, 'receipt'),
  area('printer', 2, 3, 'fanfold'),
  area('tuner', 5, 2),
  area('tuner', 4, 1),
  area('mimic', 5, 3),
  area('reels', 4, 3),
  area('telltales', 4, 1),
  area('telltales', 3, 2),
  area('badge', 3, 1),
  area('buttonRow', 4, 1),
  area('fader', 3, 1),
  area('meter', 3, 1),
  area('sevenSeg', 3, 1, 'counter'),
  area('sevenSeg', 3, 1, 'value'),
  area('splitFlap', 4, 1, 'board'),
  area('splitFlap', 4, 1, 'counter'),
  area('blank', 2, 1, 'plate'),
  area('blank', 2, 1, 'vent'),
  ...['skirt', 'chicken', 'knurl', 'davies', 'flush'].map((v) =>
    unit('knob', v)
  ),
  unit('selector'),
  unit('encoder'),
  unit('gauge', 'dark'),
  unit('gauge', 'light'),
  ...['square', 'round', 'lit'].map((v) => unit('button', v)),
  unit('toggle', 'plain'),
  unit('toggle', 'guarded'),
  unit('rocker'),
  unit('keyswitch'),
  unit('jack', 'quarter'),
  unit('jack', 'eighth'),
  unit('annunciator'),
  unit('leds'),
  unit('eStop'),
  area('blank', 1, 1, 'plain'),
];

// First fit on a grid `cols` wide, scanning rows top-down then left to
// right, so small entries fill the gaps the large ones leave.
function firstFit(cols, entries) {
  const rows = [];
  const free = (x, y, w, h) => {
    for (let dy = 0; dy < h; dy += 1) {
      const row = rows[y + dy];
      for (let dx = 0; dx < w; dx += 1) if (row?.[x + dx]) return false;
    }
    return x + w <= cols;
  };
  const leaves = entries.map((entry) => {
    for (let y = 0; ; y += 1) {
      for (let x = 0; x + entry.w <= cols; x += 1) {
        if (free(x, y, entry.w, entry.h)) {
          for (let dy = 0; dy < entry.h; dy += 1) {
            rows[y + dy] ??= [];
            for (let dx = 0; dx < entry.w; dx += 1) rows[y + dy][x + dx] = true;
          }
          return { depth: 0, entry, h: entry.h, w: entry.w, x, y, zone: false };
        }
      }
    }
  });
  return { cols, leaves, rows: rows.length, zones: [] };
}

// The width (around 16 columns) whose first fit leaves the fewest empty
// cells, so the catalogue reads as one full panel.
export function layoutInventory(entries = INVENTORY) {
  let best = null;
  for (let cols = 14; cols <= 20; cols += 1) {
    const fit = firstFit(cols, entries);
    const waste = fit.rows * cols;
    if (!best || waste < best.waste) best = { fit, waste };
  }
  return best.fit;
}
