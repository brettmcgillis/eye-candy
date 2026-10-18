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

// A dot a pen can fill: concentric circles from its radius inward.
function dot(x, y, radius, pen) {
  const rings = [];
  for (let r = radius; r > pen * 0.5; r -= pen) {
    rings.push(
      `M${round(x - r)} ${round(y)}a${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0a${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0`
    );
  }
  return rings.join('');
}

// Dots on a grid turned by `angle`, each sized so its area follows the mean
// darkness of its cell.
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
    for (let i = -reach; i <= reach; i += 1) {
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
  for (let gy = 0; gy * cell < height; gy += 1) {
    for (let gx = 0; gx * cell < width; gx += 1) {
      const x = (gx + hash(gx, gy, 11)) * cell;
      const y = (gy + hash(gx, gy, 23)) * cell;
      if (hash(gx, gy, 37) < darkness(x, y)) dots.push(dot(x, y, radius, pen));
    }
  }
  return dots.join('');
}

const SHADERS = { crosshatch, halftone, stipple };

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
  return shader(darkness, {
    angle,
    height,
    pen: Math.max(pen, 0.3),
    spacing,
    width,
  });
}
