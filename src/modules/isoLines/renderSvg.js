import { rgbToHex } from '@utils/paletteStops';

import colorAt, { lineColorAt } from './palette';

const fmt = (v) => Number(v.toFixed(2));

// The plot: the contours in plan, flat or in relief (a plotter
// draws a map, not a perspective), chained end to end, one Inkscape layer
// per pen. Levels share pens low to high and each pen takes its levels' mean
// colour. No background rect — a plotter would trace it.
export default function renderIsoSvg({
  aspect,
  config,
  height,
  lines,
  minLength = 0,
  pens = 4,
  stops = null,
  stroke = 0.6,
  width,
}) {
  const sx = width / (2 * aspect);
  const sy = height / 2;
  const toPx = (x, y) => [(x + aspect) * sx, (1 - y) * sy];
  const colorOf = config.style === 'lines' ? lineColorAt : colorAt;
  const groups = Array.from({ length: pens }, () => ({
    color: [0, 0, 0],
    levels: 0,
    paths: [],
  }));
  const seen = new Set();

  lines.forEach(({ closed, level, points }) => {
    const pen = Math.min(pens - 1, Math.max(0, Math.floor(level * pens)));
    const group = groups[pen];
    let length = 0;
    const coords = [];
    for (let i = 0; i < points.length; i += 2) {
      const [x, y] = toPx(points[i], points[i + 1]);
      if (coords.length) {
        const [px, py] = coords[coords.length - 1];
        length += Math.hypot(x - px, y - py);
      }
      coords.push([x, y]);
    }
    if (length < minLength || coords.length < 2) return;
    if (!seen.has(`${pen}:${level}`)) {
      seen.add(`${pen}:${level}`);
      const c = colorOf(level, config, stops);
      group.color = group.color.map((v, i) => v + c[i]);
      group.levels += 1;
    }
    const d = coords
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`)
      .join('');
    group.paths.push(`${d}${closed ? 'Z' : ''}`);
  });

  const layers = groups
    .map((group, index) => {
      if (group.paths.length === 0) return '';
      const hex = rgbToHex(
        group.color.map((v) => (v / Math.max(group.levels, 1)) * 255)
      );
      const paths = group.paths.map((d) => `<path d="${d}"/>`).join('');
      return `<g inkscape:groupmode="layer" inkscape:label="pen-${index + 1}" id="pen-${index + 1}" fill="none" stroke="${hex}" stroke-width="${stroke || 0.1}" stroke-linecap="round" stroke-linejoin="round"${stroke ? '' : ' vector-effect="non-scaling-stroke"'}>${paths}</g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layers}</svg>
`;
}
