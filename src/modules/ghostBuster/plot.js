import { createProjector } from './framing';
import shadePath from './shading';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const round = (value) => Math.round(value * 100) / 100;

// The material's alphaTest: cloth above this alpha is drawn, however faint.
const ALPHA_CUT = 0.01;

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit3 = (v) => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

// The draped cloth exactly as the GPU draws it: one render vertex per sim
// quad (the mean of its corners, alpha included), dead quads dropped, and
// each grid cell split into the two triangles the index buffer uses, so a
// line drawn in UV lands on the drawn surface. Eye holes are cut per pixel
// as the shader cuts them, in its UVs (whose v runs opposite the lattice).
function createSurface({
  alpha,
  cutouts,
  positions,
  segmentsX,
  segmentsY,
  shapeDist,
}) {
  const simAt = (x, y) => x * (segmentsY + 1) + y;
  const count = segmentsX * segmentsY;
  const at = (gx, gy) => gy * segmentsX + gx;
  const rPos = new Float64Array(count * 3);
  const rAlpha = new Float64Array(count);
  const live = new Uint8Array(count);
  for (let gx = 0; gx < segmentsX; gx += 1) {
    for (let gy = 0; gy < segmentsY; gy += 1) {
      const corners = [
        simAt(gx, gy),
        simAt(gx + 1, gy),
        simAt(gx, gy + 1),
        simAt(gx + 1, gy + 1),
      ];
      const m = at(gx, gy);
      live[m] = corners.every((c) => shapeDist[c] >= 0) ? 1 : 0;
      corners.forEach((c) => {
        rAlpha[m] += alpha[c] / 4;
        for (let k = 0; k < 3; k += 1)
          rPos[m * 3 + k] += positions[c * 3 + k] / 4;
      });
    }
  }

  // The cell holding (u, v), the triangle it falls in, and its weights.
  function locate(u, v) {
    const fx = Math.min(Math.max(u * segmentsX - 0.5, 0), segmentsX - 1.000001);
    const fy = Math.min(Math.max(v * segmentsY - 0.5, 0), segmentsY - 1.000001);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const c00 = at(x0, y0);
    const c10 = at(x0 + 1, y0);
    const c01 = at(x0, y0 + 1);
    const c11 = at(x0 + 1, y0 + 1);
    const inside =
      u * segmentsX >= 0.5 &&
      u * segmentsX <= segmentsX - 0.5 &&
      v * segmentsY >= 0.5 &&
      v * segmentsY <= segmentsY - 0.5;
    return ty >= tx
      ? {
          alive: inside && live[c11] && live[c01] && live[c00],
          weights: [
            [c00, 1 - ty],
            [c01, ty - tx],
            [c11, tx],
          ],
        }
      : {
          alive: inside && live[c11] && live[c00] && live[c10],
          weights: [
            [c00, 1 - tx],
            [c10, tx - ty],
            [c11, ty],
          ],
        };
  }

  const mix = (array, stride, offset, weights) =>
    weights.reduce((sum, [m, w]) => sum + array[m * stride + offset] * w, 0);

  // The drawn alpha; above ALPHA_CUT is cloth.
  function field(u, v) {
    const { alive, weights } = locate(u, v);
    if (!alive) return 0;
    let f = mix(rAlpha, 1, 0, weights);
    cutouts.forEach(({ fade, radius, u: cu, v: cv }) => {
      const width = fade ?? radius * 0.4;
      const inner = radius - width;
      f *= clamp01((Math.hypot(u - cu, 1 - v - cv) - inner) / width);
    });
    return f;
  }

  function point(u, v) {
    const { weights } = locate(u, v);
    return [0, 1, 2].map((axis) => mix(rPos, 3, axis, weights));
  }

  // Vertex normals as the shader builds them (across and along the grid),
  // for the fold contours: where the cloth turns edge-on to the camera.
  const rNormal = new Float64Array(count * 3);
  const posAt = (gx, gy) => {
    const m = at(
      Math.min(Math.max(gx, 0), segmentsX - 1),
      Math.min(Math.max(gy, 0), segmentsY - 1)
    );
    return [rPos[m * 3], rPos[m * 3 + 1], rPos[m * 3 + 2]];
  };
  for (let gx = 0; gx < segmentsX; gx += 1) {
    for (let gy = 0; gy < segmentsY; gy += 1) {
      const n = unit3(
        cross3(
          sub3(posAt(gx, gy + 1), posAt(gx, gy - 1)),
          sub3(posAt(gx + 1, gy), posAt(gx - 1, gy))
        )
      );
      rNormal.set(n, at(gx, gy) * 3);
    }
  }
  function facing(u, v, eye) {
    const { weights } = locate(u, v);
    const p = [0, 1, 2].map((axis) => mix(rPos, 3, axis, weights));
    const n = [0, 1, 2].map((axis) => mix(rNormal, 3, axis, weights));
    const view = unit3(sub3(p, eye));
    return n[0] * view[0] + n[1] * view[1] + n[2] * view[2];
  }

  return {
    facing,
    field,
    point,
    resolution: Math.max(segmentsX, segmentsY),
  };
}

