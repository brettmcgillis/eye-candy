const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; // eslint-disable-line no-bitwise
};
const rgbToHex = (rgb) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

export function stopIndex(stops, t) {
  return Math.round(Math.min(1, Math.max(0, t)) * (stops.length - 1));
}

export function toneColor(stops, t, exact) {
  if (!stops?.length) return '#888888';
  if (exact || stops.length === 1) return stops[stopIndex(stops, t)];
  const scaled = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(Math.floor(scaled), stops.length - 2);
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i + 1]);
  return rgbToHex(a.map((c, k) => c + (b[k] - c) * (scaled - i)));
}

const f = (v) => Number(v.toFixed(3));
const path = (poly) =>
  `M${poly.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
const rectPath = ([x0, y0, x1, y1]) =>
  path([
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ]);

function frameRings(panel) {
  return panel.frames.map(({ rect, width }) => {
    const [x0, y0, x1, y1] = rect;
    const h = width / 2;
    return `${rectPath([x0 - h, y0 - h, x1 + h, y1 + h])}${rectPath([x0 + h, y0 + h, x1 - h, y1 - h])}`;
  });
}

function fillBody(panel, config, stops) {
  // `source` paints the image's own colour under each cell.
  const paint = (item, fallback, target) => {
    if (config.colorTarget !== target && config.colorTarget !== 'both') {
      return fallback;
    }
    const rgb = panel.leaves[item.leaf]?.stats?.rgb;
    if (config.colorBy === 'source' && rgb) {
      return rgbToHex(rgb.map((v) => v * 255));
    }
    return toneColor(stops, item.t, config.paletteExact);
  };
  const out = [
    `<path d="${rectPath([0, 0, panel.width, panel.height])}${rectPath(panel.inner)}" fill="${config.woodColor}" fill-rule="evenodd"/>`,
    `<path d="${rectPath(panel.inner)}" fill="${config.woodColor}"/>`,
  ];
  if (config.colorTarget === 'strips' || config.colorTarget === 'both') {
    panel.pieces.forEach((p) =>
      out.push(
        `<path d="${path(p.polygon)}" fill="${paint(p, config.woodColor, 'strips')}"/>`
      )
    );
  }
  panel.openings.forEach((o) =>
    out.push(
      `<path d="${path(o.poly)}" fill="${paint(o, config.paperColor, 'openings')}"/>`
    )
  );
  frameRings(panel).forEach((d) =>
    out.push(`<path d="${d}" fill="${config.woodColor}" fill-rule="evenodd"/>`)
  );
  return out.join('');
}

// Pen plotting: one group per palette stop, every opening outlined, so each
// strip is drawn as its two edges the way a kumiko drawing is.
function plotBody(panel, config, stops, stroke) {
  const pens =
    config.colorTarget === 'none' || !stops?.length ? ['#000000'] : stops;
  const groups = pens.map(() => []);
  panel.openings.forEach((o) =>
    groups[pens.length === 1 ? 0 : stopIndex(pens, o.t)].push(path(o.poly))
  );
  const frame = [
    rectPath([0, 0, panel.width, panel.height]),
    rectPath(panel.inner),
    ...frameRings(panel),
  ].join('');
  const width = stroke > 0 ? stroke : 0.1;
  const hairline = stroke > 0 ? '' : ' vector-effect="non-scaling-stroke"';
  return [
    `<g id="frame" fill="none" stroke="${pens[0]}" stroke-width="${width}"${hairline}><path d="${frame}"/></g>`,
    ...groups.map(
      (paths, i) =>
        `<g id="stop-${i}" fill="none" stroke="${pens[i]}" stroke-width="${width}" stroke-linejoin="round"${hairline}>${paths
          .map((d) => `<path d="${d}"/>`)
          .join('')}</g>`
    ),
  ].join('');
}

function piecesBody(panel, config, stroke) {
  const tiers = new Map();
  panel.pieces.forEach((p) => {
    if (!tiers.has(p.tier)) tiers.set(p.tier, []);
    tiers.get(p.tier).push(path(p.polygon));
  });
  const width = stroke > 0 ? stroke : 0.1;
  return [...tiers]
    .sort(([a], [b]) => a - b)
    .map(
      ([tier, paths]) =>
        `<g id="tier-${tier}" fill="none" stroke="#000000" stroke-width="${width}">${paths
          .map((d) => `<path d="${d}"/>`)
          .join('')}</g>`
    )
    .join('');
}

// `frame` sizes the document in pixels with the panel fitted inside a
// margin (for rasterising); without it the document is the panel in mm.
export default function renderKumikoSvg({
  config,
  frame = null,
  panel,
  stops,
  stroke = 0.3,
  style = 'fill',
}) {
  const margin = frame ? frame.margin : 0.04;
  const pad = Math.max(panel.width, panel.height) * margin;
  let viewBox = [-pad, -pad, panel.width + pad * 2, panel.height + pad * 2];
  let size = `width="${f(viewBox[2])}mm" height="${f(viewBox[3])}mm"`;
  if (frame) {
    const scale = Math.min(frame.width / viewBox[2], frame.height / viewBox[3]);
    const w = frame.width / scale;
    const h = frame.height / scale;
    viewBox = [panel.width / 2 - w / 2, panel.height / 2 - h / 2, w, h];
    size = `width="${frame.width}" height="${frame.height}"`;
  }
  const background =
    style === 'fill'
      ? `<rect x="${f(viewBox[0])}" y="${f(viewBox[1])}" width="${f(viewBox[2])}" height="${f(viewBox[3])}" fill="${config.backgroundColor}"/>`
      : '';
  let body;
  if (style === 'plot') body = plotBody(panel, config, stops, stroke);
  else if (style === 'pieces') body = piecesBody(panel, config, stroke);
  else body = fillBody(panel, config, stops);

  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${viewBox.map(f).join(' ')}">${background}${body}</svg>\n`;
}
