import { simplifyLoop } from './lines';

const CELL_PX = 8;
const EDGE_ON_PX2 = 1e-3;
// A triangle thinner than this (px) can hide nothing a pen would show, and
// its crack-closing expansion would only cut lines running along it.
const THIN_PX = 0.15;
const EXPAND_PX = 0.05;
const DEPTH_EPS = 1e-5;
const NEAR = 1e-3;
const SIMPLIFY_PX = 0.05;

// Larger is nearer, and affine across a plane's screen image: 1/depth for a
// perspective camera, −depth for an orthographic one.
const nearness = (camera, depth) =>
  camera.projection === 'orthographic' ? -depth : 1 / depth;

// Triangles in output px with their nearness, bucketed on a screen grid.
function occluderGrid({ camera, height, meshes, project, width }) {
  const columns = Math.ceil(width / CELL_PX);
  const rows = Math.ceil(height / CELL_PX);
  const cells = Array.from({ length: columns * rows }, () => []);
  const triangles = [];
  meshes.forEach(({ index, position }) => {
    const count = index ? index.length : position.length / 9;
    const vertex = (t, k) => (index ? index[t * 3 + k] : t * 3 + k);
    const projected = new Map();
    const at = (v) => {
      if (!projected.has(v)) {
        projected.set(
          v,
          project(position[v * 3], position[v * 3 + 1], position[v * 3 + 2])
        );
      }
      return projected.get(v);
    };
    for (let t = 0; t < count / (index ? 3 : 1); t += 1) {
      const p = [0, 1, 2].map((k) => at(vertex(t, k)));
      if (p.every((v) => v.depth > NEAR)) {
        const area =
          (p[1].x - p[0].x) * (p[2].y - p[0].y) -
          (p[2].x - p[0].x) * (p[1].y - p[0].y);
        const longest = Math.max(
          Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y),
          Math.hypot(p[2].x - p[1].x, p[2].y - p[1].y),
          Math.hypot(p[0].x - p[2].x, p[0].y - p[2].y)
        );
        if (
          Math.abs(area) / 2 > EDGE_ON_PX2 &&
          Math.abs(area) / (longest || 1) >= THIN_PX
        ) {
          const xs = p.map((v) => v.x);
          const ys = p.map((v) => v.y);
          const lo = [Math.min(...xs), Math.min(...ys)];
          const hi = [Math.max(...xs), Math.max(...ys)];
          if (hi[0] >= 0 && hi[1] >= 0 && lo[0] <= width && lo[1] <= height) {
            const id = triangles.length;
            const q = p.map((v) => nearness(camera, v.depth));
            const sign = area > 0 ? 1 : -1;
            // Edge i runs corner i → i+1; `sign` makes the inside positive.
            const edges = [0, 1, 2].map((i) => {
              const a = p[i];
              const b = p[(i + 1) % 3];
              const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
              return {
                ax: a.x,
                ay: a.y,
                dx: ((b.x - a.x) * sign) / length,
                dy: ((b.y - a.y) * sign) / length,
              };
            });
            // q = q0 + gx (x − x0) + gy (y − y0) over the triangle.
            const ux = p[1].x - p[0].x;
            const uy = p[1].y - p[0].y;
            const vx = p[2].x - p[0].x;
            const vy = p[2].y - p[0].y;
            const dq1 = q[1] - q[0];
            const dq2 = q[2] - q[0];
            triangles.push({
              edges,
              gx: (dq1 * vy - dq2 * uy) / area,
              gy: (dq2 * ux - dq1 * vx) / area,
              q0: q[0],
              x0: p[0].x,
              y0: p[0].y,
            });
            const c0 = Math.max(0, Math.floor(lo[0] / CELL_PX));
            const c1 = Math.min(columns - 1, Math.floor(hi[0] / CELL_PX));
            const r0 = Math.max(0, Math.floor(lo[1] / CELL_PX));
            const r1 = Math.min(rows - 1, Math.floor(hi[1] / CELL_PX));
            for (let r = r0; r <= r1; r += 1) {
              for (let c = c0; c <= c1; c += 1) cells[r * columns + c].push(id);
            }
          }
        }
      }
    }
  });
  return { cells, columns, rows, triangles };
}

// The `[lo, hi]` of u where `value(u) = a + u b` is at least `floor`,
// narrowing `span` in place; false once it is empty.
/* eslint-disable no-param-reassign */
function narrow(span, a, b, floor) {
  if (Math.abs(b) < 1e-12) return a >= floor;
  const u = (floor - a) / b;
  if (b > 0) span[0] = Math.max(span[0], u);
  else span[1] = Math.min(span[1], u);
  return span[0] < span[1];
}
/* eslint-enable no-param-reassign */