function uvLines(style, count, step) {
  const lines = [];
  const ring = (r) => {
    const n = Math.max(12, Math.ceil((2 * Math.PI * r) / step));
    lines.push(
      Array.from({ length: n + 1 }, (_, i) => {
        const a = (i / n) * 2 * Math.PI;
        return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
      })
    );
  };
  const spoke = (a) => {
    const n = Math.ceil(0.5 / step);
    lines.push(
      Array.from({ length: n + 1 }, (_, i) => {
        const r = (i / n) * 0.5;
        return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
      })
    );
  };
  const straight = (fixed, along) => {
    const n = Math.ceil(1 / step);
    lines.push(
      Array.from({ length: n + 1 }, (_, i) =>
        along === 'u' ? [i / n, fixed] : [fixed, i / n]
      )
    );
  };

  if (style === 'rings' || style === 'mesh') {
    for (let k = 1; k <= count; k += 1) ring((k / count) * 0.5);
  }
  if (style === 'spokes' || style === 'mesh') {
    for (let k = 0; k < count; k += 1) spoke((k / count) * 2 * Math.PI);
  }
  if (style === 'grid') {
    for (let k = 1; k < count; k += 1) {
      straight(k / count, 'u');
      straight(k / count, 'v');
    }
  }
  return lines;
}

// Marching squares at `level` of a UV field, as short segments in UV. With
// `keep`, a cell counts only where every corner passes it (the cloth).
function isoSegments(fn, resolution, level, keep = null) {
  const n = resolution;
  const values = new Float32Array((n + 1) * (n + 1));
  const kept = new Uint8Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) {
      values[j * (n + 1) + i] = fn(i / n, j / n);
      kept[j * (n + 1) + i] = !keep || keep(i / n, j / n) ? 1 : 0;
    }
  }
  const at = (i, j) => values[j * (n + 1) + i];
  const cross = (i0, j0, i1, j1) => {
    const a = at(i0, j0);
    const b = at(i1, j1);
    const t = (level - a) / (b - a);
    return [(i0 + (i1 - i0) * t) / n, (j0 + (j1 - j0) * t) / n];
  };
  const segments = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const corners = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      if (corners.every(([ci, cj]) => kept[cj * (n + 1) + ci])) {
        const hits = [];
        for (let e = 0; e < 4; e += 1) {
          const [a0, a1] = corners[e];
          const [b0, b1] = corners[(e + 1) % 4];
          if (at(a0, a1) > level !== at(b0, b1) > level) {
            hits.push(cross(a0, a1, b0, b1));
          }
        }
        if (hits.length === 2) segments.push(hits);
        if (hits.length === 4)
          segments.push([hits[0], hits[1]], [hits[2], hits[3]]);
      }
    }
  }
  return segments;
}

