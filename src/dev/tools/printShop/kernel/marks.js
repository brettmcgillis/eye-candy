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

// A right-handed frame on a surface: X along it, Y "up" the mark (towards
// `up` where given), Z out of it, so the mark reads the right way round to
// someone looking at that face.
export function surfaceFrame(normal, point, up = null) {
  const n = normal;
  const ref = up ?? (Math.abs(n[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0]);
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
// `surface(x, y)` is the surface's height above the mark's plane; given it,
// the prisms are subdivided and bent to follow the surface, so a mark on a
// curved piece keeps one depth instead of fading out toward its edges.
export function markSolids(
  wasm,
  id,
  { depth, embed, frame, lift, size, style, surface }
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
    let prism =
      style === 'emboss'
        ? section.extrude(reach + embed).translate([0, 0, -embed])
        : section.extrude(reach + lift).translate([0, 0, -reach]);
    if (surface) {
      prism = prism.refineToLength(size / 80).warp((vert) => {
        // eslint-disable-next-line no-param-reassign
        vert[2] += surface(vert[0], vert[1]);
      });
    }
    return prism.transform(frame);
  });
}

// Heights of `mesh` above the plane of `frame` (from surfaceFrame), sampled
// on a grid over the mark and read back bilinearly.
export function surfaceHeights(mesh, frame, extent, castRayHits) {
  const x = frame.slice(0, 3);
  const y = frame.slice(4, 7);
  const n = frame.slice(8, 11);
  const o = frame.slice(12, 15);
  const local = new Float64Array(mesh.positions.length);
  for (let v = 0; v < mesh.positions.length; v += 3) {
    const d = [0, 1, 2].map((k) => mesh.positions[v + k] - o[k]);
    local[v] = d[0] * x[0] + d[1] * x[1] + d[2] * x[2];
    local[v + 1] = d[0] * y[0] + d[1] * y[1] + d[2] * y[2];
    local[v + 2] = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
  }
  const reach = extent * 1.5;
  const near = [];
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const a = mesh.indices[t] * 3;
    if (
      Math.abs(local[a]) < reach &&
      Math.abs(local[a + 1]) < reach &&
      Math.abs(local[a + 2]) < reach
    ) {
      near.push(mesh.indices[t], mesh.indices[t + 1], mesh.indices[t + 2]);
    }
  }
  const patch = { indices: near, positions: local };
  const cells = 48;
  const step = (extent * 2) / cells;
  const heights = new Float64Array((cells + 1) * (cells + 1));
  for (let j = 0; j <= cells; j += 1) {
    for (let i = 0; i <= cells; i += 1) {
      const px = -extent + i * step;
      const py = -extent + j * step;
      // The surface closest to the plane: the skin the mark sits on.
      const hit = castRayHits(patch, [px, py, reach], [0, 0, -1]).reduce(
        (best, h) =>
          best == null || Math.abs(reach - h.distance) < Math.abs(best)
            ? reach - h.distance
            : best,
        null
      );
      heights[j * (cells + 1) + i] = hit ?? 0;
    }
  }
  return (px, py) => {
    const fx = Math.min(cells, Math.max(0, (px + extent) / step));
    const fy = Math.min(cells, Math.max(0, (py + extent) / step));
    const i0 = Math.min(cells - 1, Math.floor(fx));
    const j0 = Math.min(cells - 1, Math.floor(fy));
    const tx = fx - i0;
    const ty = fy - j0;
    const at = (i, j) => heights[j * (cells + 1) + i];
    return (
      at(i0, j0) * (1 - tx) * (1 - ty) +
      at(i0 + 1, j0) * tx * (1 - ty) +
      at(i0, j0 + 1) * (1 - tx) * ty +
      at(i0 + 1, j0 + 1) * tx * ty
    );
  };
}