// Segment p0 → p1 (output px, with nearness q0, q1) cut where a nearer
// triangle covers it: the visible `[u0, u1]` stretches.
function visibleSpans(p0, p1, q0, q1, grid) {
  const { cells, columns, rows, triangles } = grid;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const length = Math.hypot(dx, dy);
  const seen = new Set();
  const hidden = [];
  const eps = DEPTH_EPS * Math.max(Math.abs(q0), Math.abs(q1), 1e-9);
  // A triangle sits in every cell it overlaps, so the cell under each sample
  // holds all that can cover it.
  const steps = Math.max(1, Math.ceil(length / (CELL_PX / 8)));
  for (let s = 0; s <= steps; s += 1) {
    const c = Math.min(
      columns - 1,
      Math.max(0, Math.floor((p0.x + (dx * s) / steps) / CELL_PX))
    );
    const r = Math.min(
      rows - 1,
      Math.max(0, Math.floor((p0.y + (dy * s) / steps) / CELL_PX))
    );
    cells[r * columns + c].forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      const tri = triangles[id];
      const span = [0, 1];
      const inside = tri.edges.every((edge) => {
        const g0 = edge.dx * (p0.y - edge.ay) - edge.dy * (p0.x - edge.ax);
        const g1 = edge.dx * (p1.y - edge.ay) - edge.dy * (p1.x - edge.ax);
        return narrow(span, g0, g1 - g0, -EXPAND_PX);
      });
      if (!inside) return;
      const f0 =
        tri.q0 + tri.gx * (p0.x - tri.x0) + tri.gy * (p0.y - tri.y0) - q0;
      const f1 =
        tri.q0 + tri.gx * (p1.x - tri.x0) + tri.gy * (p1.y - tri.y0) - q1;
      if (narrow(span, f0 - eps, f1 - f0, 0) && span[1] > span[0]) {
        hidden.push(span);
      }
    });
  }
  hidden.sort((a, b) => a[0] - b[0]);
  const spans = [];
  let from = 0;
  hidden.forEach(([lo, hi]) => {
    if (lo > from) spans.push([from, lo]);
    from = Math.max(from, hi);
  });
  if (from < 1) spans.push([from, 1]);
  // A segment seen end-on is a point: kept whole so its neighbours still
  // join through it.
  return spans.filter(
    ([lo, hi]) => (hi - lo) * length > 0.2 || (length <= 0.2 && hi - lo >= 1)
  );
}

// A segment's part inside the frame, trimmed (Liang–Barsky) to u in [lo, hi].
function frameSpan(p0, p1, width, height) {
  const span = [0, 1];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const ok =
    narrow(span, p0.x + 1, dx, 0) &&
    narrow(span, width + 1 - p0.x, -dx, 0) &&
    narrow(span, p0.y + 1, dy, 0) &&
    narrow(span, height + 1 - p0.y, -dy, 0);
  return ok ? span : null;
}

// Where a 3D segment's end is behind the camera, the end moves along it to
// the near plane; null when the whole segment is.
function clipNear(a, b, project) {
  const pa = project(...a);
  const pb = project(...b);
  if (pa.depth > NEAR && pb.depth > NEAR) return [a, b];
  if (pa.depth <= NEAR && pb.depth <= NEAR) return null;
  const t = (NEAR - pa.depth) / (pb.depth - pa.depth);
  const cut = a.map((v, i) => v + (b[i] - v) * t);
  return pa.depth <= NEAR ? [cut, b] : [a, cut];
}

// 3D polylines as screen runs with exact hidden-line removal: each straight
// segment is cut where a nearer occluder triangle covers it, so a line
// ends exactly where it goes behind a cell and a corner stays a corner. The
// occluders are triangle meshes `{ index?, position }` in world space; a
// segment on an occluder's own surface is never cut by it.
export default function createHiddenLines({
  camera,
  height,
  minLength = 0.8,
  occluders,
  project,
  width,
}) {
  const grid = occluderGrid({
    camera,
    height,
    meshes: occluders,
    project,
    width,
  });

  // The visible stretches of a polyline's segments, each noting whether it
  // starts / ends on its segment's own end so a neighbour can continue it.
  const piecesOf = (line) =>
    line.slice(1).flatMap((end, i) => {
      const cut = clipNear(line[i], end, project);
      if (!cut) return [];
      const a = project(...cut[0]);
      const b = project(...cut[1]);
      const framed = frameSpan(a, b, width, height);
      if (!framed) return [];
      const qa = nearness(camera, a.depth);
      const qb = nearness(camera, b.depth);
      const at = (u) => ({
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
      });
      return visibleSpans(a, b, qa, qb, grid)
        .map(([lo, hi]) => [Math.max(lo, framed[0]), Math.min(hi, framed[1])])
        .filter(([lo, hi]) => hi > lo)
        .map(([lo, hi]) => ({
          a: at(lo),
          b: at(hi),
          ends: hi >= 1 - 1e-9,
          joins: lo <= 1e-9,
          segment: i,
        }));
    });

  const lengthOf = (run) =>
    run.reduce(
      (sum, p, i) =>
        i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
      0
    );

  return (lines) =>
    lines.flatMap((line) => {
      const joined = [];
      let run = [];
      let open = false;
      let last = -2;
      piecesOf(line).forEach((piece) => {
        if (!(open && piece.joins && piece.segment === last + 1)) {
          if (run.length) joined.push(run);
          run = [piece.a];
        }
        run.push(piece.b);
        open = piece.ends;
        last = piece.segment;
      });
      if (run.length) joined.push(run);
      return joined
        .map((points) =>
          simplifyLoop(
            points.map((p) => [p.x, p.y]),
            SIMPLIFY_PX
          ).map(([x, y]) => ({ x, y }))
        )
        .filter((points) => lengthOf(points) >= minLength);
    });
}
