// The blob field as SVG: the same families, lanes and occlusion
// @modules/trucheterieBlobRender's shader evaluates per pixel, built as
// literal arc geometry. Three-free — colours arrive as a lookup the caller
// resolves (the same table the lane texture is filled from), so the vector
// and the raster cannot disagree about which lane is which colour.
//
// Layers: the scene background, then every lane as a filled annular sector,
// then the strokes. A cell's second family is hidden wherever the first
// family's sector covers it. Fills get that by painting the second family
// first; strokes are clipped analytically instead, so a pen plot of the
// stroke layer alone draws nothing the render hides.
import { canvasBounds } from './bounds';
import {
  cellCenterOf,
  familySector,
  fanFrame,
  laneRadii,
  occluderSector,
  straightFrame,
} from './laneChannels';
import {
  BEND,
  FAN,
  POCKET,
  RINGS,
  TRI_STUB,
  TRI_TURN,
  cornerPoints,
  fanStart,
  returnPoint,
  returnRadii,
  ringPitch,
} from './triangle';
import triangleSvg from './triangleSvg';

const TAU = Math.PI * 2;
const CORNER_OFFSET = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

const round = (n) => Number(n.toFixed(3));

// The angular span a family draws over (atan2 convention in SVG's y-down
// axes), as a start and a positive sweep: a stub's half-turn centred on the
// cell's interior, a corner's quarter-turn between the two edges meeting
// there, an isolated cell's whole circle. The start is where laneChannels.js's
// wedgeParam reads 0, so a spectrum slice at u lands at start + u * span.
function wedge(cell, type, edge) {
  if (
    type === FAN ||
    type === BEND ||
    type === POCKET ||
    type === TRI_STUB ||
    type === TRI_TURN
  ) {
    return fanFrame(cell, edge, type);
  }
  if (type === RINGS) return { span: TAU, start: -Math.PI };
  if (type === 3) {
    const { span, start } = straightFrame(cell, edge);
    return { span, start };
  }
  if (type === 0) return { span: TAU, start: Math.PI + (edge * Math.PI) / 2 };
  if (type === 2) {
    const cur = CORNER_OFFSET[edge];
    const next = CORNER_OFFSET[(edge + 1) % 4];
    return {
      span: Math.PI / 2,
      start: Math.atan2(next[1] - cur[1], next[0] - cur[0]),
    };
  }
  const inward = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][edge];
  return { span: Math.PI, start: inward - Math.PI / 2 };
}

// Grid units to the field's canvas, about the cell's own placed centre.
function canvasPoint(field, index, cell) {
  const [gridX, gridY] = cellCenterOf(cell);
  return (x, y) => [
    field.centers[index * 2] + (x - gridX) * field.cellSize,
    field.centers[index * 2 + 1] + (y - gridY) * field.cellSize,
  ];
}

function familyGeometry(field, index, cell, [type, edge], pathDiv) {
  const { rMax, x, y } = familySector(cell, type, edge, pathDiv);
  const center = canvasPoint(field, index, cell)(x, y);
  return {
    center,
    edge,
    rMax: rMax * field.cellSize,
    type,
    wedge: wedge(cell, type, edge),
  };
}

// Mirrors blobArcs.js's arcFamily: the stroke radii, in micro-cell units.
function strokeRadii(type, size, pathDiv, edge) {
  if (type === TRI_STUB || type === TRI_TURN)
    return returnRadii(type, size, pathDiv);
  if (
    type === FAN ||
    type === BEND ||
    type === POCKET ||
    type === TRI_STUB ||
    type === TRI_TURN
  ) {
    return laneRadii(type, size, pathDiv, edge).map(([, r1]) => r1);
  }
  if (type === RINGS) {
    const { bands, pitch } = ringPitch(size, pathDiv);
    return Array.from({ length: bands }, (_, k) => (k + 1) * pitch);
  }
  const bands = Math.round(size * pathDiv);
  if (type === 3) {
    const { reach } = straightFrame({ size }, 0);
    return Array.from({ length: bands + 1 }, (_, k) => reach + k / pathDiv);
  }
  if (type === 2) {
    return Array.from({ length: bands }, (_, k) => (k + 1) / pathDiv);
  }
  const odd = bands % 2 === 1 ? 0.5 : 0;
  return Array.from(
    { length: Math.floor(bands / 2) + 1 },
    (_, k) => (k + odd) / pathDiv
  ).filter((r) => r > 0);
}

