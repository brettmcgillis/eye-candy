// Plottable line-work for the blob field: one stroke per stroke ring, built
// as literal SVG arc/circle geometry from the same per-connection arc-family
// placement blobArcs.js/blobShader.js draw per pixel — see
// @modules/trucheterieBlobRender for the raster version. Three-free: this is
// plain 2D geometry, no textures or instancing needed.
import { familySector } from './laneChannels';

const CORNER_OFFSET = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

// Every stroke ring's radius, in micro-cell units. A stub/isolated family
// steps by (k + odd)/pathDiv up to half the cell; a corner steps by k/pathDiv
// from k=1 up to a full cell width — mirrors blobArcs.js's arcFamily exactly
// (band count and the odd half-step), just enumerated instead of sampled.
function familyRadii(type, size, pathDiv) {
  const bands = Math.round(size * pathDiv);
  if (type === 2) {
    return Array.from({ length: bands }, (_, k) => (k + 1) / pathDiv);
  }
  const odd = bands % 2 === 1 ? 0.5 : 0;
  const kMax = Math.floor(bands / 2);
  return Array.from({ length: kMax + 1 }, (_, k) => (k + odd) / pathDiv);
}

// A family's centre, as a grid-unit OFFSET from its own cell's centre — the
// caller adds this to the cell's already-known world centre, so neither
// function needs the field's absolute canvas origin.
function familyOffset(cell, type, edge) {
  const half = cell.size / 2;
  if (type === 0) return [0, 0];
  if (type === 2) {
    const [dc, dr] = CORNER_OFFSET[edge];
    return [dc * cell.size - half, dr * cell.size - half];
  }
  const mid = [
    [half, 0],
    [cell.size, half],
    [half, cell.size],
    [0, half],
  ][edge];
  return [mid[0] - half, mid[1] - half];
}

// The two angles (atan2 convention, x right / y DOWN — SVG's own axes, no
// flip needed) bounding a family's wedge, ordered so sweeping from the first
// to the second by increasing angle draws the correct side.
//   stub (type 1)  — a half-turn centred on the direction toward the cell's
//                    own centre from this edge's midpoint (the two cells
//                    sharing an edge each draw their own inward half, which
//                    is why same-size neighbours read as one ring crossing
//                    the border).
//   corner (type 2) — a quarter-turn between the two edges meeting there,
//                     rounding the corner through the cell's interior.
function familyAngles(type, edge) {
  if (type === 2) {
    const cur = CORNER_OFFSET[edge];
    const next = CORNER_OFFSET[(edge + 1) % 4];
    const prev = CORNER_OFFSET[(edge + 3) % 4];
    return [
      Math.atan2(next[1] - cur[1], next[0] - cur[0]),
      Math.atan2(prev[1] - cur[1], prev[0] - cur[0]),
    ];
  }
  const inward = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][edge];
  return [inward - Math.PI / 2, inward + Math.PI / 2];
}

// An open arc from angle `a` to `b` (radians, atan2 convention) about
// (cx, cy) at radius r, choosing whichever of the two directions is the
// shorter turn from `a` to `b` — the only ambiguous case (exactly a
// half-turn) is never ambiguous in practice here, since `familyAngles`
// always orders its pair to sweep through the wedge's own inward direction.
function arcPath(cx, cy, r, a, b) {
  const p1 = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const p2 = [cx + r * Math.cos(b), cy + r * Math.sin(b)];
  let delta = b - a;
  while (delta <= -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  const sweep = delta >= 0 ? 1 : 0;
  const round = (n) => Number(n.toFixed(3));
  return (
    `M ${round(p1[0])} ${round(p1[1])} ` +
    `A ${round(r)} ${round(r)} 0 0 ${sweep} ${round(p2[0])} ${round(p2[1])}`
  );
}

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

// The field's own bounds in the SAME (x right, y down) convention this file
// draws in — @modules/trucheterieBlob/bounds.js works in the render's
// Y-flipped convention instead, so this is its own short pass rather than a
// shared function with a flip flag threaded through it.
function svgBounds(field) {
  if (field.count === 0 || field.cells.length === 0) {
    return { max: [1, 1], min: [-1, -1] };
  }
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  field.cells.forEach(({ cell, connections }, i) => {
    const centerX = field.centers[i * 2 + 0];
    const centerY = field.centers[i * 2 + 1];
    connections.forEach(([type, edge]) => {
      const sector = familySector(cell, type, edge);
      const [dx, dy] = familyOffset(cell, type, edge);
      const radius = sector.rMax * field.cellSize;
      const fx = centerX + dx * field.cellSize;
      const fy = centerY + dy * field.cellSize;
      min[0] = Math.min(min[0], fx - radius);
      min[1] = Math.min(min[1], fy - radius);
      max[0] = Math.max(max[0], fx + radius);
      max[1] = Math.max(max[1], fy + radius);
    });
  });
  return { max, min };
}

// A plottable SVG of the field's stroke centrelines — no fill, no palette,
// no debug hatching, since none of those mean anything to a pen.
// `strokeWidth` is in OUTPUT PIXELS (matching the CLI's own --svgStroke), not
// the viewBox's world units — 0 draws a hairline, for a plotter whose own pen
// defines the width.
export default function renderBlobSvg(
  field,
  {
    height,
    margin = 0.08,
    pathDiv,
    planeRotation = 0,
    strokeColor = '#141414',
    strokeWidth = 0,
    width,
  }
) {
  const bounds = svgBounds(field);
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
  const scale = width / viewW;

  const paths = [];
  const circles = [];
  field.cells.forEach(({ cell, connections }, i) => {
    const cx = field.centers[i * 2 + 0];
    const cy = field.centers[i * 2 + 1];
    connections.forEach(([type, edge]) => {
      const [dx, dy] = familyOffset(cell, type, edge);
      const fx = cx + dx * field.cellSize;
      const fy = cy + dy * field.cellSize;
      const radii = familyRadii(type, cell.size, pathDiv);
      radii.forEach((r) => {
        const radius = r * field.cellSize;
        if (type === 0) {
          circles.push(
            `<circle cx="${fx.toFixed(3)}" cy="${fy.toFixed(3)}" r="${radius.toFixed(3)}"/>`
          );
          return;
        }
        const [a, b] = familyAngles(type, edge);
        paths.push(`<path d="${arcPath(fx, fy, radius, a, b)}"/>`);
      });
    });
  });

  const strokes = [...circles, ...paths].join('\n    ');
  const rotation = ((planeRotation % 360) + 360) % 360;
  const transform =
    rotation !== 0
      ? ` transform="rotate(${rotation.toFixed(2)} ${centerX.toFixed(3)} ${centerY.toFixed(3)})"`
      : '';
  const strokeWidthValue = strokeWidth > 0 ? strokeWidth / scale : half / 500;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${viewMinX.toFixed(3)} ${viewMinY.toFixed(3)} ${viewW.toFixed(3)} ${viewH.toFixed(3)}">\n` +
    `  <g${transform} fill="none" stroke="${escapeXml(strokeColor)}" ` +
    `stroke-width="${strokeWidthValue.toFixed(4)}" ` +
    `stroke-linecap="round">\n    ${strokes}\n  </g>\n</svg>\n`
  );
}
