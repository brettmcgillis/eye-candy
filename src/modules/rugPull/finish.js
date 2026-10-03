// What a weaver and time do to a cartoon: dye lots that band (abrash), sun
// fade, pile worn down to the foundation, a deliberate flaw or two, and the
// flat-woven kilim ends.
import { R, hexToRgb } from './palettes';

function valueNoise(seed) {
  const hash = (x, y) => {
    let h = Math.imul(x * 374761393 + y * 668265263 + seed, 1274126177); // eslint-disable-line no-bitwise
    h = Math.imul(h ^ (h >>> 13), 1274126177); // eslint-disable-line no-bitwise
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295; // eslint-disable-line no-bitwise
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = smooth(x - xi);
    const fy = smooth(y - yi);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

// Swaps one yarn for another in a small patch, the way a weaver runs out of
// a colour mid-motif.
export function weaveFlaws(canvas, field, count, rng) {
  for (let n = 0; n < count; n += 1) {
    const cx = field.x0 + rng() * (field.x1 - field.x0);
    const cy = field.y0 + rng() * (field.y1 - field.y0);
    const r = 3 + rng() * 6;
    const from = canvas.get(Math.floor(cx), Math.floor(cy));
    const to =
      [R.red, R.blue, R.gold, R.green, R.ivory].find(
        (role) => role !== from && rng.chance(0.4)
      ) ?? R.camel;
    canvas.paint(cx - r, cy - r * 0.6, cx + r, cy + r * 0.6, (x, y, ix, iy) =>
      canvas.get(ix, iy) === from && Math.hypot(x - cx, (y - cy) * 1.6) < r
        ? to
        : -1
    );
  }
}

export function kilimEnds(canvas, kilimRows, rng) {
  if (kilimRows <= 0) return;
  const stripes = [R.red, R.blue, R.dark, R.gold];
  const plan = Array.from({ length: kilimRows }, (_, i) =>
    i > 0 && i < kilimRows - 1 && rng.chance(0.3)
      ? stripes[Math.floor(rng() * stripes.length)]
      : R.warp
  );
  const { cols, rows } = canvas;
  for (let i = 0; i < kilimRows; i += 1) {
    for (let x = 0; x < cols; x += 1) {
      canvas.set(x, kilimRows - 1 - i, plan[i]);
      canvas.set(x, rows - kilimRows + i, plan[i]);
    }
  }
}

// RGBA per knot: the yarn's colour after abrash and fade; alpha is the pile
// left standing (0 is bare foundation, or flat weave).
export default function finish(canvas, { colors, config, kilimRows, rng }) {
  const { cols, rows, roles } = canvas;
  const base = colors.map(hexToRgb);
  const amp = config.abrash * 0.16;
  const bands = base.map(() => {
    const offsets = new Float32Array(rows);
    let level = 0;
    let target = 0;
    let next = 0;
    for (let y = 0; y < rows; y += 1) {
      if (y >= next) {
        target = (rng() * 2 - 1) * amp * (rng.chance(0.35) ? 1 : 0.35);
        next = y + 4 + Math.floor(rng() * rows * 0.18);
      }
      level += (target - level) * 0.35;
      offsets[y] = level;
    }
    return offsets;
  });
  const wearNoise = valueNoise(Math.floor(rng() * 1e9));
  const wearScale = 7 / cols;
  const { fade } = config;
  const rgba = new Uint8Array(cols * rows * 4);

  for (let y = 0; y < rows; y += 1) {
    const kilim = y < kilimRows || y >= rows - kilimRows;
    const v = (y + 0.5) / rows - 0.5;
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x;
      const role = roles[i];
      const lift =
        1 + bands[role][y] * (role === R.warp || role === R.dark ? 0.3 : 1);
      let [r, g, b] = base[role];
      r *= lift;
      g *= lift;
      b *= lift;
      if (fade > 0) {
        const l = 0.3 * r + 0.59 * g + 0.11 * b;
        const t = fade * 0.55;
        r += (l * 1.05 + 22 - r) * t;
        g += (l * 1.02 + 16 - g) * t;
        b += (l * 0.92 + 4 - b) * t;
      }
      const u = (x + 0.5) / cols - 0.5;
      const traffic = Math.max(0, 1 - Math.hypot(u * 1.6, v * 1.1) * 2.2);
      const n =
        wearNoise(x * wearScale, y * wearScale) * 0.6 +
        wearNoise(x * wearScale * 3.1 + 40, y * wearScale * 3.1) * 0.4;
      const worn = Math.min(
        1,
        Math.max(0, config.wear * (n * 1.3 + traffic * 0.9) - 0.25)
      );
      rgba[i * 4] = Math.min(255, Math.max(0, r));
      rgba[i * 4 + 1] = Math.min(255, Math.max(0, g));
      rgba[i * 4 + 2] = Math.min(255, Math.max(0, b));
      rgba[i * 4 + 3] = kilim ? 0 : Math.round(255 * (1 - worn));
    }
  }
  return rgba;
}

// The cartoon as a flat picture: each knot a block, worn pile showing the
// foundation's cotton, and faint grid lines for the chart look.
export function rasterCartoon(build, { grid = 0.12, scale = 4, warp }) {
  const { cols, rows, rgba } = build;
  const width = cols * scale;
  const height = rows * scale;
  const out = new Uint8Array(width * height * 4);
  const [wr, wg, wb] = warp;
  for (let y = 0; y < height; y += 1) {
    const ky = Math.floor(y / scale);
    const edgeY = y % scale === 0;
    for (let x = 0; x < width; x += 1) {
      const kx = Math.floor(x / scale);
      const i = (ky * cols + kx) * 4;
      const pile = rgba[i + 3] / 255;
      const bare =
        ky >= build.kilimRows && ky < rows - build.kilimRows ? 1 - pile : 0;
      const shade = scale > 2 && (edgeY || x % scale === 0) ? 1 - grid : 1;
      const o = (y * width + x) * 4;
      out[o] = (rgba[i] + (wr - rgba[i]) * bare * 0.7) * shade;
      out[o + 1] = (rgba[i + 1] + (wg - rgba[i + 1]) * bare * 0.7) * shade;
      out[o + 2] = (rgba[i + 2] + (wb - rgba[i + 2]) * bare * 0.7) * shade;
      out[o + 3] = 255;
    }
  }
  return { data: out, height, width };
}