// Joins segments that share an end into polylines, so a pen lifts once per
// edge rather than once per cell.
function chain(segments) {
  const key = ([u, v]) => `${Math.round(u * 1e6)},${Math.round(v * 1e6)}`;
  const ends = new Map();
  segments.forEach((segment, index) => {
    segment.forEach((p) => {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(index);
    });
  });
  const used = new Uint8Array(segments.length);
  const next = (p) => (ends.get(key(p)) ?? []).find((index) => !used[index]);
  const lines = [];
  segments.forEach((segment, start) => {
    if (used[start]) return;
    used[start] = 1;
    const line = [...segment];
    for (let grow = 0; grow < 2; grow += 1) {
      for (;;) {
        const tail = line[line.length - 1];
        const index = next(tail);
        if (index === undefined) break;
        used[index] = 1;
        const [a, b] = segments[index];
        line.push(key(a) === key(tail) ? b : a);
      }
      line.reverse();
    }
    lines.push(line);
  });
  return lines;
}

// Marching squares over the depth pass's coverage: the outline of the cloth
// as the camera sees it, in mask pixels (cell corners at pixel centres).
function maskSegments({ covered, height, width }) {
  const at = (x, y) => covered[y * width + x];
  const mid = (x0, y0, x1, y1) => [(x0 + x1) / 2 + 0.5, (y0 + y1) / 2 + 0.5];
  const segments = [];
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const corners = [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ];
      const hits = [];
      for (let e = 0; e < 4; e += 1) {
        const [ax, ay] = corners[e];
        const [bx, by] = corners[(e + 1) % 4];
        if (at(ax, ay) !== at(bx, by)) hits.push(mid(ax, ay, bx, by));
      }
      if (hits.length === 2) segments.push(hits);
      if (hits.length === 4)
        segments.push([hits[0], hits[1]], [hits[2], hits[3]]);
    }
  }
  return segments;
}