const pointAt = ([cx, cy], r, angle) => [
  round(cx + r * Math.cos(angle)),
  round(cy + r * Math.sin(angle)),
];

// A straight family's arcs sweep a sliver of angle about a far centre; they
// are written as lines.
const FLAT_SPAN = 1e-3;

function arcPath(center, r, start, span) {
  if (span < FLAT_SPAN) {
    const [x0, y0] = pointAt(center, r, start);
    const [x1, y1] = pointAt(center, r, start + span);
    return `M ${x0} ${y0} L ${x1} ${y1}`;
  }
  if (span >= TAU - 1e-9) {
    const [x0, y0] = pointAt(center, r, 0);
    const [x1, y1] = pointAt(center, r, Math.PI);
    const rr = round(r);
    return `M ${x0} ${y0} A ${rr} ${rr} 0 1 1 ${x1} ${y1} A ${rr} ${rr} 0 1 1 ${x0} ${y0}`;
  }
  const [x0, y0] = pointAt(center, r, start);
  const [x1, y1] = pointAt(center, r, start + span);
  const large = span > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${round(r)} ${round(r)} 0 ${large} 1 ${x1} ${y1}`;
}

function sectorPath(center, r0, r1, { span, start }) {
  if (span < FLAT_SPAN) {
    const corners = [
      pointAt(center, r1, start),
      pointAt(center, r1, start + span),
      pointAt(center, r0, start + span),
      pointAt(center, r0, start),
    ];
    return `M ${corners.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
  }
  if (span >= TAU - 1e-9) {
    const outer = arcPath(center, r1, 0, TAU);
    return r0 > 0 ? `${outer} ${arcPath(center, r0, 0, TAU)} Z` : `${outer} Z`;
  }
  const large = span > Math.PI ? 1 : 0;
  const [ox0, oy0] = pointAt(center, r1, start);
  const [ox1, oy1] = pointAt(center, r1, start + span);
  const outer = `M ${ox0} ${oy0} A ${round(r1)} ${round(r1)} 0 ${large} 1 ${ox1} ${oy1}`;
  if (r0 <= 0) return `${outer} L ${round(center[0])} ${round(center[1])} Z`;
  const [ix1, iy1] = pointAt(center, r0, start + span);
  const [ix0, iy0] = pointAt(center, r0, start);
  return `${outer} L ${ix1} ${iy1} A ${round(r0)} ${round(r0)} 0 ${large} 0 ${ix0} ${iy0} Z`;
}

// The pieces of an arc (radius r about `center`, over `wedgeSpan`) that lie
// outside the occluder's disc. A point at angle θ is outside when
// cos(θ − φ) ≥ K, with φ the direction from the occluder to this centre —
// one contiguous window of half-width acos(K) around φ.
function visibleSpans(center, r, { span, start }, occluder) {
  if (!occluder) return [[start, span]];
  const dx = center[0] - occluder.center[0];
  const dy = center[1] - occluder.center[1];
  const dist = Math.hypot(dx, dy);
  const reach = occluder.rMax;
  if (dist < 1e-9) return r > reach ? [[start, span]] : [];
  const k = (reach * reach - r * r - dist * dist) / (2 * r * dist);
  if (k <= -1) return [[start, span]];
  if (k >= 1) return [];
  const half = Math.acos(k);
  const from = Math.atan2(dy, dx) - half;
  const pieces = [];
  for (let wrap = -2; wrap <= 2; wrap += 1) {
    const lo = Math.max(start, from + wrap * TAU);
    const hi = Math.min(start + span, from + wrap * TAU + half * 2);
    if (hi - lo > 1e-6) pieces.push([lo, hi - lo]);
  }
  return pieces;
}

const toHex = (rgb) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

