import { arcPoint } from './circleClip';
import {
  cellCenterOf,
  familySector,
  fanFrame,
  laneRadii,
} from './laneChannels';
import { capFrame, triangleSegments } from './triContours';

const TAU = Math.PI * 2;
const round = (n) => Number(n.toFixed(6));
const point = (v) => v.map(round).join(' ');
const hex = (rgb) =>
  `#${rgb
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

function arcCommands(center, r, start, span, toCanvas, scale) {
  const arc = { x: center[0], y: center[1], radius: r };
  const count = Math.max(1, Math.ceil(span / Math.PI));
  const out = [];
  for (let i = 1; i <= count; i += 1)
    out.push(
      `A ${round(r * scale)} ${round(r * scale)} 0 0 1 ${point(toCanvas(...arcPoint(arc, start + (span * i) / count)))}`
    );
  return out.join(' ');
}
function sectorPath(center, inner, outer, start, span, toCanvas, scale) {
  const a = { x: center[0], y: center[1], radius: outer };
  let d = `M ${point(toCanvas(...arcPoint(a, start)))} ${arcCommands(center, outer, start, span, toCanvas, scale)}`;
  if (inner > 0) {
    const b = { ...a, radius: inner };
    d += ` L ${point(toCanvas(...arcPoint(b, start + span)))}`;
    const count = Math.max(1, Math.ceil(span / Math.PI));
    for (let i = count - 1; i >= 0; i -= 1)
      d += ` A ${round(inner * scale)} ${round(inner * scale)} 0 0 0 ${point(toCanvas(...arcPoint(b, start + (span * i) / count)))}`;
  } else d += ` L ${point(toCanvas(...center))}`;
  return `${d} Z`;
}

export default function triangleSvg(
  field,
  {
    width,
    height,
    background,
    bounds,
    margin,
    pathDiv: pitch,
    laneColor,
    laneBreaks,
    strokeColor,
    penWidth,
    showStrokes,
    planeRotation,
  }
) {
  const halfW = Math.max(1e-3, (bounds.max[0] - bounds.min[0]) / 2);
  const halfH = Math.max(1e-3, (bounds.max[1] - bounds.min[1]) / 2);
  const cx = (bounds.max[0] + bounds.min[0]) / 2;
  const cy = (bounds.max[1] + bounds.min[1]) / 2;
  const aspect = width / height;
  const half = Math.max(halfW / aspect, halfH) * (1 + margin);
  const x0 = cx - half * aspect;
  const y0 = cy - half;
  const w = half * aspect * 2;
  const h = half * 2;
  if (!field.cells.length)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"/>`;
  const [fx, fy] = cellCenterOf(field.cells[0].cell);
  const toCanvas = (x, y) => [
    field.centers[0] + (x - fx) * field.cellSize,
    field.centers[1] + (y - fy) * field.cellSize,
  ];
  const defs = [];
  const fills = [];
  const paint = (cell, type, edge, row, slot, frame = null, clip = '') => {
    const sector = familySector(cell, type, edge, pitch);
    const wedge =
      frame ??
      (type === 5 ? { start: 0, span: TAU } : fanFrame(cell, edge, type));
    laneRadii(type, cell.size, pitch, edge).forEach(([inner, outer], lane) => {
      if (outer - inner < 1e-9) return;
      const breaks = laneBreaks(row, slot, lane) ?? [0, 1];
      for (let i = 1; i < breaks.length; i += 1) {
        const u0 = breaks[i - 1];
        const u1 = breaks[i];
        const color = hex(laneColor(row, slot, lane, (u0 + u1) / 2));
        const d = sectorPath(
          [sector.x, sector.y],
          inner,
          outer,
          wedge.start + wedge.span * u0,
          wedge.span * (u1 - u0),
          toCanvas,
          field.cellSize
        );
        fills.push(
          `<path d="${d}" fill="${color}" stroke="${color}" stroke-width="${(w / width) * 0.1}"${clip}/>`
        );
      }
    });
  };
  if (laneColor)
    field.cells.forEach((entry, index) => {
      const { cell, connections, cap } = entry;
      if (!cap) {
        [...connections.entries()]
          .reverse()
          .forEach(([slot, [type, edge]]) =>
            paint(cell, type, edge, index, slot)
          );
        return;
      }
      const frame = capFrame(entry, pitch);
      const center = toCanvas(frame.x, frame.y);
      const r = frame.rMax * field.cellSize;
      defs.push(
        `<clipPath id="cap-${index}"><circle cx="${center[0]}" cy="${center[1]}" r="${r}"/></clipPath>`
      );
      const n = frame.normal;
      const t = [n[1], -n[0]];
      const reach = cap.host.size * 3;
      const points = [
        [-1, 0],
        [1, 0],
        [1, 1],
        [-1, 1],
      ].map(([a, b]) =>
        toCanvas(
          frame.x + t[0] * reach * a + n[0] * reach * b,
          frame.y + t[1] * reach * a + n[1] * reach * b
        )
      );
      defs.push(
        `<clipPath id="half-${index}"><polygon points="${points.map(point).join(' ')}"/></clipPath>`
      );
      paint(cell, connections[0][0], connections[0][1], index, 0, {
        start: frame.start,
        span: TAU,
      });
      fills.push(
        `<g clip-path="url(#cap-${index})"><g clip-path="url(#half-${index})">`
      );
      [...cap.connections.entries()]
        .reverse()
        .forEach(([slot, [type, edge]]) => {
          const row = slot === 2 ? cap.bottomIndex : cap.topIndex;
          const hostSlot = slot === 1 ? 1 : 0;
          const { start } = fanFrame(cap.host, edge, type);
          // Outside the original 60° fan the copied boundary band holds its end colour.
          const sector = familySector(cap.host, type, edge, pitch);
          laneRadii(type, cap.host.size, pitch, edge).forEach(
            ([inner, outer], lane) => {
              if (outer - inner < 1e-9) return;
              [
                [start + Math.PI / 3, Math.PI - Math.PI / 6, 1],
                [start + Math.PI + Math.PI / 6, Math.PI - Math.PI / 6, 0],
              ].forEach(([a, span, u]) => {
                fills.push(
                  `<path d="${sectorPath([sector.x, sector.y], inner, outer, a, span, toCanvas, field.cellSize)}" fill="${hex(laneColor(row, hostSlot, lane, u))}"/>`
                );
              });
            }
          );
          paint(cap.host, type, edge, row, hostSlot);
        });
      fills.push('</g></g>');
    });
  const paths = showStrokes
    ? triangleSegments(field, pitch)
        .map((arc) => {
          if (arc.line)
            return `<path d="M ${point(toCanvas(...arc.from))} L ${point(toCanvas(...arc.to))}"/>`;
          return `<path d="M ${point(toCanvas(...arcPoint(arc, arc.start)))} ${arcCommands([arc.x, arc.y], arc.radius, arc.start, arc.span, toCanvas, field.cellSize)}"/>`;
        })
        .join('')
    : '';
  const bg = background
    ? `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x0} ${y0} ${w} ${h}">${bg}<defs>${defs.join('')}</defs><g transform="rotate(${-planeRotation})">${fills.join('')}<g fill="none" stroke="${strokeColor}" stroke-width="${penWidth || w / width}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></g></svg>`;
}