// Ramer–Douglas–Peucker: the pixel staircase becomes a few true strokes.
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let worst = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
    if (d > worst) {
      worst = d;
      index = i;
    }
  }
  if (worst <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

// A closed loop's ends coincide, which leaves RDP no chord to measure from;
// it is split at the point farthest from its start instead.
function simplifyLoop(points, tolerance) {
  const [x0, y0] = points[0];
  const [ex, ey] = points[points.length - 1];
  if (points.length < 4 || x0 !== ex || y0 !== ey) {
    return simplify(points, tolerance);
  }
  let far = 1;
  let best = -1;
  points.forEach(([x, y], i) => {
    const d = Math.hypot(x - x0, y - y0);
    if (d > best) {
      best = d;
      far = i;
    }
  });
  return [
    ...simplify(points.slice(0, far + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(far), tolerance),
  ];
}

// One round of Chaikin corner cutting, keeping a closed loop closed.
function smooth(points) {
  if (points.length < 3) return points;
  const closed =
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1];
  const out = closed ? [] : [points[0]];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
    out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  if (closed) out.push(out[0]);
  else out.push(points[points.length - 1]);
  return out;
}

const pathOf = (runs) =>
  runs
    .map((run) => `M${run.map((p) => `${round(p.x)} ${round(p.y)}`).join('L')}`)
    .join('');

const layer = (index, label, stroke, d) =>
  `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${label} #000000" id="pen-${index}" ` +
  `fill="none" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="${d}"/></g>`;

// Line work for a settled ghost: UV contours drawn across the cloth, its
// edges and (`folds`) where it turns edge-on to the camera, projected through the capture camera and cut wherever the cloth is
// missing or (given `visible`) hidden behind nearer cloth; and, given the
// depth pass's `coverage`, the silhouette and the `shade` (crosshatch,
// halftone or stipple from the render) each on a layer of their own.
export default function renderGhostSvg({
  camera,
  edges = true,
  folds = true,
  height,
  lattice,
  lines = 40,
  paper = '#ffffff',
  coverage = null,
  image = null,
  pixelRatio = 1,
  shade = null,
  silhouette = false,
  stroke = 0.6,
  style = 'rings',
  visible = null,
  width,
}) {
  const surface = createSurface(lattice);
  const project = createProjector(camera, width, height);
  const step = 1 / (surface.resolution * 3);
  const paths = [];

  // On the silhouette (an uncovered pixel within two of it): the outline
  // layer draws it, so edges and folds there would only double the stroke.
  const onOutline =
    silhouette && coverage
      ? (x, y) => {
          const px = Math.round(x * pixelRatio);
          const py = Math.round(y * pixelRatio);
          for (let dy = -2; dy <= 2; dy += 1) {
            for (let dx = -2; dx <= 2; dx += 1) {
              const sx = px + dx;
              const sy = py + dy;
              if (
                sx < 0 ||
                sy < 0 ||
                sx >= coverage.width ||
                sy >= coverage.height ||
                !coverage.covered[sy * coverage.width + sx]
              ) {
                return true;
              }
            }
          }
          return false;
        }
      : () => false;

  const trace = (uvs, into, { onEdge = false } = {}) => {
    let run = [];
    const flush = () => {
      if (run.length > 1) into.push(run);
      run = [];
    };
    uvs.forEach(([u, v]) => {
      const onCloth = onEdge || surface.field(u, v) > ALPHA_CUT;
      const [x, y, z] = surface.point(u, v);
      const p = project(x, y, z);
      const shown =
        onCloth &&
        p.depth > 0 &&
        p.x >= -1 &&
        p.y >= -1 &&
        p.x <= width + 1 &&
        p.y <= height + 1 &&
        !(onEdge && onOutline(p.x, p.y)) &&
        (!visible || visible(p.x, p.y, p.depth));
      if (shown) run.push(p);
      else flush();
    });
    flush();
  };

  const fine = surface.resolution * 3;
  uvLines(style, lines, step).forEach((uvs) => trace(uvs, paths));
  if (edges) {
    chain(isoSegments(surface.field, fine * 2, ALPHA_CUT)).forEach((uvs) =>
      trace(uvs, paths, { onEdge: true })
    );
  }
  const foldRuns = [];
  if (folds) {
    chain(
      isoSegments(
        (u, v) => surface.facing(u, v, camera.eye),
        fine,
        0,
        (u, v) => surface.field(u, v) > ALPHA_CUT
      )
    ).forEach((uvs) => trace(uvs, foldRuns, { onEdge: true }));
  }
  const strokeLength = (run) =>
    run.reduce(
      (sum, p, i) =>
        i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
      0
    );
  const foldPaths = foldRuns.filter((run) => strokeLength(run) >= 6);

  const outline =
    silhouette && coverage
      ? chain(maskSegments(coverage)).map((loop) =>
          smooth(simplifyLoop(loop, 0.6)).map(([x, y]) => ({
            x: x / pixelRatio,
            y: y / pixelRatio,
          }))
        )
      : [];

  const shading = shade
    ? shadePath({
        ...shade,
        image,
        height,
        mask: coverage,
        pen: stroke,
        pixelRatio,
        width,
      })
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${paper}">` +
    `${layer(0, 'contours', stroke, pathOf(paths))}` +
    `${outline.length ? layer(1, 'silhouette', stroke, pathOf(outline)) : ''}` +
    `${shading ? layer(2, 'shading', stroke, shading) : ''}` +
    `${foldPaths.length ? layer(3, 'folds', stroke, pathOf(foldPaths)) : ''}</svg>`
  );
}

// The render options a plot reads, as renderGhostSvg's arguments; a caller
// adds the camera, lattice, image and depth it captured.
export function plotArgs(options) {
  return {
    edges: options.svgEdges,
    folds: options.svgFolds,
    height: options.height,
    lines: options.svgLines,
    paper: options.svgPaper,
    pixelRatio: options.pixelRatio,
    shade:
      options.svgShading && options.svgShading !== 'none'
        ? {
            angle: options.svgShadeAngle,
            gamma: options.svgShadeGamma,
            shading: options.svgShading,
            spacing: options.svgShadeSpacing,
          }
        : null,
    silhouette: options.svgSilhouette,
    stroke: options.svgStroke,
    style: options.svgStyle,
    width: options.width,
  };
}

// Whether a plot needs the cloth-only depth pass.
export const needsDepth = (options) =>
  Boolean(
    options.svgOcclusion ||
    options.svgSilhouette ||
    (options.svgShading && options.svgShading !== 'none')
  );
