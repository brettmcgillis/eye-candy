import { simplify } from './lines';

const DEG = Math.PI / 180;
const round = (value) => Math.round(value * 100) / 100;

// Darkness 0..1 at an output-pixel point: one minus the render's luma, zero
// off the ghost, bent by `gamma` (above 1 keeps only the deep shadows).
function createDarkness({ gamma, image, mask, pixelRatio }) {
  return (x, y) => {
    const px = Math.floor(x * pixelRatio);
    const py = Math.floor(y * pixelRatio);
    if (px < 0 || py < 0 || px >= image.width || py >= image.height) return 0;
    const i = py * image.width + px;
    if (mask && !mask.covered[i]) return 0;
    const r = image.data[i * 4];
    const g = image.data[i * 4 + 1];
    const b = image.data[i * 4 + 2];
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return (1 - luma) ** gamma;
  };
}

// Darkness equalized over the ghost's own pixels (each value becomes its
// rank among them), so a pale skin's gentle folds spread across every tone
// instead of crowding the light end under a pair of black eye holes. The
// line-drawing styles (squiggle, scribble, tsp) read this; the others keep
// absolute darkness.
export function createTone({ gamma, image, mask, pixelRatio }) {
  const raw = createDarkness({ gamma: 1, image, mask, pixelRatio });
  const BINS = 1024;
  const histogram = new Float64Array(BINS);
  let total = 0;
  for (let i = 0; i < image.width * image.height; i += 3) {
    if (!mask || mask.covered[i]) {
      const d = raw(
        (i % image.width) / pixelRatio,
        Math.floor(i / image.width) / pixelRatio
      );
      histogram[Math.min(BINS - 1, Math.floor(d * BINS))] += 1;
      total += 1;
    }
  }
  const rank = new Float64Array(BINS);
  let below = 0;
  for (let b = 0; b < BINS; b += 1) {
    rank[b] = (below + histogram[b] / 2) / Math.max(total, 1);
    below += histogram[b];
  }
  return (x, y) => {
    const d = raw(x, y);
    if (d <= 0) return 0;
    return rank[Math.min(BINS - 1, Math.floor(d * BINS))] ** gamma;
  };
}

// Deterministic 0..1 noise per integer cell, so a plot repeats exactly.
/* eslint-disable no-bitwise */
function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
/* eslint-enable no-bitwise */

// Parallel lines across the frame at `angle`, `spacing` apart; each keeps
// the runs where darkness passes `threshold`.
function hatchLayer(darkness, { angle, height, spacing, threshold, width }) {
  const dir = [Math.cos(angle), Math.sin(angle)];
  const normal = [-dir[1], dir[0]];
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.hypot(width, height) / 2;
  const step = 0.5;
  const runs = [];
  for (let offset = -reach; offset <= reach; offset += spacing) {
    let run = null;
    for (let t = -reach; t <= reach; t += step) {
      const x = cx + normal[0] * offset + dir[0] * t;
      const y = cy + normal[1] * offset + dir[1] * t;
      if (darkness(x, y) > threshold) {
        if (!run) run = { from: [x, y] };
        run.to = [x, y];
      } else if (run) {
        runs.push(run);
        run = null;
      }
    }
    if (run) runs.push(run);
  }
  return runs
    .filter(
      ({ from, to }) => Math.hypot(to[0] - from[0], to[1] - from[1]) >= 1.5
    )
    .map(
      ({ from, to }) =>
        `M${round(from[0])} ${round(from[1])}L${round(to[0])} ${round(to[1])}`
    )
    .join('');
}

const HATCHES = [
  { threshold: 0.2, turn: 0 },
  { threshold: 0.4, turn: 90 },
  { threshold: 0.6, turn: 45 },
  { threshold: 0.8, turn: -45 },
];

function crosshatch(darkness, options) {
  return HATCHES.map(({ threshold, turn }) =>
    hatchLayer(darkness, {
      ...options,
      angle: (options.angle + turn) * DEG,
      threshold,
    })
  ).join('');
}

