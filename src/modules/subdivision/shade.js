import { hexToRgb, rgbToHex, samplePalette } from '@utils/paletteStops';

import { hashInt2 } from './cellNoise';
import { jitterHash } from './tree';

const GREYSCALE = ['#101010', '#f0f0f0'];
const luma = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

// Mirrored wrap, the way gradientPalette's LUT folds a shifted coordinate.
function fold(t) {
  const m = ((t % 2) + 2) % 2;
  return m > 1 ? 2 - m : m;
}

function positionT(node, config, canvas) {
  const { height, width } = canvas;
  const dx = node.fcx - width / 2;
  const dy = node.fcy - height / 2;
  if (config.gradientRadial)
    return Math.hypot(dx, dy) / Math.hypot(width / 2, height / 2);
  const a = (config.gradientAngle * Math.PI) / 180;
  const reach = Math.abs(Math.cos(a)) * width + Math.abs(Math.sin(a)) * height;
  return 0.5 + (dx * Math.cos(a) + dy * Math.sin(a)) / reach;
}

function rawT(node, config, ctx) {
  switch (config.colorMode) {
    case 'value':
      return ctx.field(node.fcx, node.fcy);
    case 'random':
      return (
        hashInt2(
          node.key[0] * 3 + node.key[2] + config.colorSeed,
          node.key[1] * 7 + node.depth * 131
        ) / 0xffffffff
      );
    case 'position':
      return positionT(node, config, ctx.canvas);
    case 'source':
      return 0;
    default:
      return config.levels > 0 ? node.depth / config.levels : 0;
  }
}

export function paletteStopsFor(stops) {
  return stops && stops.length > 0 ? stops : GREYSCALE;
}

// Every node, internal ones included: the scene shows parents while it grows.
// The cell's mean colour, near enough: its centroid and the points halfway
// from there to each corner, read at the folded position so mirrored twins
// agree. Five samples steady a live webcam where one centre pixel flickers.
function sourceRgb(node, tree, sourceColor, field) {
  const points = [[node.cx, node.cy]];
  for (let i = 0; i < node.poly.length; i += 2) {
    points.push([
      (node.cx + node.poly[i]) / 2,
      (node.cy + node.poly[i + 1]) / 2,
    ]);
  }
  const sum = [0, 0, 0];
  points.forEach(([x, y]) => {
    const [fx, fy] = tree.fold(x, y);
    const rgb = sourceColor
      ? sourceColor(fx, fy)
      : [0, 1, 2].map(() => field(fx, fy) * 255);
    rgb.forEach((c, i) => {
      sum[i] += c / points.length;
    });
  });
  return sum;
}

export default function shadeTree(tree, config, field, stops, sourceColor) {
  const palette = paletteStopsFor(stops);
  const edgeRgb = hexToRgb(config.outlineColor);
  const ctx = { canvas: tree.canvas, field };
  const mix = config.outlineStrength;

  tree.nodes.forEach((node) => {
    let t = fold(rawT(node, config, ctx) + config.paletteShift);
    if (config.paletteReverse) t = 1 - t;
    const jitter = (jitterHash(node) * 2 - 1) * config.jitterAmount + 1;
    const base =
      config.colorMode === 'source'
        ? sourceRgb(node, tree, sourceColor, field)
        : samplePalette(palette, t, config.paletteExact);
    const rgb = base.map((c) => Math.min(255, c * jitter));
    const edge = rgb.map((c, i) => c + (edgeRgb[i] - c) * mix);

    Object.assign(node, {
      edge: rgbToHex(edge),
      fill: rgbToHex(rgb),
      lum: luma(rgb),
      stop: Math.round(
        (config.colorMode === 'source' ? luma(rgb) : t) * (palette.length - 1)
      ),
      t,
    });
  });

  return { ...tree, palette };
}
