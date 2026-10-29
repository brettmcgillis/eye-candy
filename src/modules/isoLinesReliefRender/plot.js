import {
  bandHeight,
  bandOf,
  levelValue,
  traceContours,
} from '@modules/isoLines';

const SURFACE_SUBDIVISION = 3;
// The sheet's steep risers would crease along every grid edge; its contours
// are drawn as lines, so only its boundary and silhouette remain.
const NO_CREASES = 180;
// A wall bends a little at every contour vertex; only a real turn is a crease.
const WALL_CREASE = 60;
// Marching squares leaves each contour with a cell-sized wobble where the
// field is nearly flat. The plot blurs the field a little (binomial passes,
// the border held) and builds everything from the blur — contours, caps,
// walls, sheet and skirts — so every line lies on the surface it is cut by.
const BLUR_PASSES = 2;
// The sheet is planar between its vertices, so across a convex riser it sits
// a hair above the contour standing on it, which would hide the line in
// dashes: the line is raised this share of the relief.
const SHEET_LIFT = 0.006;

function blurred({ nx, ny, values }) {
  const row = nx + 1;
  let current = Float64Array.from(values);
  for (let pass = 0; pass < BLUR_PASSES; pass += 1) {
    const across = Float64Array.from(current);
    for (let j = 0; j <= ny; j += 1) {
      for (let i = 1; i < nx; i += 1) {
        const o = j * row + i;
        across[o] = (current[o - 1] + 2 * current[o] + current[o + 1]) / 4;
      }
    }
    const down = Float64Array.from(across);
    for (let j = 1; j < ny; j += 1) {
      for (let i = 0; i <= nx; i += 1) {
        const o = j * row + i;
        down[o] = (across[o - row] + 2 * across[o] + across[o + row]) / 4;
      }
    }
    current = down;
  }
  return current;
}

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
  const trail = config.style === 'lines' && config.lineExtrude === 'time';
  const values = trail ? build.values : blurred(build);
  const contours = trail ? build.lines : traceContours(values, build, config);

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
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
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

  // A trail's slices, each segment aged to its height; consecutive segments
  // that meet are chained back into lines.
  function trailLines() {
    const span = Math.max(config.trailSeconds * (config.trailSlices - 1), 1e-5);
    const packs = [
      build.segments,
      ...build.trail.slices.map((s) => s.segments),
    ];
    const lines = [];
    packs.forEach(({ count, data }) => {
      let line = null;
      let end = null;
      for (let s = 0; s < count; s += 1) {
        const o = s * 12;
        const age = (build.time - data[o + 8]) / span;
        if (age >= -1e-3 && age <= 1) {
          const height = Math.min(Math.max(1 - age, 0), 1) * scale + lift;
          const a = place(data[o], height, data[o + 1]);
          const b = place(data[o + 2], height, data[o + 3]);
          if (line && end[0] === a[0] && end[2] === a[2] && end[1] === a[1]) {
            line.push(b);
          } else {
            line = [a, b];
            lines.push(line);
          }
          end = b;
        } else {
          line = null;
        }
      }
    });
    return lines;
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

  // The thin walls of the lines style, as tall as the contour stands.
  function lineRibbons() {
    return contours.map((line) => {
      const base = at(bandHeight(line.k, config));
      return ribbon(line, base, base + lift);
    });
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
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
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
          ];
          const inside = f.filter((v) => v >= t).length;
          if (inside === 4 && (!solid || Math.min(...f) < above)) {
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

  const lines = trail ? trailLines() : contourLines();
  const meshes = [];
  const occluders = [];
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
  if (config.style === 'lines' && !trail) occluders.push(...lineRibbons());
  return { lines, meshes, occluders: occluders.length ? occluders : null };
}