// A filled dot in one stroke: a spiral of half-turns `pen` apart, alternately
// about the centre and half a pen east of it, out to `radius`, then once
// round the rim.
function dot(x, y, radius, pen) {
  const turns = Math.max(0, Math.floor((radius - pen * 0.5) / pen));
  const arc = (r, ex) =>
    `A${round(r)} ${round(r)} 0 0 0 ${round(ex)} ${round(y)}`;
  let r = radius - turns * pen;
  let path = `M${round(x + r)} ${round(y)}`;
  for (let i = 0; i < turns; i += 1) {
    path += arc(r, x - r);
    path += arc(r + pen * 0.5, x + r + pen);
    r += pen;
  }
  return `${path}${arc(r, x - r)}${arc(r, x + r)}`;
}

// Dots on a grid turned by `angle`, each sized so its area follows the mean
// darkness of its cell, visited boustrophedon so the pen sweeps back along
// each row.
function halftone(darkness, { angle, height, pen, spacing, width }) {
  const turn = angle * DEG;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.ceil(Math.hypot(width, height) / 2 / spacing);
  const taps = [-0.25, 0.25];
  const dots = [];
  for (let j = -reach; j <= reach; j += 1) {
    for (let k = -reach; k <= reach; k += 1) {
      const i = (j + reach) % 2 ? -k : k;
      const at = (u, v) => [
        cx + ((i + u) * cos - (j + v) * sin) * spacing,
        cy + ((i + u) * sin + (j + v) * cos) * spacing,
      ];
      const [x, y] = at(0, 0);
      if (
        x > -spacing &&
        y > -spacing &&
        x < width + spacing &&
        y < height + spacing
      ) {
        let sum = 0;
        taps.forEach((u) =>
          taps.forEach((v) => {
            sum += darkness(...at(u, v));
          })
        );
        const radius = (spacing / 2) * Math.sqrt(sum / 4);
        if (radius >= pen * 0.5) dots.push(dot(x, y, radius, pen));
      }
    }
  }
  return dots.join('');
}

// Candidate points on a jittered grid; each is kept when its own threshold
// falls under the darkness there, so density follows tone.
function stipple(darkness, { height, pen, spacing, width }) {
  const cell = spacing / 2;
  const radius = Math.max(pen * 0.5, spacing * 0.12);
  const dots = [];
  const columns = Math.ceil(width / cell);
  for (let gy = 0; gy * cell < height; gy += 1) {
    for (let k = 0; k < columns; k += 1) {
      const gx = gy % 2 ? columns - 1 - k : k;
      const x = (gx + hash(gx, gy, 11)) * cell;
      const y = (gy + hash(gx, gy, 23)) * cell;
      if (hash(gx, gy, 37) < darkness(x, y)) dots.push(dot(x, y, radius, pen));
    }
  }
  return dots.join('');
}

// Rows across the frame at `angle`, `gap` apart, walked `step` px at a time:
// `visit(base, dir, normal, row)` sees each point on the ghost and returns
// the point to draw (or null to lift the pen).
function walkRows({ angle, gap, height, inside, step, width }, visit) {
  const turn = angle * DEG;
  const dir = [Math.cos(turn), Math.sin(turn)];
  const normal = [-dir[1], dir[0]];
  const reach = Math.hypot(width, height) / 2;
  const runs = [];
  let row = 0;
  for (let offset = -reach; offset <= reach; offset += gap) {
    let run = [];
    const flush = () => {
      if (run.length > 1) runs.push(simplify(run, 0.15));
      run = [];
    };
    for (let t = -reach; t <= reach; t += step) {
      const base = [
        width / 2 + normal[0] * offset + dir[0] * t,
        height / 2 + normal[1] * offset + dir[1] * t,
      ];
      const point = inside(...base) ? visit(base, dir, normal, row, t) : null;
      if (point) run.push(point);
      else flush();
    }
    flush();
    row += 1;
  }
  return runs;
}

const polylines = (runs) =>
  runs
    .map(
      (run) => `M${run.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}`
    )
    .join('');

// Below this tone a line-drawing style lifts the pen: highlights stay paper
// rather than reading as an even fill of baseline strokes.
const HIGHLIGHT = 0.06;

