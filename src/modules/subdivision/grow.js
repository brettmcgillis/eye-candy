import { hexToRgb, rgbToHex } from '@utils/paletteStops';

// The GPU's stand-in for "never" — a leaf never gives way to children.
export const LEAF_HIDE = 1e4;

export const hideAt = (node) =>
  node.leaf && !node.hole ? Infinity : node.depth + 1;

const smoothstep = (t) => t * t * (3 - 2 * t);

// `grow` is in levels. A cell splits rather than grows: at grow = d the
// children of every splitting level-(d-1) cell replace it exactly, in its
// colour and with no seams, then over [d, d+1] their seams open and their
// colours move to their own. Collapse runs it backwards — children close up,
// take their parent's colour and recombine into it. Returns that 0..1 split
// progress, or -1 while the node is not on screen. A hole shrinks away over
// that level instead. The scene's cell shader is the GPU twin of this.
export function splitProgress(node, grow) {
  const g = Math.max(0, grow);
  if (g < node.depth) return -1;
  if ((!node.leaf || node.hole) && g >= node.depth + 1) return -1;
  return smoothstep(Math.min(1, g - node.depth));
}

export const slides = (node, style) => style === 'slide' && node.from != null;

// A node's outline as drawn at `grow`: under 'slide' a split's cut sweeps in
// from a wall instead of its children opening in place, so a child grows
// from its `from` box with its outline band already open (a root still opens
// its band). Returns { band, centre, poly, t }, band being how far the
// outline band is open, or null while the node is off screen.
export function grownCell(node, grow, style) {
  const t = splitProgress(node, grow);
  if (t < 0) return null;
  const slide = slides(node, style);
  let { poly } = node;
  let centre = [node.cx, node.cy];
  if (slide) {
    const { from } = node;
    const to = [poly[0], poly[1], poly[4], poly[5]];
    const [x0, y0, x1, y1] = to.map((v, i) => from[i] + (v - from[i]) * t);
    poly = [x0, y0, x1, y0, x1, y1, x0, y1];
    centre = [(x0 + x1) / 2, (y0 + y1) / 2];
  }
  if (node.hole) {
    const k = 1 - t;
    if (k <= 0) return null;
    poly = poly.map((v, i) => centre[i % 2] + (v - centre[i % 2]) * k);
  }
  return { band: slide ? 1 : t, centre, poly, t };
}

export const fullyGrown = (piece) =>
  piece.nodes.reduce((max, node) => Math.max(max, node.depth), 0) + 1;

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (v) =>
  255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

// Mixed in linear light, as the GPU mixes, so a frame matches the scene.
export function mixHex(from, to, t) {
  if (t >= 1 || from === to) return to;
  const a = hexToRgb(from).map(toLinear);
  const b = hexToRgb(to).map(toLinear);
  return rgbToHex(a.map((v, i) => toSrgb(v + (b[i] - v) * t)));
}
