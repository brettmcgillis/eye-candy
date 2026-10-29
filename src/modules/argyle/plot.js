import {
  clipPolygon,
  depthPlane,
  insideInterval,
  pointAt,
  projectedFaces,
} from './plotGeometry';

const fmt = (v) => Number(v.toFixed(3));
const path = (a, b) => `M${fmt(a.x)},${fmt(a.y)}L${fmt(b.x)},${fmt(b.y)}`;
function faceLines(face, options) {
  const { polygon, box } = face;
  const lines = polygon.flatMap((a, i) =>
    face.edges && !face.edges[i] ? [] : [[a, polygon[(i + 1) % polygon.length]]]
  );
  if (options.svgStyle !== 'hatch') return lines;
  const fullSpacing =
    (options.hatchSpacing * options.width) / options.plotWidthMm;
  const spacing = fullSpacing / Math.max(0.08, face.fade);
  const span = options.width + options.height;
  for (
    let s = Math.floor((box[0] + box[1]) / spacing) * spacing;
    s < box[2] + box[3];
    s += spacing
  ) {
    const a = { x: s - span, y: span };
    const b = { x: s + span, y: -span };
    const clip = insideInterval(a, b, polygon);
    if (clip) lines.push([pointAt(a, b, clip[0]), pointAt(a, b, clip[1])]);
  }
  return lines;
}
function indexFaces(faces, width, height) {
  const size = Math.max(width, height) / 32;
  const grid = new Map();
  const cells = (box, visit) => {
    for (
      let x = Math.floor(box[0] / size);
      x <= Math.floor(box[2] / size);
      x += 1
    )
      for (
        let y = Math.floor(box[1] / size);
        y <= Math.floor(box[3] / size);
        y += 1
      )
        visit(`${x}:${y}`);
  };
  faces.forEach((face) =>
    cells(face.box, (key) => {
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(face);
    })
  );
  return (box) => {
    const found = new Set();
    cells(box, (key) => grid.get(key)?.forEach((face) => found.add(face)));
    return found;
  };
}
function visibleLine(a, b, face, candidates) {
  let intervals = [[0, 1]];
  candidates.forEach((blocker) => {
    if (blocker === face || (blocker.tile === face.tile && !face.hollow))
      return;
    const clip = insideInterval(a, b, blocker.polygon);
    if (!clip) return;
    let [lo, hi] = clip;
    const delta = (t) => {
      const p = pointAt(a, b, t);
      return blocker.q(p) - face.q(p) - 1e-7;
    };
    const da = delta(lo);
    const db = delta(hi);
    if (da <= 0 && db <= 0) return;
    if (da * db < 0) {
      const cross = lo + ((hi - lo) * da) / (da - db);
      if (da > 0) hi = cross;
      else lo = cross;
    }
    intervals = intervals.flatMap(([l, h]) => {
      if (hi <= l || lo >= h) return [[l, h]];
      const rest = [];
      if (lo > l) rest.push([l, lo]);
      if (hi < h) rest.push([hi, h]);
      return rest;
    });
  });
  return intervals
    .filter(([lo, hi]) => (hi - lo) * Math.hypot(b.x - a.x, b.y - a.y) > 0.15)
    .map(([lo, hi]) => path(pointAt(a, b, lo), pointAt(a, b, hi)))
    .join('');
}
export default function renderSvg(field, view, options) {
  const { width, height } = options;
  const faces = projectedFaces(field, view, options).map((face) => ({
    ...face,
    q: depthPlane(face, view.projection !== 'orthographic'),
  }));
  let body = '';
  if (!options.transparent && options.svgStyle === 'filled')
    body += `<rect width="${width}" height="${height}" fill="${field.config.background}"/>`;
  if (options.svgStyle === 'filled') {
    body += faces
      .map((face) => {
        const polygon = clipPolygon(face.polygon, width, height);
        if (polygon.length < 3) return '';
        return `<path d="M${polygon.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L')}Z" fill="${face.ink}" fill-opacity="${fmt(face.opacity)}"/>`;
      })
      .join('');
  } else {
    const nearby = indexFaces(faces, width, height);
    const layers = new Map();
    faces.forEach((face) => {
      const candidates = nearby(face.box);
      const paper = [
        { x: 0, y: 0 },
        { x: 0, y: height },
        { x: width, y: height },
        { x: width, y: 0 },
      ];
      const d = faceLines(face, options)
        .map(([a, b]) => {
          const clip = insideInterval(a, b, paper);
          return clip
            ? visibleLine(
                pointAt(a, b, clip[0]),
                pointAt(a, b, clip[1]),
                face,
                candidates
              )
            : '';
        })
        .join('');
      if (d) layers.set(face.ink, (layers.get(face.ink) ?? '') + d);
    });
    body += [...layers]
      .map(
        ([ink, d], i) =>
          `<g id="pen-${i + 1}" inkscape:groupmode="layer" inkscape:label="pen-${i + 1} ${ink}" stroke="${ink}" fill="none" stroke-width="${options.svgStroke || 0.1}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>`
      )
      .join('');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${options.plotWidthMm}mm" height="${fmt((options.plotWidthMm * height) / width)}mm" viewBox="0 0 ${width} ${height}"><title>Argyle — ${field.config.pattern}</title><desc>Seed ${field.config.seed}; ${options.svgStyle}; fades encoded as density in pen plots.</desc>${body}</svg>`;
}
