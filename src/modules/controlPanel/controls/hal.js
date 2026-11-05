import { dial, press } from '../hits';
import { INK } from '../kit';
import { part } from '../parts';

const RED = [1, 0.018, 0.008];
const CORE = [1, 0.62, 0.22];
const SILVER = { c: [0.6, 0.61, 0.63], m: 0.35, r: 0.38 };
const BLUE = { c: [0.012, 0.05, 0.22], m: 0, r: 0.4 };
const GLOSS = { c: [0.008, 0.008, 0.009], m: 0.1, r: 0.12 };
const WHITE = { c: [0.8, 0.8, 0.8], m: 0, r: 0.5 };
const BLACK = { c: [0.01, 0.01, 0.01], m: 0, r: 0.5 };
const FACE = 0.05;
const LENS = 0.085;

// The fish-eye of a certain shipboard computer: a gloss black faceplate,
// a two-tone nameplate, a chrome-ringed dome whose red glow breathes,
// and a grille beneath it. Drag the lens to dim it; press the nameplate
// and it glows with the panel's audio as if speaking.
export default function buildHal(kit, { h, w }) {
  const { disc, slab, style } = kit;
  const hw = w / 2 - 0.08;
  const hh = h / 2 - 0.08;
  const pw = hw - 0.09;
  const nh = Math.min(0.22, hh * 0.2);
  const ny = hh - 0.09 - nh / 2;
  const split = -pw * 0.1;
  const grille = hh * 0.3;
  const top = ny - nh / 2 - 0.05;
  const bottom = -hh + 0.05 + grille;
  const ly = (top + bottom) / 2;
  const r = Math.min(hw - 0.05, (top - bottom) / 2 - 0.02);
  const label = (from, to, look) =>
    kit.legend((from + to) / 2, ny, (to - from) * 0.7, nh * 0.32, {
      look,
      z0: FACE + 0.02,
    });
  const slots = Array.from({ length: 4 }, (_, i) =>
    slab(
      0,
      -hh + 0.06 + (grille * (i + 0.5)) / 4,
      hw * 0.62,
      Math.min(0.018, grille / 14),
      FACE,
      FACE + INK,
      style.hole
    )
  );
  const dome = (s, z, rgb, level) =>
    part('sphere', [0, ly, LENS], [s, s, z], {
      ...style.lit(rgb, level),
      c: [0.012, 0.002, 0.002],
      r: 0.06,
    });

  return {
    live: true,
    statics: [
      slab(0, 0, hw, hh, 0, FACE, GLOSS),
      slab(
        (split - pw) / 2,
        ny,
        (split + pw) / 2,
        nh / 2,
        FACE,
        FACE + 0.02,
        SILVER
      ),
      slab(
        (split + pw) / 2,
        ny,
        (pw - split) / 2,
        nh / 2,
        FACE,
        FACE + 0.02,
        BLUE
      ),
      ...label(-pw, split, BLACK),
      ...label(split, pw, WHITE),
      disc(0, ly, r, FACE, 0.08, style.metal),
      part('torus', [0, ly, 0.08], [r * 0.93, r * 0.93, r * 0.07], style.metal),
      disc(0, ly, r * 0.86, 0.08, LENS, style.hole),
      ...slots,
    ],
    hits: [dial(0, 0, ly, r), press(1, 0, ny, { hh: nh / 2, hw: pw })],
    signals: [
      { kind: 'smooth', fixed: true, base: 0.75 },
      { kind: 'switch', fixed: true, base: 0 },
    ],
    pose: ([glow, voice], { audio, t }) => {
      const speech =
        voice > 0.5 ? audio.slice(2, 8).reduce((sum, v) => sum + v, 0) / 6 : 0;
      const level = glow * (0.85 + 0.15 * Math.sin(t * 1.3)) + speech * 1.4;
      return [
        dome(r * 0.84, r * 0.32, RED, 0.005 + level * 0.025),
        dome(r * 0.62, r * 0.335, RED, 0.04 + level * 0.35),
        dome(r * 0.4, r * 0.355, RED, 0.08 + level * 1.4),
        dome(r * 0.12, r * 0.4, CORE, 0.15 + level * 2.4),
      ];
    },
  };
}
