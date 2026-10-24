import { chain, simplifyLoop, smooth } from './lines';
import { maskedSegments } from './texture';

const inkCount = (ink) => ink.reduce((most, k) => Math.max(most, k + 1), 0);

// Each pixel's most common ink within `radius` px (-1 stays -1), so grain
// and specks fold into the region round them before it is traced.
function modeFiltered({ height, ink, width }, radius) {
  const inks = inkCount(ink);
  if (radius < 1 || inks < 2) return ink;
  const best = new Uint16Array(width * height);
  const out = Int16Array.from(ink);
  const row = new Uint16Array(width * height);
  for (let k = 0; k < inks; k += 1) {
    for (let y = 0; y < height; y += 1) {
      let sum = 0;
      const base = y * width;
      for (let x = -radius; x < width; x += 1) {
        const add = x + radius;
        const drop = x - radius - 1;
        if (add < width && ink[base + add] === k) sum += 1;
        if (drop >= 0 && ink[base + drop] === k) sum -= 1;
        if (x >= 0) row[base + x] = sum;
      }
    }
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let y = -radius; y < height; y += 1) {
        const add = y + radius;
        const drop = y - radius - 1;
        if (add < height) sum += row[add * width + x];
        if (drop >= 0) sum -= row[drop * width + x];
        if (y >= 0) {
          const i = y * width + x;
          if (ink[i] >= 0 && sum > best[i]) {
            best[i] = sum;
            out[i] = k;
          }
        }
      }
    }
  }
  return out;
}

// The boundaries between the inks of an ink map, as line work in output
// px: { [ink]: runs }. The map is mode-filtered first, each ink's regions
// are traced inside `coverage`, and every boundary is drawn once, in
// whichever of its two inks covers less of the frame — the sticker's ink,
// not the dumpster's round it. Runs shorter than `minLength` are dropped.
export default function inkEdgeRuns({
  coverage,
  map,
  minLength = 12,
  pixelRatio = 1,
  radius = 2,
}) {
  const { height, width } = map;
  const ink = modeFiltered(map, Math.round(radius * pixelRatio));
  const inks = inkCount(ink);
  const area = new Float64Array(inks);
  ink.forEach((k, i) => {
    if (k >= 0 && coverage.covered[i]) area[k] += 1;
  });
  const at = (x, y) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= width || py >= height) return -1;
    return ink[py * width + px];
  };
  const owns = (k, other) =>
    other >= 0 &&
    other !== k &&
    (area[k] < area[other] || (area[k] === area[other] && k < other));
  const reach = 2 * pixelRatio;
  const byInk = {};
  const covered = new Uint8Array(width * height);
  const field = new Float32Array(width * height);
  for (let k = 0; k < inks; k += 1) {
    if (area[k]) {
      for (let i = 0; i < field.length; i += 1) {
        field[i] = ink[i] === k ? 1 : 0;
        covered[i] = coverage.covered[i] && ink[i] >= 0 ? 1 : 0;
      }
      const runs = [];
      chain(maskedSegments(field, covered, width, height, 0.5)).forEach(
        (loop) => {
          const line = smooth(simplifyLoop(loop, 0.6 * pixelRatio));
          let piece = [];
          const flush = () => {
            const run = piece.map(([x, y]) => ({
              x: x / pixelRatio,
              y: y / pixelRatio,
            }));
            const length = run.reduce(
              (sum, p, i) =>
                i
                  ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y)
                  : 0,
              0
            );
            if (run.length > 1 && length >= minLength) runs.push(run);
            piece = [];
          };
          line.forEach(([x, y], i) => {
            const [ax, ay] = line[Math.max(0, i - 1)];
            const [bx, by] = line[Math.min(line.length - 1, i + 1)];
            const length = Math.hypot(bx - ax, by - ay) || 1;
            const nx = (-(by - ay) / length) * reach;
            const ny = ((bx - ax) / length) * reach;
            const left = at(x + nx - 0.5, y + ny - 0.5);
            const right = at(x - nx - 0.5, y - ny - 0.5);
            const other = left === k ? right : left;
            if (owns(k, other)) piece.push([x, y]);
            else flush();
          });
          flush();
        }
      );
      if (runs.length) byInk[k] = runs;
    }
  }
  return byInk;
}
