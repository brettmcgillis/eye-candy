import { insetPoly } from './geometry';
import { grownCell, mixHex } from './grow';
import buildPlot from './plot';

const fmt = (v) => Number(v.toFixed(2));

function polyPath(poly) {
  let d = `M${fmt(poly[0])} ${fmt(poly[1])}`;
  for (let i = 2; i < poly.length; i += 2)
    d += `L${fmt(poly[i])} ${fmt(poly[i + 1])}`;
  return `${d}Z`;
}

// One path per colour per level: a hundred thousand cells as a few dozen
// elements, still painted parents-first. The hairline stroke in the fill
// colour closes the anti-aliasing seams a rasteriser leaves between cells.
function paint(groups, seam) {
  const stroke = (color) =>
    seam > 0
      ? ` stroke="${color}" stroke-width="${fmt(seam)}" stroke-linejoin="round"`
      : '';
  return [...groups]
    .map(([color, d]) => `<path d="${d}" fill="${color}"${stroke(color)}/>`)
    .join('');
}

function fillBody(piece, config, { grow, seam }) {
  const outlined = config.outlineWidth > 0 && config.outlineStrength > 0;
  const levels = new Map();
  piece.nodes.forEach((node) => {
    const cell = grownCell(node, grow, config.growStyle);
    if (!cell) return;
    const { band, centre, poly, t } = cell;
    const parent = piece.nodes[node.parent] ?? node;
    if (!levels.has(node.depth)) {
      levels.set(node.depth, { inner: new Map(), outer: new Map() });
    }
    const level = levels.get(node.depth);
    const add = (map, color, shape) =>
      map.set(color, `${map.get(color) ?? ''}${polyPath(shape)}`);
    if (!outlined) {
      add(level.outer, mixHex(parent.fill, node.fill, t), poly);
      return;
    }
    add(level.outer, mixHex(parent.edge, node.edge, t), poly);
    const inner = insetPoly(node, config.outlineWidth * band, { centre, poly });
    if (inner) add(level.inner, mixHex(parent.fill, node.fill, t), inner);
  });
  return [...levels.keys()]
    .sort((a, b) => a - b)
    .map(
      (depth) =>
        paint(levels.get(depth).outer, seam) + paint(levels.get(depth).inner, 0)
    )
    .join('');
}

function svgOpen(canvas, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width}" height="${height}" viewBox="0 0 ${fmt(canvas.width)} ${fmt(canvas.height)}">`;
}

// The raster look: PNG, WebP and video frames are this, rasterised at `size`
// px. `grow` below fullyGrown(piece) draws the piece mid-split.
export function renderFillSvg(
  piece,
  config,
  { background = true, grow = Infinity, size = piece.canvas } = {}
) {
  const { canvas } = piece;
  return [
    svgOpen(canvas, size.width, size.height),
    background
      ? `<rect width="${fmt(canvas.width)}" height="${fmt(canvas.height)}" fill="${config.bgColor}"/>`
      : '',
    fillBody(piece, config, { grow, seam: (canvas.width / size.width) * 0.6 }),
    '</svg>',
  ].join('');
}

function segmentPath(segments) {
  return segments
    .map(
      ({ points: p }) => `M${fmt(p[0])} ${fmt(p[1])}L${fmt(p[2])} ${fmt(p[3])}`
    )
    .join('');
}

// The pen plot: one Inkscape layer per palette stop, then the outlines, sized
// in millimetres. No background — a plotter would trace it.
export function renderPlotSvg(piece, config, { widthMm = 200 } = {}) {
  const { canvas } = piece;
  const { hatches, outlines } = buildPlot(piece, config);
  const penUnits = config.penWidth * (canvas.width / widthMm);
  const ink = (color) => (config.plotInk === 'black' ? '#000000' : color);
  const layer = (id, label, color, segments) =>
    segments.length === 0
      ? ''
      : `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${label}" fill="none" stroke="${ink(color)}" stroke-width="${fmt(penUnits)}" stroke-linecap="round"><path d="${segmentPath(segments)}"/></g>`;

  const byStop = new Map();
  hatches.forEach((segment) => {
    if (!byStop.has(segment.layer)) byStop.set(segment.layer, []);
    byStop.get(segment.layer).push(segment);
  });

  return [
    svgOpen(
      canvas,
      `${widthMm}mm`,
      `${fmt((widthMm * canvas.height) / canvas.width)}mm`
    ),
    ...[...byStop.keys()]
      .sort((a, b) => a - b)
      .map((stop) =>
        layer(
          `pen-${stop + 1}`,
          `${stop + 1} ${piece.palette[stop]}`,
          piece.palette[stop],
          byStop.get(stop)
        )
      ),
    layer('pen-outline', 'outline', config.outlineColor, outlines),
    '</svg>',
  ].join('');
}
