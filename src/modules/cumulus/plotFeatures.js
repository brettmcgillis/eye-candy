/* eslint-disable no-continue */
import { chain, erodeMask, simplify, smooth } from '@modules/plotKit';

export const runLength = (run) =>
  run.reduce(
    (sum, p, i) =>
      i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
    0
  );

export function structureRuns({
  camera,
  coverage,
  mask,
  normals,
  pen,
  pixelRatio,
  sensitivity,
}) {
  if (!normals) return [];
  const { width, height } = mask;
  const step = Math.max(1, Math.round(pen * pixelRatio * 0.5));
  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  const count = cols * rows;
  const normal = new Float32Array(count * 3);
  const depth = new Float32Array(count);
  const inside = new Uint8Array(count);
  const interior = erodeMask(mask, Math.ceil(pen * pixelRatio * 0.7));
  for (let y = 0; y < rows; y += 1)
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x;
      const cx = Math.min(width - 1, x * step);
      const cy = Math.min(height - 1, y * step);
      inside[i] = interior.covered[cy * width + cx];
      if (!inside[i]) continue;
      let taps = 0;
      for (let dy = -step; dy <= step; dy += 1)
        for (let dx = -step; dx <= step; dx += 1) {
          const sx = cx + dx;
          const sy = cy + dy;
          const at = sy * width + sx;
          if (
            sx < 0 ||
            sy < 0 ||
            sx >= width ||
            sy >= height ||
            !mask.covered[at]
          )
            continue;
          for (let k = 0; k < 3; k += 1)
            normal[i * 3 + k] += normals.data[at * 4 + k] / 255;
          depth[i] += coverage.data[at];
          taps += 1;
        }
      for (let k = 0; k < 3; k += 1) normal[i * 3 + k] /= taps;
      depth[i] /= taps;
    }
  const strength = new Float32Array(count);
  const direction = new Int8Array(count * 2);
  const focal = (2 * Math.tan((camera.fov * Math.PI) / 360)) / height;
  for (let y = 1; y < rows - 1; y += 1)
    for (let x = 1; x < cols - 1; x += 1) {
      const i = y * cols + x;
      if (![i, i - 1, i + 1, i - cols, i + cols].every((at) => inside[at]))
        continue;
      let gx = 0;
      let gy = 0;
      let strongest = 0;
      for (let k = 0; k < 3; k += 1) {
        const dx = normal[(i + 1) * 3 + k] - normal[(i - 1) * 3 + k];
        const dy = normal[(i + cols) * 3 + k] - normal[(i - cols) * 3 + k];
        const size = Math.hypot(dx, dy) * 3;
        if (size > strongest) {
          strongest = size;
          gx = dx;
          gy = dy;
        }
      }
      const unit = Math.max(1e-6, depth[i] * focal * step * 8);
      const dx = (depth[i + 1] - depth[i - 1]) / unit;
      const dy = (depth[i + cols] - depth[i - cols]) / unit;
      const jump =
        Math.hypot(
          depth[i + 1] + depth[i - 1] - 2 * depth[i],
          depth[i + cols] + depth[i - cols] - 2 * depth[i]
        ) / unit;
      if (jump > strongest) {
        strongest = jump;
        gx = dx;
        gy = dy;
      }
      strength[i] = strongest;
      const scale = Math.max(Math.abs(gx), Math.abs(gy), 1e-6);
      direction[i * 2] = Math.round(gx / scale);
      direction[i * 2 + 1] = Math.round(gy / scale);
    }
  const threshold = 0.12 + (1 - sensitivity) * 0.35;
  const kept = new Uint8Array(count);
  for (let i = cols + 1; i < count - cols - 1; i += 1) {
    const offset = direction[i * 2] + direction[i * 2 + 1] * cols;
    const value = strength[i];
    if (
      !offset ||
      value < threshold * 0.6 ||
      value < strength[i - offset] ||
      value <= strength[i + offset]
    )
      continue;
    if (
      value >= threshold ||
      [-cols, -1, 1, cols].some((d) => strength[i + d] >= threshold)
    )
      kept[i] = 1;
  }
  const segments = [];
  const point = (i) => [
    ((i % cols) * step) / pixelRatio,
    (Math.floor(i / cols) * step) / pixelRatio,
  ];
  for (let y = 1; y < rows - 1; y += 1)
    for (let x = 1; x < cols - 1; x += 1) {
      const i = y * cols + x;
      if (!kept[i]) continue;
      [1, cols, cols - 1, cols + 1].forEach((d) => {
        if (!kept[i + d]) return;
        if (d === cols - 1 && (kept[i - 1] || kept[i + cols])) return;
        if (d === cols + 1 && (kept[i + 1] || kept[i + cols])) return;
        segments.push([point(i), point(i + d)]);
      });
    }
  return chain(segments).map((run) =>
    smooth(simplify(run, pen * 0.25)).map(([x, y]) => ({ x, y }))
  );
}

