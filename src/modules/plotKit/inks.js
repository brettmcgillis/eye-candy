import { inkRuns, nearestInk } from './color';
import { pathOf, plotLayer } from './contours';

// Every pixel of `image` (inside `mask`) as the index of its nearest
// palette ink, -1 outside: the map a colour plot sorts its strokes and
// fills by.
export function inkMap({ image, mask = null, palette }) {
  const { height, width } = image;
  const nearest = nearestInk(palette);
  const cache = new Map();
  const ink = new Int16Array(width * height).fill(-1);
  for (let i = 0; i < width * height; i += 1) {
    if (!mask || mask.covered[i]) {
      const r = image.data[i * 4];
      const g = image.data[i * 4 + 1];
      const b = image.data[i * 4 + 2];
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3); // eslint-disable-line no-bitwise
      if (!cache.has(key)) cache.set(key, nearest([r, g, b]));
      ink[i] = cache.get(key);
    }
  }
  return { height, ink, width };
}

// An ink map read at output-pixel points: the ink there, or -1.
export const inkAt =
  (map, pixelRatio = 1) =>
  (x, y) => {
    const px = Math.floor(x * pixelRatio);
    const py = Math.floor(y * pixelRatio);
    if (px < 0 || py < 0 || px >= map.width || py >= map.height) return -1;
    return map.ink[py * map.width + px];
  };

// The pixels of one ink as a coverage mask (for shading that region alone),
// optionally limited to `within`.
export function inkMask(map, index, within = null) {
  const covered = new Uint8Array(map.width * map.height);
  for (let i = 0; i < covered.length; i += 1) {
    covered[i] = map.ink[i] === index && (!within || within.covered[i]) ? 1 : 0;
  }
  return { covered, height: map.height, width: map.width };
}

// A colour plot's layers: one per palette ink, `pen-${firstPen + i}`,
// gathering every part drawn in that ink. A part is `{ runs, inkAt }`
// (strokes split where the ink under them changes), `{ dots, inkAt }`
// (`[{ x, y, d }]`, each dot in the ink under it), `{ shade: index → d }`
// (path data drawn per ink, as region fills) or `{ ink, d }` (one ink).
export function composeInks(palette, parts, { firstPen = 20, stroke }) {
  const paths = palette.map(() => []);
  parts.forEach((part) => {
    if (part.runs?.length) {
      Object.entries(inkRuns(part.runs, part.inkAt)).forEach(([ink, runs]) =>
        paths[ink].push(pathOf(runs))
      );
    } else if (part.dots?.length) {
      part.dots.forEach((dot) => {
        const ink = part.inkAt(dot.x, dot.y);
        if (ink >= 0) paths[ink].push(dot.d);
      });
    } else if (part.shade) {
      palette.forEach((_, ink) => {
        const d = part.shade(ink);
        if (d) paths[ink].push(d);
      });
    } else if (part.d && part.ink >= 0) {
      paths[part.ink].push(part.d);
    }
  });
  return palette
    .map((entry, i) =>
      paths[i].length
        ? plotLayer(
            firstPen + i,
            `ink ${i + 1}`,
            stroke,
            paths[i].join(''),
            entry.color
          )
        : ''
    )
    .join('');
}
