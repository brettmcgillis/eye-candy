import { SQUARES_H } from '@utils/argylePattern';

import bret from './marks/bret.json';
import reversal from './marks/reversal.json';

// Maker's marks for signing a print, each two layers like the house models:
// a base outline and the glyph on it. Outlines are unit-sized (longest side
// 1) and centred; Bret and Reversal are baked from their GLBs by
// scripts/print-shop-marks.mjs, the argyle is built from its source data.
export const MARK_IDS = ['none', 'argyle', 'bret', 'reversal'];

const square = ({ sx, sy }) =>
  [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ]
    .map(([x, y]) => {
      const gx = sx + x;
      const gy = -(sy + y);
      return [(gx - gy) / Math.SQRT2, (gx + gy) / Math.SQRT2];
    })
    // Canvas y runs down; flipping it reverses the winding, so undo that.
    .reverse();

function argyle() {
  const layers = ['b', 't'].map((layer) =>
    SQUARES_H.filter((sq) => sq.layer === layer).map(square)
  );
  const points = layers.flat(2);
  const span = Math.max(
    Math.max(...points.map(([x]) => x)) - Math.min(...points.map(([x]) => x)),
    Math.max(...points.map(([, y]) => y)) -
      Math.min(...points.map(([, y]) => y))
  );
  return layers.map((rings) =>
    rings.map((ring) => ring.map(([x, y]) => [x / span, y / span]))
  );
}

const baked = (mark) =>
  ['out', 'in'].map(
    (layer) => mark.layers.find((entry) => entry.layer === layer).polygons
  );

// [base layer, glyph layer], each a list of rings (holes wound backwards).
export function markLayers(id) {
  if (id === 'argyle') return argyle();
  if (id === 'bret') return baked(bret);
  if (id === 'reversal') return baked(reversal);
  return null;
}

// A right-handed frame on a surface: X along it, Y "up" the mark, Z out of
// it, so the mark reads the right way round to someone looking at that face.
export function surfaceFrame(normal, point) {
  const n = normal;
  const ref = Math.abs(n[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  let x = [
    ref[1] * n[2] - ref[2] * n[1],
    ref[2] * n[0] - ref[0] * n[2],
    ref[0] * n[1] - ref[1] * n[0],
  ];
  const length = Math.hypot(...x);
  x = x.map((v) => v / length);
  const y = [
    n[1] * x[2] - n[2] * x[1],
    n[2] * x[0] - n[0] * x[2],
    n[0] * x[1] - n[1] * x[0],
  ];
  return [...x, 0, ...y, 0, ...n, 0, ...point, 1];
}

// Two prisms, base then glyph, ready to cut (deboss) or add (emboss). The
// glyph goes twice as far, so the mark reads as two layers. `embed` is how
// far a raised mark sinks into the surface; `lift` how far a cutter clears it.
export function markSolids(
  wasm,
  id,
  { depth, embed, frame, lift, size, style }
) {
  const layers = markLayers(id);
  if (!layers) return [];
  const { CrossSection } = wasm;
  return layers.map((rings, i) => {
    const reach = depth * (i + 1);
    const section = new CrossSection(
      rings.map((ring) => ring.map(([x, y]) => [x * size, y * size])),
      'Positive'
    );
    const prism =
      style === 'emboss'
        ? section.extrude(reach + embed).translate([0, 0, -embed])
        : section.extrude(reach + lift).translate([0, 0, -reach]);
    return prism.transform(frame);
  });
}
