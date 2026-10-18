import { toHex } from './color';

const fmt = (n) => (Math.round(n * 100) / 100).toString();
const pts = (points) => points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L');

export default function createSvgPainter({
  height,
  mirroredX = false,
  mirroredY = false,
  refSize,
  width,
}) {
  const parts = [];
  return {
    background(rgb) {
      parts.length = 0;
      parts.push(
        `<rect x="${-width}" y="${-height}" width="${2 * width}" height="${2 * height}" fill="${toHex(rgb)}"/>`
      );
    },
    polygon(points, { fill, stroke }) {
      const strokeAttrs = stroke
        ? ` stroke="${toHex(stroke.color)}" stroke-width="${fmt(stroke.width)}"`
        : '';
      parts.push(
        `<path d="M${pts(points)}Z" fill="${fill ? toHex(fill) : 'none'}"${strokeAttrs}/>`
      );
    },
    segments(list, { color, width: lineWidth }) {
      if (!list.length) return;
      const d = list.map(([p, q]) => `M${pts([p, q])}`).join('');
      parts.push(
        `<path d="${d}" fill="none" stroke="${toHex(color)}" stroke-width="${fmt(lineWidth)}" stroke-linecap="round"/>`
      );
    },
    toString() {
      const s = Math.min(width, height) / refSize;
      const scale = `scale(${(mirroredX ? -1 : 1) * s} ${(mirroredY ? -1 : 1) * s})`;
      return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-width / 2} ${-height / 2} ${width} ${height}" width="${width}" height="${height}">`,
        `<g transform="${scale}">`,
        ...parts,
        '</g>',
        '</svg>',
      ].join('\n');
    },
    triangles(list) {
      const byColor = new Map();
      list.forEach(({ fill, points }) => {
        const hex = toHex(fill);
        byColor.set(hex, `${byColor.get(hex) ?? ''}M${pts(points)}Z`);
      });
      byColor.forEach((d, hex) => {
        parts.push(`<path d="${d}" fill="${hex}"/>`);
      });
    },
  };
}
