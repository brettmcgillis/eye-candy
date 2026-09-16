import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  dot,
  float,
  int,
  mix,
  smoothstep,
  time,
  uniform,
  uniformArray,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { cellCoords, colorUniform } from './shared';

// Segments for every distinct glyph in the text share one buffer; each cell
// points at its glyph's run with (start, count), so a glyph can have any
// number of strokes. The buffer is the only limit: MAX_SEGMENTS across the
// distinct glyphs of one text (2048 vec4s stays well under the 64KB uniform
// binding limit).
export const MAX_SEGMENTS = 2048;

// Segment coordinates are glyph space (0..1, y up). meta.x is a segment's
// reveal order; cells.xyz is (start, count, part-of-a-text-line).
export function createStrokeUniforms(maxCells, params) {
  return {
    baseline: uniform(0),
    baselineY: uniform(0.5),
    carve: uniform(0),
    carveCenter: uniform(0.45),
    carveHalf: uniform(0.05),
    cellAspect: uniform(1),
    cells: uniformArray(
      Array.from({ length: maxCells }, () => new THREE.Vector4()),
      'vec4'
    ),
    cols: uniform(1),
    halo: uniform(0),
    haloWidth: uniform(0.1),
    ink: colorUniform(params.ink),
    maxCells,
    meta: uniformArray(
      Array.from({ length: MAX_SEGMENTS }, () => new THREE.Vector4()),
      'vec4'
    ),
    padding: uniform(0),
    paper: colorUniform(params.paper),
    reveal: uniform(0),
    revealSpeed: uniform(1),
    rows: uniform(1),
    segments: uniformArray(
      Array.from({ length: MAX_SEGMENTS }, () => new THREE.Vector4()),
      'vec4'
    ),
    softness: uniform(0),
    stagger: uniform(0),
    thickness: uniform(0.02),
    truncated: false,
  };
}

function sdSegment(p, a, b) {
  const pa = p.sub(a);
  const ba = b.sub(a);
  const h = clamp(dot(pa, ba).div(dot(ba, ba).max(1e-8)), 0, 1);
  return pa.sub(ba.mul(h)).length();
}

// The sigil source's stroke reveal: a sigmoid of a sine, each stroke on its
// own power-of-two period. The exponent is clamped only to keep large periods
// from overflowing; the sigmoid is already saturated well inside that range.
function reveal(order, phase, t) {
  const period = float(2).pow(order);
  const x = t.add(phase).div(period).add(1).sin().mul(period).mul(-8);
  return float(1).div(clamp(x, -60, 60).exp().add(1));
}

export function buildStrokeNode(u) {
  return Fn(() => {
    const { cellIndex, local } = cellCoords(u.cols, u.rows);
    const scale = float(1).sub(u.padding.mul(2)).max(0.05);
    const g = local.sub(0.5).div(scale).add(0.5);
    const p = vec2(g.x.mul(u.cellAspect), g.y);
    const cell = u.cells.element(int(cellIndex));
    const first = int(cell.x);
    const phase = cellIndex.mul(u.stagger);
    const t = time.mul(u.revealSpeed);

    const d = float(1e3).toVar();
    Loop(
      { condition: '<', end: int(cell.y), start: int(0), type: 'int' },
      ({ i }) => {
        const s = u.segments.element(first.add(i));
        const order = u.meta.element(first.add(i)).x;
        const f = mix(1, reveal(order, phase, t), u.reveal);

        If(f.greaterThan(0.001), () => {
          const a = vec2(s.x.mul(u.cellAspect), s.y);
          const b = vec2(s.z.mul(u.cellAspect), s.w);
          d.assign(d.min(sdSegment(p, a, a.add(b.sub(a).mul(f)))));
        });
      }
    );

    // Signed distance to the drawn (thickened) strokes, so the carve cuts a
    // clean gap at any line weight instead of only thinning the centreline.
    const shape = d.mul(scale).sub(u.thickness).toVar();
    const band = abs(g.y.sub(u.carveCenter)).sub(u.carveHalf).mul(scale);
    shape.assign(mix(shape, shape.max(band.negate()), u.carve));

    const lineCell = cell.z;
    const baseline = abs(g.y.sub(u.baselineY)).mul(scale).sub(u.thickness);
    shape.assign(mix(shape, shape.min(baseline), u.baseline.mul(lineCell)));

    const aa = uv().y.fwidth().mul(u.rows).max(1e-5);
    const coverage = smoothstep(
      aa.negate(),
      u.softness.add(aa),
      shape
    ).oneMinus();

    const dist = shape.add(u.thickness).max(0);
    const shadow = mix(
      1,
      smoothstep(0, 1, dist.div(u.haloWidth.max(1e-4)).mul(0.25).add(0.75)),
      u.halo
    );

    return vec4(mix(u.ink, u.paper, coverage.oneMinus().mul(shadow)), 1);
  })();
}

/* eslint-disable no-param-reassign */
export function writeStrokeUniforms(u, { layout, params, segmentsFor }) {
  u.cols.value = layout.cols;
  u.rows.value = layout.rows;
  u.cellAspect.value = params.cellAspect;
  u.padding.value = params.padding;
  u.thickness.value = params.thickness;
  u.softness.value = params.softness;
  u.ink.value.set(params.ink);
  u.paper.value.set(params.paper);
  u.reveal.value = params.reveal ? 1 : 0;
  u.revealSpeed.value = params.revealSpeed;
  u.stagger.value = params.stagger;
  u.halo.value = params.halo;
  u.haloWidth.value = params.haloWidth;

  const runs = new Map();
  let next = 0;
  u.truncated = false;

  for (let cell = 0; cell < u.maxCells; cell += 1) {
    const entry = layout.cells[cell];
    let run = { count: 0, start: 0 };

    if (entry?.key) {
      run = runs.get(entry.key);
      if (!run) {
        const segments = segmentsFor(entry.key);
        const count = Math.min(segments.length, MAX_SEGMENTS - next);
        if (count < segments.length) u.truncated = true;
        for (let k = 0; k < count; k += 1) {
          const { a, b, order } = segments[k];
          u.segments.array[next + k].set(a[0], a[1], b[0], b[1]);
          u.meta.array[next + k].set(order, 0, 0, 0);
        }
        run = { count, start: next };
        runs.set(entry.key, run);
        next += count;
      }
    }

    u.cells.array[cell].set(run.start, run.count, entry?.inLine ? 1 : 0, 0);
  }
}
/* eslint-enable no-param-reassign */