function walkRun(run, step, visit) {
  run.forEach((b, i) => {
    if (!i) {
      visit(b);
      return;
    }
    const a = run[i - 1];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let k = 1; k <= n; k += 1)
      visit({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  });
}

export function selectFeatures(runs, anchors, pen, minLength) {
  const cell = Math.max(0.2, pen * 0.65);
  const occupied = new Set();
  const key = (x, y) => `${x},${y}`;
  const mark = (run) =>
    walkRun(run, cell * 0.5, ({ x, y }) => {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      for (let dy = -1; dy <= 1; dy += 1)
        for (let dx = -1; dx <= 1; dx += 1) occupied.add(key(cx + dx, cy + dy));
    });
  anchors.forEach(mark);
  const kept = [];
  [...runs]
    .sort((a, b) => runLength(b) - runLength(a))
    .forEach((run) => {
      let piece = [];
      const accepted = [];
      const flush = () => {
        if (piece.length > 1 && runLength(piece) >= minLength)
          accepted.push(piece);
        piece = [];
      };
      walkRun(run, cell * 0.5, (p) => {
        if (occupied.has(key(Math.floor(p.x / cell), Math.floor(p.y / cell))))
          flush();
        else piece.push(p);
      });
      flush();
      accepted.forEach((part) => {
        kept.push(part);
        mark(part);
      });
    });
  return kept;
}

export function lineClearance(mask, runs, radius, pixelRatio) {
  const { height, width } = mask;
  const covered = mask.covered.slice();
  const reach = Math.ceil(radius * pixelRatio);
  runs.forEach((run) =>
    walkRun(run, Math.max(0.25, radius * 0.5), ({ x, y }) => {
      const cx = Math.round(x * pixelRatio);
      const cy = Math.round(y * pixelRatio);
      for (let dy = -reach; dy <= reach; dy += 1)
        for (let dx = -reach; dx <= reach; dx += 1) {
          const sx = cx + dx;
          const sy = cy + dy;
          if (
            dx * dx + dy * dy <= reach * reach &&
            sx >= 0 &&
            sy >= 0 &&
            sx < width &&
            sy < height
          )
            covered[sy * width + sx] = 0;
        }
    })
  );
  return { covered, height, width };
}

export function pathRuns(path) {
  return path.split(/(?=M)/u).flatMap((part) => {
    if (/[ACHQSTV]/iu.test(part)) return [];
    const n = (part.match(/-?\d+(?:\.\d+)?/gu) ?? []).map(Number);
    const run = [];
    for (let i = 0; i + 1 < n.length; i += 2)
      run.push({ x: n[i], y: n[i + 1] });
    return run.length > 1 ? [run] : [];
  });
}

export function clipStrokePath(path, mask, pixelRatio, pen) {
  const dots = new Map();
  const cell = Math.max(0.2, pen * 2);
  let largest = 0;
  const key = (x, y) => `${x},${y}`;
  const keepDot = (part) => {
    const arcs = [
      ...part.matchAll(/A([\d.]+) ([\d.]+) 0 0 0 (-?[\d.]+) (-?[\d.]+)/gu),
    ];
    if (!arcs.length) return part;
    const last = arcs.at(-1);
    const radius = Number(last[1]) + pen * 0.5;
    const x = Number(last[3]) - Number(last[1]);
    const y = Number(last[4]);
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const reach = Math.ceil((radius + largest + pen * 0.25) / cell);
    for (let dy = -reach; dy <= reach; dy += 1)
      for (let dx = -reach; dx <= reach; dx += 1)
        if (
          (dots.get(key(cx + dx, cy + dy)) ?? []).some(
            (dot) =>
              Math.hypot(x - dot.x, y - dot.y) <
              radius + dot.radius + pen * 0.25
          )
        )
          return '';
    const bucket = key(cx, cy);
    if (!dots.has(bucket)) dots.set(bucket, []);
    dots.get(bucket).push({ x, y, radius });
    largest = Math.max(largest, radius);
    return part;
  };
  return path
    .split(/(?=M)/u)
    .map((part) => {
      if (/[ACHQSTV]/iu.test(part)) return keepDot(part);
      const run = pathRuns(part)[0] ?? [];
      const pieces = [];
      let open = [];
      const flush = () => {
        if (open.length > 1 && runLength(open) >= pen) pieces.push(open);
        open = [];
      };
      walkRun(run, Math.max(0.25, pen * 0.3), (p) => {
        const x = Math.floor(p.x * pixelRatio);
        const y = Math.floor(p.y * pixelRatio);
        if (
          x >= 0 &&
          y >= 0 &&
          x < mask.width &&
          y < mask.height &&
          mask.covered[y * mask.width + x]
        )
          open.push(p);
        else flush();
      });
      flush();
      return pieces
        .map(
          (piece) =>
            `M${simplify(
              piece.map(({ x, y }) => [x, y]),
              pen * 0.1
            )
              .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`)
              .join('L')}`
        )
        .join('');
    })
    .join('');
}

export function thinPlot(svg, anchors, pen, minLength) {
  const occupied = [...anchors];
  return svg.replace(/ d="([^"]*)"/gu, (_, path) => {
    const runs = selectFeatures(pathRuns(path), occupied, pen, minLength);
    occupied.push(...runs);
    return ` d="${runs.map((run) => `M${run.map(({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}`).join('')}"`;
  });
}
