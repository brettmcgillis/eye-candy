/* eslint-disable no-continue, no-bitwise */
import { chain, dotPath, pathOf, simplify, smooth } from '@modules/plotKit';

export function skullField(image, mask, pen, pixelRatio) {
  let left = mask.width;
  let top = mask.height;
  let right = 0;
  let bottom = 0;
  mask.covered.forEach((on, i) => {
    if (on) {
      const x = i % mask.width;
      const y = Math.floor(i / mask.width);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  });
  if (right < left) return null;
  const step = Math.max(1, Math.round(pen * pixelRatio * 0.25));
  const width = Math.ceil((right - left + 1) / step);
  const height = Math.ceil((bottom - top + 1) / step);
  const light = new Uint8Array(width * height);
  const covered = new Uint8Array(light.length);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const at = (top + y * step) * mask.width + left + x * step;
      const i = y * width + x;
      covered[i] = mask.covered[at];
      light[i] = Math.round(
        0.2126 * image.data[at * 4] +
          0.7152 * image.data[at * 4 + 1] +
          0.0722 * image.data[at * 4 + 2]
      );
    }
  return {
    width,
    height,
    light,
    covered,
    x: left / pixelRatio,
    y: top / pixelRatio,
    scale: step / pixelRatio,
    pen,
  };
}

function randomAt(x, y, salt) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ salt;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function skullInk(field, { contrast = 0.12, dots = true } = {}) {
  if (!field) return '';
  const { width, height, covered, scale, pen } = field;
  const size = width * height;
  let light = Float32Array.from(field.light, (v) => v / 255);
  for (let pass = 0; pass < 2; pass += 1) {
    const next = light.slice();
    for (let y = 1; y < height - 1; y += 1)
      for (let x = 1; x < width - 1; x += 1) {
        const i = y * width + x;
        if (!covered[i]) continue;
        let sum = 0;
        let weight = 0;
        for (let dy = -1; dy <= 1; dy += 1)
          for (let dx = -1; dx <= 1; dx += 1) {
            const at = i + dy * width + dx;
            if (covered[at]) {
              const w = (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
              sum += light[at] * w;
              weight += w;
            }
          }
        next[i] = sum / weight;
      }
    light = next;
  }
  const strength = new Float32Array(size);
  const direction = new Int32Array(size);
  for (let y = 2; y < height - 2; y += 1)
    for (let x = 2; x < width - 2; x += 1) {
      const i = y * width + x;
      if (![i, i - 1, i + 1, i - width, i + width].every((at) => covered[at]))
        continue;
      const gx =
        (light[i - width + 1] +
          2 * light[i + 1] +
          light[i + width + 1] -
          light[i - width - 1] -
          2 * light[i - 1] -
          light[i + width - 1]) /
        4;
      const gy =
        (light[i + width - 1] +
          2 * light[i + width] +
          light[i + width + 1] -
          light[i - width - 1] -
          2 * light[i - width] -
          light[i - width + 1]) /
        4;
      strength[i] = Math.hypot(gx, gy);
      const m = Math.max(Math.abs(gx), Math.abs(gy), 1e-6);
      direction[i] = Math.round(gx / m) + Math.round(gy / m) * width;
    }
  const candidates = new Uint8Array(size);
  const kept = new Uint8Array(size);
  const queue = [];
  for (let i = width + 1; i < size - width - 1; i += 1) {
    const d = direction[i];
    const s = strength[i];
    if (
      d &&
      s >= contrast * 0.35 &&
      s >= strength[i - d] &&
      s > strength[i + d]
    ) {
      candidates[i] = 1;
      if (s >= contrast) {
        kept[i] = 1;
        queue.push(i);
      }
    }
  }
  for (let k = 0; k < queue.length; k += 1) {
    const i = queue[k];
    for (let dy = -1; dy <= 1; dy += 1)
      for (let dx = -1; dx <= 1; dx += 1) {
        const at = i + dy * width + dx;
        if (at >= 0 && at < size && candidates[at] && !kept[at]) {
          kept[at] = 1;
          queue.push(at);
        }
      }
  }
  const point = (i) => [i % width, Math.floor(i / width)];
  const segments = [];
  for (let y = 1; y < height - 1; y += 1)
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      if (!kept[i]) continue;
      [1, width, width - 1, width + 1].forEach((d) => {
        if (!kept[i + d]) return;
        if (d === width - 1 && (kept[i - 1] || kept[i + width])) return;
        if (d === width + 1 && (kept[i + 1] || kept[i + width])) return;
        segments.push([point(i), point(i + d)]);
      });
    }
  const runs = chain(segments)
    .filter(
      (run) =>
        run.reduce(
          (sum, p, i) =>
            i
              ? sum + Math.hypot(p[0] - run[i - 1][0], p[1] - run[i - 1][1])
              : 0,
          0
        ) *
          scale >=
        pen * 2.5
    )
    .map((run) =>
      smooth(simplify(run, (pen / scale) * 0.15)).map(([x, y]) => ({
        x: field.x + x * scale,
        y: field.y + y * scale,
      }))
    );
  let path = pathOf(runs);
  if (dots) {
    const pitch = (pen * 2.5) / scale;
    for (let row = 0; row * pitch < height; row += 1)
      for (let col = 0; col * pitch < width; col += 1) {
        const x =
          (col + (row % 2) * 0.5 + randomAt(col, row, 11) * 0.3) * pitch;
        const y = (row + randomAt(col, row, 23) * 0.3) * pitch;
        const i = Math.floor(y) * width + Math.floor(x);
        const threshold = randomAt(col, row, 37);
        if (
          x < width &&
          y < height &&
          covered[i] &&
          (1 - light[i]) ** 2.4 > threshold
        ) {
          let near = false;
          const radius = Math.ceil((pen / scale) * 1.5);
          for (let dy = -radius; dy <= radius && !near; dy += 1)
            for (let dx = -radius; dx <= radius; dx += 1) {
              const sx = Math.floor(x) + dx;
              const sy = Math.floor(y) + dy;
              if (
                sx < 0 ||
                sy < 0 ||
                sx >= width ||
                sy >= height ||
                !covered[sy * width + sx] ||
                kept[sy * width + sx]
              ) {
                near = true;
                break;
              }
            }
          if (!near) {
            const px = field.x + x * scale;
            const py = field.y + y * scale;
            path += dotPath(px, py, pen * 0.125, pen);
          }
        }
      }
  }
  return path;
}
