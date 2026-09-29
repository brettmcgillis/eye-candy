import { KIND } from './tree';

const EPS = 1e-6;

// fractalPixelate's outline band as a polygon: quad edge distance < w is a
// square inset by w on every side; tri barycentric < w is the triangle
// scaled about its centroid by 1 - 3w.
export function insetPoly(node, width) {
  const k = 1 - (node.kind === KIND.QUAD ? 2 : 3) * width;
  if (k <= 0) return null;
  return node.poly.map((v, i) => {
    const c = i % 2 === 0 ? node.cx : node.cy;
    return c + (v - c) * k;
  });
}

function clipAxis(poly, axis, bound, keepBelow) {
  const out = [];
  const n = poly.length / 2;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const a = [poly[i * 2], poly[i * 2 + 1]];
    const b = [poly[j * 2], poly[j * 2 + 1]];
    const inA = keepBelow ? a[axis] <= bound : a[axis] >= bound;
    const inB = keepBelow ? b[axis] <= bound : b[axis] >= bound;
    if (inA) out.push(a[0], a[1]);
    if (inA !== inB) {
      const t = (bound - a[axis]) / (b[axis] - a[axis]);
      out.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    }
  }
  return out;
}

export function clipToRect(poly, width, height) {
  let out = poly;
  [
    [0, 0, false],
    [0, width, true],
    [1, 0, false],
    [1, height, true],
  ].forEach(([axis, bound, below]) => {
    if (out.length >= 6) out = clipAxis(out, axis, bound, below);
  });
  return out.length >= 6 ? out : null;
}

// A line family is (angle, offset); a segment on it is an interval along the
// line's direction. Both hatching and outlines are stored this way so shared
// edges and continuing hatch lines merge into single pen strokes.
export function lineFrame(angle) {
  const a = ((angle % Math.PI) + Math.PI) % Math.PI;
  return { a, d: [Math.cos(a), Math.sin(a)], n: [-Math.sin(a), Math.cos(a)] };
}

export function createLineSet() {
  const lines = new Map();
  return {
    add(frame, offset, t0, t1, layer = 0) {
      if (t1 - t0 < EPS) return;
      const key = `${layer}|${Math.round(frame.a * 1e5)}|${Math.round(offset * 1e3)}`;
      let line = lines.get(key);
      if (!line) {
        line = { frame, intervals: [], layer, offset };
        lines.set(key, line);
      }
      line.intervals.push([t0, t1]);
    },
    // Merged, ordered for a pen: by layer, angle and offset, alternating
    // direction line to line so the pen zig-zags instead of flying back.
    segments() {
      const sorted = [...lines.values()].sort(
        (p, q) =>
          p.layer - q.layer || p.frame.a - q.frame.a || p.offset - q.offset
      );
      const out = [];
      sorted.forEach((line, index) => {
        const merged = [];
        line.intervals
          .sort((p, q) => p[0] - q[0])
          .forEach(([t0, t1]) => {
            const last = merged[merged.length - 1];
            if (last && t0 <= last[1] + 1e-3) last[1] = Math.max(last[1], t1);
            else merged.push([t0, t1]);
          });
        if (index % 2 === 1) merged.reverse();
        const { d, n } = line.frame;
        merged.forEach(([t0, t1]) => {
          const [s, e] = index % 2 === 1 ? [t1, t0] : [t0, t1];
          out.push({
            layer: line.layer,
            points: [
              d[0] * s + n[0] * line.offset,
              d[1] * s + n[1] * line.offset,
              d[0] * e + n[0] * line.offset,
              d[1] * e + n[1] * line.offset,
            ],
          });
        });
      });
      return out;
    },
  };
}

export function addPolyEdges(set, poly, layer) {
  const n = poly.length / 2;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const ax = poly[i * 2];
    const ay = poly[i * 2 + 1];
    const bx = poly[j * 2];
    const by = poly[j * 2 + 1];
    const frame = lineFrame(Math.atan2(by - ay, bx - ax));
    const offset = ax * frame.n[0] + ay * frame.n[1];
    const ta = ax * frame.d[0] + ay * frame.d[1];
    const tb = bx * frame.d[0] + by * frame.d[1];
    set.add(frame, offset, Math.min(ta, tb), Math.max(ta, tb), layer);
  }
}

// Parallel lines at global offsets k·spacing, so neighbouring cells with the
// same spacing continue each other's lines.
export function addHatch(set, poly, angle, spacing, layer) {
  const frame = lineFrame(angle);
  const count = poly.length / 2;
  const offsets = [];
  for (let i = 0; i < count; i += 1) {
    offsets.push(poly[i * 2] * frame.n[0] + poly[i * 2 + 1] * frame.n[1]);
  }
  const lo = Math.ceil(Math.min(...offsets) / spacing);
  const hi = Math.floor(Math.max(...offsets) / spacing);
  for (let k = lo; k <= hi; k += 1) {
    const offset = k * spacing;
    const ts = [];
    for (let i = 0; i < count; i += 1) {
      const j = (i + 1) % count;
      const oa = offsets[i] - offset;
      const ob = offsets[j] - offset;
      if ((oa <= 0 && ob > 0) || (oa > 0 && ob <= 0)) {
        const t = oa / (oa - ob);
        const x = poly[i * 2] + (poly[j * 2] - poly[i * 2]) * t;
        const y = poly[i * 2 + 1] + (poly[j * 2 + 1] - poly[i * 2 + 1]) * t;
        ts.push(x * frame.d[0] + y * frame.d[1]);
      }
    }
    if (ts.length >= 2)
      set.add(frame, offset, Math.min(...ts), Math.max(...ts), layer);
  }
}