// One wavy line per row: the wave grows taller and tighter with tone, and
// the pen lifts in the highlights, so the rows draw the light as much as
// the shadow.
function squiggle(darkness, { angle, height, inside, spacing, tone, width }) {
  let phase = 0;
  let lastRow = -1;
  return polylines(
    walkRows(
      { angle, gap: spacing, height, inside, step: 0.75, width },
      (base, dir, normal, row) => {
        if (row !== lastRow) {
          phase = 0;
          lastRow = row;
        }
        const d = tone(...base);
        if (d < HIGHLIGHT) return null;
        phase += (2 * Math.PI * 0.75) / (spacing * (2.6 - 2.1 * d));
        const amp = Math.sqrt(d) * spacing * 0.5 * Math.sin(phase);
        return [base[0] + normal[0] * amp, base[1] + normal[1] * amp];
      }
    )
  );
}

// Smooth 0..1 noise along a row, so a scribble's loops wander.
function rowNoise(row, t, period) {
  const i = Math.floor(t / period);
  const f = t / period - i;
  const ease = f * f * (3 - 2 * f);
  return hash(i, row, 53) * (1 - ease) + hash(i + 1, row, 53) * ease;
}

// A pen dragged along each row while it circles: mid tones curl, shadows
// coil into overlapping loops, highlights are left as paper.
function scribble(darkness, { angle, height, inside, spacing, tone, width }) {
  let phi = 0;
  let lastRow = -1;
  return polylines(
    walkRows(
      { angle, gap: spacing * 1.2, height, inside, step: 0.4, width },
      (base, dir, normal, row, t) => {
        if (row !== lastRow) {
          phi = hash(row, 7, 61) * 2 * Math.PI;
          lastRow = row;
        }
        const d = tone(...base);
        if (d < HIGHLIGHT) return null;
        phi += (0.4 * (0.2 + 2.2 * d)) / (spacing * 0.3);
        const r = d * spacing * 0.95 * (0.55 + 0.9 * rowNoise(row, t, 16));
        const c = Math.cos(phi) * r;
        const sn = Math.sin(phi) * r;
        return [
          base[0] + dir[0] * c + normal[0] * sn,
          base[1] + dir[1] * c + normal[1] * sn,
        ];
      }
    )
  );
}

// Point indices bucketed on a grid, for neighbour searches.
function createGrid(points, size) {
  const buckets = new Map();
  const key = (bx, by) => bx * 100003 + by;
  points.forEach(([x, y], index) => {
    const k = key(Math.floor(x / size), Math.floor(y / size));
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(index);
  });
  return {
    around(x, y, ring) {
      const bx = Math.floor(x / size);
      const by = Math.floor(y / size);
      const found = [];
      for (let dy = -ring; dy <= ring; dy += 1) {
        for (let dx = -ring; dx <= ring; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === ring) {
            const list = buckets.get(key(bx + dx, by + dy));
            if (list) found.push(...list);
          }
        }
      }
      return found;
    },
  };
}