function escapeXml(value) {
  return String(value).replace(
    /[<>&'"]/gu,
    (c) =>
      ({
        '"': '&quot;',
        '&': '&amp;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
      })[c]
  );
}

// `laneColor(cellIndex, slot, lane, u)` returns [r, g, b] at wedge parameter
// u, or is omitted for a line-only plot; `laneBreaks(cellIndex, slot, lane)`
// returns the u values a lane's colour changes at (a Spectrum lane), or null
// for a flat lane. `penWidth` is in the field's canvas units; 0 draws one
// output pixel. `background` null leaves the canvas transparent.
function returnPath(cell, type, edge, radius, toCanvas, from = 0, to = 1) {
  const points = [];
  const samples = Math.max(12, Math.ceil(96 * (to - from)));
  for (let k = 0; k <= samples; k += 1) {
    const point = returnPoint(
      cell,
      type,
      edge,
      radius,
      from + ((to - from) * k) / samples
    );
    points.push(
      toCanvas(...point)
        .map(round)
        .join(' ')
    );
  }
  return points;
}

function drawReturns({
  cell,
  type,
  edge,
  pathDiv,
  toCanvas,
  laneColor,
  laneBreaks,
  index,
  slot,
  fills,
  strokes,
  showStrokes,
}) {
  const radii = returnRadii(type, cell.size, pathDiv);
  if (radii.length === 0) {
    const pointsOfCell = cornerPoints(cell);
    const a = pointsOfCell[edge % 3];
    const b = pointsOfCell[((edge % 3) + 1) % 3];
    const angle = fanStart(edge % 3, cell.up) + Math.PI / 2;
    const cx = (a[0] + b[0]) / 2 + Math.cos(angle) * cell.size * 0.2;
    const cy = (a[1] + b[1]) / 2 + Math.sin(angle) * cell.size * 0.2;
    const points = Array.from({ length: 97 }, (_, k) =>
      toCanvas(
        cx + Math.cos((k / 96) * TAU) * cell.size * 0.2,
        cy + Math.sin((k / 96) * TAU) * cell.size * 0.2
      )
        .map(round)
        .join(' ')
    );
    const d = `M ${points.join(' L ')} Z`;
    if (laneColor)
      fills.push(
        `<path d="${d}" fill="${toHex(laneColor(index, slot, 0, 0.5))}"/>`
      );
    if (showStrokes) strokes.push(`<path d="${d}"/>`);
    return;
  }
  radii.forEach((radius, lane) => {
    if (laneColor) {
      const breaks = laneBreaks(index, slot, lane) ?? [0, 1];
      for (let k = 1; k < breaks.length; k += 1) {
        const u0 = breaks[k - 1];
        const u1 = breaks[k];
        const outer = returnPath(cell, type, edge, radius, toCanvas, u0, u1);
        const inner = returnPath(
          cell,
          type,
          edge,
          lane > 0 ? radii[lane - 1] : 0,
          toCanvas,
          u0,
          u1
        ).reverse();
        const color = toHex(laneColor(index, slot, lane, (u0 + u1) / 2));
        fills.push(
          `<path d="M ${outer.concat(inner).join(' L ')} Z" fill="${color}" stroke="${color}"/>`
        );
      }
    }
    if (showStrokes)
      strokes.push(
        `<path d="M ${returnPath(cell, type, edge, radius, toCanvas).join(' L ')}"/>`
      );
  });
  if (
    showStrokes &&
    type === TRI_STUB &&
    Math.round(cell.size * pathDiv) % 2 === 1
  ) {
    const from = toCanvas(...returnPoint(cell, type, edge, 0, 0.5));
    const to = toCanvas(...returnPoint(cell, type, edge, radii[0], 0.5));
    strokes.push(
      `<path d="M ${from.map(round).join(' ')} L ${to.map(round).join(' ')}"/>`
    );
  }
}

export default function renderBlobSvg(
  field,
  {
    background = null,
    height,
    laneBreaks = () => null,
    laneColor = null,
    margin = 0.08,
    pathDiv,
    penWidth = 0,
    planeRotation = 0,
    showStrokes = true,
    strokeColor = '#141414',
    width,
  }
) {
  const bounds = canvasBounds(field, planeRotation);
  const halfW = Math.max(1e-3, (bounds.max[0] - bounds.min[0]) / 2);
  const halfH = Math.max(1e-3, (bounds.max[1] - bounds.min[1]) / 2);
  const centerX = (bounds.max[0] + bounds.min[0]) / 2;
  const centerY = (bounds.max[1] + bounds.min[1]) / 2;
  const aspect = width / height;
  const half = Math.max(halfW / aspect, halfH) * (1 + margin);
  const viewMinX = centerX - half * aspect;
  const viewMinY = centerY - half;
  const viewW = half * aspect * 2;
  const viewH = half * 2;
  const pixel = viewW / width;

  if (field.layout === 'subdivide')
    return triangleSvg(field, {
      width,
      height,
      background,
      bounds,
      margin,
      pathDiv,
      laneColor,
      laneBreaks,
      strokeColor,
      penWidth,
      showStrokes,
      planeRotation,
    });
  const fills = [];
  const strokes = [];
  const allFamilies = field.cells.map((entry, index) =>
    entry.connections.map((connection) =>
      familyGeometry(field, index, entry.cell, connection, pathDiv)
    )
  );
  field.cells.forEach((entry, index) => {
    const { cell, occluders = [] } = entry;
    const families = allFamilies[index];
    const toCanvas = canvasPoint(field, index, cell);
    const covers = occluders.map((cover) => {
      const { rMax, rMin = 0, x, y } = occluderSector(cover, pathDiv);
      return {
        center: toCanvas(x, y),
        rMin: rMin * field.cellSize,
        rMax: rMax * field.cellSize,
        ...(cover.type !== undefined
          ? { wedge: wedge(cover.cell ?? cell, cover.type, cover.edge) }
          : {}),
      };
    });
    const occluder =
      families.length > 1 && families[0].rMax > 0 ? families[0] : null;

    [...families.keys()].reverse().forEach((slot) => {
      const family = families[slot];
      if (family.type === TRI_STUB || family.type === TRI_TURN) {
        drawReturns({
          cell,
          type: family.type,
          edge: family.edge,
          pathDiv,
          toCanvas,
          laneColor,
          laneBreaks,
          index,
          slot,
          fills,
          strokes,
          showStrokes,
        });
        return;
      }

      if (laneColor) {
        laneRadii(family.type, cell.size, pathDiv, family.edge).forEach(
          ([r0, r1], lane) => {
            if (r1 - r0 < 1e-9) return;
            const breaks = laneBreaks(index, slot, lane) ?? [0, 1];
            for (let i = 1; i < breaks.length; i += 1) {
              const u0 = breaks[i - 1];
              const u1 = breaks[i];
              const middle = (u0 + u1) / 2;
              const progress = middle;
              const color = toHex(laneColor(index, slot, lane, progress));
              const piece = {
                span: family.wedge.span * (u1 - u0),
                start: family.wedge.start + family.wedge.span * u0,
              };
              fills.push(
                `<path d="${sectorPath(family.center, r0 * field.cellSize, r1 * field.cellSize, piece)}" fill="${color}" stroke="${color}"/>`
              );
            }
          }
        );
      }

      if (showStrokes) {
        strokeRadii(family.type, cell.size, pathDiv, family.edge).forEach(
          (r) => {
            const radius = r * field.cellSize;
            const hiders = [
              ...(slot === 1 && occluder ? [occluder] : []),
              ...covers,
            ];
            hiders
              .reduce(
                (spans, hider) =>
                  spans.flatMap(([start, span]) =>
                    visibleSpans(family.center, radius, { span, start }, hider)
                  ),
                [[family.wedge.start, family.wedge.span]]
              )
              .forEach(([start, span]) => {
                strokes.push(
                  `<path d="${arcPath(family.center, radius, start, span)}"/>`
                );
              });
          }
        );
      }
    });
  });

  const rotation = -planeRotation;
  const transform =
    rotation % 360 !== 0 ? ` transform="rotate(${rotation.toFixed(3)})"` : '';
  const strokeWidth = penWidth > 0 ? penWidth : pixel;
  const layers = [
    background
      ? `<rect x="${round(viewMinX)}" y="${round(viewMinY)}" width="${round(viewW)}" height="${round(viewH)}" fill="${escapeXml(background)}"/>`
      : '',
    `<g${transform}>`,
    fills.length > 0
      ? `<g id="lanes" fill-rule="evenodd" stroke-width="${round(pixel)}">\n    ${fills.join('\n    ')}\n  </g>`
      : '',
    strokes.length > 0
      ? `<g id="strokes" fill="none" stroke="${escapeXml(strokeColor)}" stroke-width="${strokeWidth.toFixed(4)}" stroke-linecap="round">\n    ${strokes.join('\n    ')}\n  </g>`
      : '',
    '</g>',
  ].filter(Boolean);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${viewMinX.toFixed(3)} ${viewMinY.toFixed(3)} ${viewW.toFixed(3)} ${viewH.toFixed(3)}">\n` +
    `  ${layers.join('\n  ')}\n</svg>\n`
  );
}
