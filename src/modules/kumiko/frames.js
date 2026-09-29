import {
  bbox,
  clipPolygon,
  insetRect,
  rectPolygon,
  signedArea,
} from './geometry';

// Rectangular inner frames stepping in from the border. Each is a strip of
// `width` centred on its rect's outline.
export function nestedFrames(inner, { count, step, width }) {
  const span = Math.min(inner[2] - inner[0], inner[3] - inner[1]);
  const frames = [];
  for (let k = 1; k <= count; k += 1) {
    const rect = insetRect(inner, span * step * k);
    if (rect[2] - rect[0] < width * 4 || rect[3] - rect[1] < width * 4) break;
    frames.push({ rect, width });
  }
  return frames;
}

const contains = ([x0, y0, x1, y1], [x, y]) =>
  x >= x0 && x <= x1 && y >= y0 && y <= y1;

export const regionOf = (frames, point) =>
  frames.filter((f) => contains(f.rect, point)).length;

const overlaps = (a, b) =>
  a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

// What is left of a polygon once a frame strip is taken out: the part inside
// the strip's inner edge plus the parts in the four bands outside it.
function cutByFrame(poly, { rect, width }) {
  const outer = insetRect(rect, -width / 2);
  const box = bbox(poly);
  if (!overlaps(box, outer)) return [poly];
  const inside = insetRect(rect, width / 2);
  const [x0, y0, x1, y1] = outer;
  const far = 1e7;
  const windows = [
    inside,
    [-far, -far, x0, far],
    [x1, -far, far, far],
    [x0, -far, x1, y0],
    [x0, y1, x1, far],
  ];
  return windows
    .map((w) => clipPolygon(poly, rectPolygon(w)))
    .filter((piece) => piece.length >= 3 && signedArea(piece) > 1e-3);
}

export function cutByFrames(poly, frames) {
  return frames.reduce(
    (pieces, frame) => pieces.flatMap((piece) => cutByFrame(piece, frame)),
    [poly]
  );
}