// The stipple as one unbroken line: a nearest-neighbour tour through every
// point, then 2-opt (over each point's nearest neighbours) uncrossing it.
// Tone sets the point density, so shadows knot up and highlights are crossed
// by the odd long stroke, as single-line portraits are.
function tsp(darkness, { height, spacing, tone, width }) {
  const MAX_POINTS = 16000;
  const sample = (cell) => {
    const found = [];
    for (let gy = 0; gy * cell < height; gy += 1) {
      for (let gx = 0; gx * cell < width; gx += 1) {
        const x = (gx + hash(gx, gy, 11)) * cell;
        const y = (gy + hash(gx, gy, 23)) * cell;
        if (hash(gx, gy, 37) < tone(x, y) ** 2.4) found.push([x, y]);
      }
    }
    return found;
  };
  let cell = spacing * 0.4;
  let points = sample(cell);
  if (points.length > MAX_POINTS) {
    cell *= Math.sqrt(points.length / MAX_POINTS);
    points = sample(cell);
  }
  const n = points.length;
  if (n < 2) return '';
  const grid = createGrid(points, cell * 2);
  const dist = (i, j) =>
    Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);

  const visited = new Uint8Array(n);
  const tour = new Int32Array(n);
  let current = 0;
  for (let i = 0; i < n; i += 1) {
    if (points[i][0] + points[i][1] < points[current][0] + points[current][1]) {
      current = i;
    }
  }
  visited[current] = 1;
  tour[0] = current;
  let scan = 0;
  for (let step = 1; step < n; step += 1) {
    const [x, y] = points[current];
    let best = -1;
    let bestDistance = Infinity;
    for (let ring = 0; ring < 400; ring += 1) {
      const candidates = grid.around(x, y, ring);
      for (let k = 0; k < candidates.length; k += 1) {
        const c = candidates[k];
        if (!visited[c]) {
          const d = dist(current, c);
          if (d < bestDistance) {
            bestDistance = d;
            best = c;
          }
        }
      }
      if (best >= 0 && bestDistance < ring * cell * 2) break;
    }
    if (best < 0) {
      while (visited[scan]) scan += 1;
      best = scan;
    }
    visited[best] = 1;
    tour[step] = best;
    current = best;
  }

  const K = 8;
  const neighbours = points.map(([x, y], i) => {
    const near = [];
    for (let ring = 0; ring < 6 && near.length < K * 2; ring += 1) {
      near.push(...grid.around(x, y, ring).filter((j) => j !== i));
    }
    return near.sort((a, b) => dist(i, a) - dist(i, b)).slice(0, K);
  });
  const position = new Int32Array(n);
  tour.forEach((point, at) => {
    position[point] = at;
  });
  const reverse = (from, to) => {
    let i = from;
    let j = to;
    while (i < j) {
      const a = tour[i];
      const b = tour[j];
      tour[i] = b;
      tour[j] = a;
      position[b] = i;
      position[a] = j;
      i += 1;
      j -= 1;
    }
  };
  for (let pass = 0; pass < 8; pass += 1) {
    let improved = false;
    for (let i = 0; i < n - 1; i += 1) {
      const a = tour[i];
      const b = tour[i + 1];
      const ab = dist(a, b);
      const near = neighbours[a];
      for (let k = 0; k < near.length; k += 1) {
        const c = near[k];
        const j = position[c];
        if (j > i + 1 && j < n - 1) {
          const d = tour[j + 1];
          const gain = ab + dist(c, d) - dist(a, c) - dist(b, d);
          if (gain > 1e-9) {
            reverse(i + 1, j);
            improved = true;
            break;
          }
        }
      }
    }
    if (!improved) break;
  }
  return polylines([Array.from(tour, (index) => points[index])]);
}

const SHADERS = { crosshatch, halftone, scribble, squiggle, stipple, tsp };

// `svgPenMm` in output px; an unsized plot is 96 px to the inch.
export const penPx = ({ plotWidthMm, svgPenMm, width }) =>
  svgPenMm ? svgPenMm * (plotWidthMm ? width / plotWidthMm : 96 / 25.4) : null;

// The shading layer's path data, from the ghost's render (`image`, RGBA at
// output × pixelRatio) and the depth pass's coverage (`mask`).
export default function shadePath({
  angle = 45,
  gamma = 1,
  height,
  image,
  mask = null,
  pen = 0.6,
  pixelRatio = 1,
  shading,
  spacing = 6,
  width,
}) {
  const shader = SHADERS[shading];
  if (!shader || !image) return '';
  const darkness = createDarkness({ gamma, image, mask, pixelRatio });
  const tone = createTone({ gamma, image, mask, pixelRatio });
  const inside = (x, y) => {
    const px = Math.floor(x * pixelRatio);
    const py = Math.floor(y * pixelRatio);
    if (px < 0 || py < 0 || px >= image.width || py >= image.height) {
      return false;
    }
    return mask ? Boolean(mask.covered[py * image.width + px]) : true;
  };
  return shader(darkness, {
    angle,
    height,
    inside,
    pen: Math.max(pen, 0.3),
    tone,
    spacing,
    width,
  });
}
