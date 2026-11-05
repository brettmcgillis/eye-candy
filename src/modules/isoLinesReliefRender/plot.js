import {
  bandHeight,
  bandOf,
  levelValue,
  traceContours,
} from '@modules/isoLines';

import { tubePlot } from './tube';

const SURFACE_SUBDIVISION = 3;
// The sheet's steep risers would crease along every grid edge; its contours
// are drawn as lines, so only its boundary and silhouette remain.
const NO_CREASES = 180;
// A wall bends a little at every contour vertex; only a real turn is a crease.
const WALL_CREASE = 60;
// The sheet is planar between its vertices, so across a convex riser it sits
// a hair above the contour standing on it, which would hide the line in
// dashes: the line is raised this share of the relief.
const SHEET_LIFT = 0.006;

const EDGE_SIDES = [
  [-1, -1, 1, -1],
  [1, -1, 1, 1],
  [1, 1, -1, 1],
  [-1, 1, -1, -1],
];

// The map's plane is rotated onto the ground: map x stays x, map height
// becomes world y and map y runs along world -z.
const place = (x, height, y) => [x, height, -y];

// What the rig draws, worked out on the CPU for a plot (the shaders place
// every vertex, so there is nothing to read back): `lines`, polylines of
// world points where a contour stands at its level, and `meshes`, the walls,
// skirts and smooth sheet as world-space entries. Held at rest — the build
// and rise motion off, as a still shows it.
export default function plotParts(config, build) {
  const scale = config.relief * 2;
  const lift = config.lineHeight * 2;
  const at = (z01) => Math.min(Math.max(z01, 0), 1) * scale;
  const { aspect, nx, ny } = build;
  const smooth = config.style === 'smooth';
  const terraced = config.style === 'terraced';
  const solid = terraced && config.wallMode === 'solid';
  const lineStyle = ['lines', 'tubes', 'extrudedRibbons'].includes(
    config.style
  );
  const trail = lineStyle && config.lineExtrude === 'time';
  const { values } = build;
  const contours = build.lines ?? traceContours(values, build, config);

  // The field at a map point, bilinear over the grid exactly as the shaders
  // sample it.
  function fieldAt(x, y) {
    const px = Math.min(
      Math.min(Math.max((x + aspect) / (2 * aspect), 0), 1) * nx,
      nx - 1e-3
    );
    const py = Math.min(Math.min(Math.max((y + 1) / 2, 0), 1) * ny, ny - 1e-3);
    const i = Math.floor(px);
    const j = Math.floor(py);
    const fx = px - i;
    const fy = py - j;
    const row = nx + 1;
    const a = values[j * row + i];
    const b = values[j * row + i + 1];
    const c = values[(j + 1) * row + i];
    const d = values[(j + 1) * row + i + 1];
    const n = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    return Math.min(Math.max(n, 0), 1);
  }

  // A band's floor, plus on the smooth surface its own rise eased by x^p.
  function heightAtField(n) {
    const k = n * config.levels - config.levelOffset;
    const band = Math.floor(k);
    const rise = smooth ? (k - band) ** (1 / (1 - config.terraceSharpness)) : 0;
    return at((band + rise + config.levelOffset) / config.levels);
  }

  function contourLines() {
    return contours.map(({ closed, k, points }) => {
      const height =
        at(bandHeight(k, config)) +
        (config.style === 'lines' ? lift : 0) +
        (smooth ? SHEET_LIFT * scale : 0);
      const line = [];
      for (let i = 0; i < points.length; i += 2) {
        line.push(place(points[i], height, points[i + 1]));
      }
      if (closed) line.push(line[0]);
      return line;
    });
  }

  // A vertical ribbon along a contour from `low` to `high`.
  function ribbon({ closed, points }, low, high) {
    const count = points.length / 2 + (closed ? 1 : 0);
    const position = new Float64Array(count * 6);
    const index = [];
    for (let i = 0; i < count; i += 1) {
      const p = (i % (points.length / 2)) * 2;
      position.set(place(points[p], low, points[p + 1]), i * 6);
      position.set(place(points[p], high, points[p + 1]), i * 6 + 3);
      if (i > 0) {
        const v = (i - 1) * 2;
        index.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
      }
    }
    return { index: Uint32Array.from(index), position, rest: position };
  }

  // Terrace walls, one band step tall. Their foot and head are drawn as
  // lines, so the mesh adds only the creases and silhouettes between them.
  function wallMeshes() {
    return contours.map((line) => ({
      ...ribbon(
        line,
        at(bandHeight(line.k - 1, config)),
        at(bandHeight(line.k, config))
      ),
      boundaries: false,
      creaseAngle: WALL_CREASE,
    }));
  }

  // Each wall's foot, where it meets the terrace below.
  function wallFeet() {
    return contours.flatMap(({ closed, k, points }) => {
      const low = at(bandHeight(k - 1, config));
      if (low >= at(bandHeight(k, config))) return [];
      const line = [];
      for (let i = 0; i < points.length; i += 2) {
        line.push(place(points[i], low, points[i + 1]));
      }
      if (closed) line.push(line[0]);
      return [line];
    });
  }

  // The lines style's ribbons, each segment a box exactly as the rig draws
  // it: top and both sides mitred into its neighbours, plus an end face
  // where a ribbon ends. Its underside is never drawn, so its foot is an open
  // edge. `baseOf` gives a segment's foot, or null where it is not shown.
  function ribbonBoxes({ count, data }, baseOf) {
    const half = config.lineThickness;
    const position = [];
    const index = [];
    const ends = new Map();
    const keyOf = (x, y) => `${x},${y}`;
    const mark = (x, y) =>
      ends.set(keyOf(x, y), (ends.get(keyOf(x, y)) ?? 0) + 1);
    for (let s = 0; s < count; s += 1) {
      const o = s * 12;
      mark(data[o], data[o + 1]);
      mark(data[o + 2], data[o + 3]);
    }
    const quad = (corners, out) => {
      const [a, b, , d] = corners;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      const facing =
        (u[1] * v[2] - u[2] * v[1]) * out[0] +
        (u[2] * v[0] - u[0] * v[2]) * out[1] +
        (u[0] * v[1] - u[1] * v[0]) * out[2];
      const first = position.length / 3;
      (facing >= 0 ? corners : [...corners].reverse()).forEach((c) =>
        position.push(...c)
      );
      index.push(first, first + 1, first + 2, first, first + 2, first + 3);
    };
    for (let s = 0; s < count; s += 1) {
      const o = s * 12;
      const base = baseOf(data, o);
      if (base !== null) {
        const bottom = config.style === 'extrudedRibbons' ? 0 : base;
        const section = (x, y, mx, my) => [
          place(x + mx * half, bottom, y + my * half),
          place(x + mx * half, base + lift, y + my * half),
          place(x - mx * half, base + lift, y - my * half),
          place(x - mx * half, bottom, y - my * half),
        ];
        const A = section(data[o], data[o + 1], data[o + 4], data[o + 5]);
        const B = section(data[o + 2], data[o + 3], data[o + 6], data[o + 7]);
        const mid = place(
          (data[o] + data[o + 2]) / 2,
          base + lift / 2,
          (data[o + 1] + data[o + 3]) / 2
        );
        const outOf = (face) => {
          const c = [0, 1, 2].map(
            (k) => (face[0][k] + face[1][k] + face[2][k] + face[3][k]) / 4
          );
          return [c[0] - mid[0], c[1] - mid[1], c[2] - mid[2]];
        };
        [
          [A[1], B[1], B[2], A[2]],
          [A[0], B[0], B[1], A[1]],
          [A[2], B[2], B[3], A[3]],
        ].forEach((face) => quad(face, outOf(face)));
        const along = place(
          data[o + 2] - data[o],
          0,
          data[o + 3] - data[o + 1]
        );
        if (ends.get(keyOf(data[o], data[o + 1])) === 1) {
          quad(
            A,
            along.map((v) => -v)
          );
        }
        if (ends.get(keyOf(data[o + 2], data[o + 3])) === 1) quad(B, along);
      }
    }
    const placed = Float64Array.from(position);
    return {
      boundaries: true,
      creaseAngle: WALL_CREASE,
      index: Uint32Array.from(index),
      position: placed,
      rest: placed,
    };
  }

  const standing = (data, o) => at(data[o + 9]);
  const contourMesh = (pack, baseOf) =>
    config.style === 'tubes'
      ? tubePlot(pack, config.lineThickness, baseOf)
      : ribbonBoxes(pack, baseOf);

  // A trail's boxes: each slice aged to its height, as `trailLines` does.
  function trailBoxes() {
    const span = Math.max(config.trailSeconds * (config.trailSlices - 1), 1e-5);
    const aged = (data, o) => {
      const age = (build.time - data[o + 8]) / span;
      return age >= -1e-3 && age <= 1
        ? Math.min(Math.max(1 - age, 0), 1) * scale
        : null;
    };
    return [
      build.segments,
      ...build.trail.slices.map((slice) => slice.segments),
    ].map((pack) => contourMesh(pack, aged));
  }

  // The outer walls round the domain, as tall as the band standing at their
  // foot: one welded ring, with its head and foot as lines.
  function skirtRing() {
    const top = [];
    const foot = [];
    const position = [];
    const index = [];
    EDGE_SIDES.forEach(([x0, y0, x1, y1]) => {
      const steps = (x0 === x1 ? ny : nx) * SURFACE_SUBDIVISION;
      const first = position.length / 3;
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const x = (x0 + (x1 - x0) * t) * aspect;
        const y = y0 + (y1 - y0) * t;
        const head = place(x, heightAtField(fieldAt(x, y)), y);
        const base = place(x, 0, y);
        position.push(...base, ...head);
        if (s > 0) {
          const v = first + (s - 1) * 2;
          index.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
        }
        if (s < steps) {
          top.push([
            head[0],
            head[1] + (smooth ? SHEET_LIFT * scale : 0),
            head[2],
          ]);
          foot.push(base);
        }
      }
    });
    top.push(top[0]);
    foot.push(foot[0]);
    const placed = Float64Array.from(position);
    return {
      lines: [top, foot],
      mesh: {
        boundaries: false,
        index: Uint32Array.from(index),
        position: placed,
        rest: placed,
      },
    };
  }

  function sheetMesh() {
    const gx = nx * SURFACE_SUBDIVISION;
    const gy = ny * SURFACE_SUBDIVISION;
    const position = new Float64Array((gx + 1) * (gy + 1) * 3);
    const index = [];
    for (let j = 0; j <= gy; j += 1) {
      for (let i = 0; i <= gx; i += 1) {
        const x = -aspect + (2 * aspect * i) / gx;
        const y = -1 + (2 * j) / gy;
        position.set(
          place(x, heightAtField(fieldAt(x, y)), y),
          (j * (gx + 1) + i) * 3
        );
        if (i < gx && j < gy) {
          const v = j * (gx + 1) + i;
          index.push(v, v + 1, v + gx + 1, v + 1, v + gx + 2, v + gx + 1);
        }
      }
    }
    return {
      boundaries: false,
      creaseAngle: NO_CREASES,
      index: Uint32Array.from(index),
      position,
      rest: position,
      smooth: true,
    };
  }

  // The terraces' tops, exact to the contours: for each level, the part of
  // every cell at or above it as a polygon at its height. A solid stack needs
  // only each cell's own band; floating planes are every level's.
  function caps() {
    const row = nx + 1;
    let lo = Infinity;
    let hi = -Infinity;
    values.forEach((v) => {
      lo = Math.min(lo, Math.max(v, 0));
      hi = Math.max(hi, Math.min(v, 1));
    });
    const position = [];
    const index = [];
    const emit = (polygon, height) => {
      const first = position.length / 3;
      polygon.forEach(([x, y]) => position.push(...place(x, height, y)));
      for (let i = 1; i < polygon.length - 1; i += 1) {
        index.push(first, first + i, first + i + 1);
      }
    };
    const xAt = (i) => -aspect + (2 * aspect * i) / nx;
    const yAt = (j) => -1 + (2 * j) / ny;
    for (
      let level = bandOf(lo, config);
      level <= bandOf(hi, config);
      level += 1
    ) {
      const t = levelValue(level, config);
      const above = levelValue(level + 1, config);
      const height = at(bandHeight(level, config));
      for (let j = 0; j < ny; j += 1) {
        let run = -1;
        const close = (end) => {
          if (run >= 0) {
            const [x0, x1, y0, y1] = [xAt(run), xAt(end), yAt(j), yAt(j + 1)];
            emit(
              [
                [x0, y0],
                [x1, y0],
                [x1, y1],
                [x0, y1],
              ],
              height
            );
          }
          run = -1;
        };
        for (let i = 0; i < nx; i += 1) {
          const f = [
            values[j * row + i],
            values[j * row + i + 1],
            values[(j + 1) * row + i + 1],
            values[(j + 1) * row + i],
          ].map((v) => Math.max(v, 0));
          const inside = f.filter((v) => v >= t).length;
          if (inside === 4 && (!solid || Math.min(1, ...f) < above)) {
            if (run < 0) run = i;
          } else {
            close(i);
            if (inside > 0 && inside < 4) {
              const c = [
                [xAt(i), yAt(j)],
                [xAt(i + 1), yAt(j)],
                [xAt(i + 1), yAt(j + 1)],
                [xAt(i), yAt(j + 1)],
              ];
              const polygon = [];
              c.forEach((p, a) => {
                const q = c[(a + 1) % 4];
                const fp = f[a];
                const fq = f[(a + 1) % 4];
                if (fp >= t) polygon.push(p);
                if (fp >= t !== fq >= t) {
                  const u = (t - fp) / (fq - fp);
                  polygon.push([
                    p[0] + (q[0] - p[0]) * u,
                    p[1] + (q[1] - p[1]) * u,
                  ]);
                }
              });
              emit(polygon, height);
            }
          }
        }
        close(nx);
      }
    }
    return {
      index: Uint32Array.from(index),
      position: Float64Array.from(position),
    };
  }

  function lineRibbons() {
    if (!lineStyle || !build.segments) return null;
    return trail ? trailBoxes() : [contourMesh(build.segments, standing)];
  }

  const ribbons = lineRibbons();
  const lines = ribbons ? [] : contourLines();
  const meshes = ribbons ?? [];
  const occluders = ribbons ? [...ribbons] : [];
  if (terraced) occluders.push(caps());
  if (solid) {
    const walls = wallMeshes();
    meshes.push(...walls);
    occluders.push(...walls);
    lines.push(...wallFeet());
  }
  if (solid || smooth) {
    const ring = skirtRing();
    meshes.push(ring.mesh);
    occluders.push(ring.mesh);
    lines.push(...ring.lines);
  }
  if (smooth) {
    const sheet = sheetMesh();
    meshes.push(sheet);
    occluders.push(sheet);
  }
  return { lines, meshes, occluders: occluders.length ? occluders : null };
}
