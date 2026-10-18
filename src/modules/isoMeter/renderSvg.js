import { toHex } from './color';
import {
  OUTLINE,
  collectEdges,
  latticeX,
  latticeY,
  triangleCorners,
} from './lattice';

const fmt = (n) => (Math.round(n * 100) / 100).toString();

export function projector(piece, { zoom = 1 } = {}) {
  const L = 6 * zoom * (piece.unit ?? 1);
  const { i, j, k } = piece.center;
  const a0 = k - j;
  const b0 = i - k;
  const c0 = j - i;
  const ox = -latticeX(a0, b0, c0) * L;
  const oy = -latticeY(a0, b0, c0) * L;
  return ([a, b, c]) => [
    ox + latticeX(a, b, c) * L,
    oy + latticeY(a, b, c) * L,
  ];
}

const segmentPath = (segments, project) =>
  segments
    .map(([from, to]) => {
      const [x1, y1] = project(from);
      const [x2, y2] = project(to);
      return `M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`;
    })
    .join('');

export function canvasFit(reference, canvas) {
  const s = Math.min(
    canvas.width / reference.width,
    canvas.height / reference.height
  );
  const width = canvas.width / s;
  const height = canvas.height / s;
  return { height, width, x: -width / 2, y: -height / 2 };
}

export default function renderSvg(
  piece,
  build,
  {
    background = true,
    canvas = null,
    fill = true,
    ink = '#000000',
    lineWidth = 1,
    outlineMode = OUTLINE.all,
    outlineWidth = 3,
    style = 'final',
    zoom = 1,
  } = {}
) {
  const project = projector(piece, { zoom });
  const final = style === 'final';
  const view = canvasFit(piece.reference, canvas ?? piece.reference);
  const size = canvas ?? piece.reference;
  const heights = build.heights();
  const parts = [];
  if (fill) {
    const byColor = new Map();
    build.lattice.map.forEach((tri) => {
      const color = toHex(final ? piece.shade(tri, heights) : piece.background);
      const pts = triangleCorners(tri)
        .map((p) => project(p).map(fmt).join(' '))
        .join('L');
      byColor.set(color, `${byColor.get(color) ?? ''}M${pts}Z`);
    });
    byColor.forEach((d, color) => {
      parts.push(
        `<path fill="${color}" stroke="${color}" stroke-width="0.5" d="${d}"/>`
      );
    });
  }
  const { lines, outlines } = collectEdges(build.lattice, {
    outlineMode,
    threshold: final ? piece.edgeThreshold : 1,
  });
  if (outlineWidth > 0) {
    parts.push(
      `<path fill="none" stroke="${ink}" stroke-width="${outlineWidth}" stroke-linecap="round" d="${segmentPath(outlines, project)}"/>`
    );
  }
  if (outlineMode < 3 && lineWidth > 0) {
    parts.push(
      `<path fill="none" stroke="${ink}" stroke-width="${lineWidth}" stroke-linecap="round" d="${segmentPath(lines, project)}"/>`
    );
  }
  const box = [view.x, view.y, view.width, view.height].map(fmt);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" width="${size.width}" height="${size.height}">`,
    background
      ? `<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" fill="${toHex(piece.background)}"/>`
      : '',
    ...parts,
    '</svg>',
  ].join('\n');
}
