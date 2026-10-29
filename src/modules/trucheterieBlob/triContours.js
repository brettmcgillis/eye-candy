import { clipCircle, clipLine, clipShape } from './circleClip';
import {
  familySector,
  fanFrame,
  laneRadii,
  occluderSector,
} from './laneChannels';
import { boundaryRadii, boundarySize } from './triFans';
import {
  TRI_STRIPES,
  cornerPoints,
  fanStart,
  stripeCount,
  stripePoint,
} from './triangle';

export function capFrame(entry, pitch) {
  const [type, edge] = entry.connections[0];
  const { x, y, rMax } = familySector(entry.cell, type, edge, pitch);
  const start = fanStart(entry.cap.side, entry.cap.host.up);
  return {
    x,
    y,
    rMax,
    start,
    normal: [-Math.sin(start), Math.cos(start)],
    radii: boundaryRadii(boundarySize(edge), pitch),
  };
}

function hostLines(host) {
  const points = cornerPoints(host);
  const cx = (points[0][0] + points[1][0] + points[2][0]) / 3;
  const cy = (points[0][1] + points[1][1] + points[2][1]) / 3;
  return points.map((a, i) => {
    const b = points[(i + 1) % 3];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = [(a[1] - b[1]) / length, (b[0] - a[0]) / length];
    const flip = (cx - a[0]) * n[0] + (cy - a[1]) * n[1] < 0 ? -1 : 1;
    return [a, [n[0] * flip, n[1] * flip]];
  });
}

const inside = (lines, x, y) =>
  lines.every(([p, n]) => (x - p[0]) * n[0] + (y - p[1]) * n[1] >= -1e-9);

// A return facing a real cell overlaps that cell's own return, so it covers
// its whole disc, repaints its host's fans on the inward half and its outline
// seals the seam; triangleFans draws these last. One facing the void covers
// its outward half and, inward, only its own host: the half-disc bulges past
// the host's other sides into its neighbours.
export function capShapes(entry, pitch) {
  const frame = capFrame(entry, pitch);
  const side = [[frame.x, frame.y], frame.normal];
  const { facing } = entry.cap;
  const lines = facing ? [side] : [side, ...hostLines(entry.cap.host)];
  const inDisc = (x, y) =>
    Math.hypot(x - frame.x, y - frame.y) <= frame.rMax + 1e-9;
  const outward = (x, y) =>
    (x - frame.x) * frame.normal[0] + (y - frame.y) * frame.normal[1] <= 0;
  const inHost = (x, y) =>
    facing ? !outward(x, y) : inside(lines.slice(1), x, y);
  const base = { x: frame.x, y: frame.y, rMax: frame.rMax, lines };
  return {
    frame,
    host: { ...base, contains: (x, y) => inDisc(x, y) && inHost(x, y) },
    cover: {
      ...base,
      contains: (x, y) => inDisc(x, y) && (outward(x, y) || inHost(x, y)),
    },
  };
}

export function triangleSegments(field, pitch) {
  const segments = [];
  const clip = (piece, cover) =>
    cover.contains ? clipShape(piece, cover) : clipCircle(piece, cover);
  const append = (arcs, covers) =>
    arcs.flatMap((arc) =>
      covers.reduce(
        (pieces, cover) =>
          pieces.flatMap((piece) =>
            piece.line ? clipLine(piece, cover) : clip(piece, cover)
          ),
        [arc]
      )
    );
  field.cells.forEach((entry, index) => {
    const { cell, connections, cap } = entry;
    const later = (entry.renderOccluders ?? []).map((cover) =>
      cover.cap
        ? capShapes(
            { ...cover, connections: [[cover.type, cover.edge]] },
            pitch
          ).cover
        : occluderSector(cover, pitch)
    );
    if (cap) {
      const { frame, host } = capShapes(entry, pitch);
      if (cap.facing)
        segments.push(
          ...append(
            [
              {
                x: frame.x,
                y: frame.y,
                radius: frame.rMax,
                start: frame.start,
                span: Math.PI,
                owner: index,
                slot: 0,
                lane: frame.radii.length - 1,
              },
            ],
            later
          )
        );
      frame.radii.forEach((radius, lane) => {
        segments.push(
          ...append(
            [
              {
                x: frame.x,
                y: frame.y,
                radius,
                start: frame.start + Math.PI,
                span: Math.PI,
                owner: index,
                slot: 0,
                lane,
              },
            ],
            later
          )
        );
      });
      const higher = [];
      cap.connections.forEach(([type, edge], slot) => {
        const sector = familySector(cap.host, type, edge, pitch);
        laneRadii(type, cap.host.size, pitch, edge).forEach(
          ([, radius], lane) => {
            const arcs = clipShape(
              {
                x: sector.x,
                y: sector.y,
                radius,
                start: 0,
                span: Math.PI * 2,
                owner: index,
                slot: slot + 1,
                lane,
              },
              host,
              true
            );
            segments.push(...append(arcs, [...higher, ...later]));
          }
        );
        higher.push(sector);
      });
      if (Math.round(entry.cell.size * pitch) % 2 && frame.radii.length) {
        const end = [
          frame.x - frame.normal[0] / pitch,
          frame.y - frame.normal[1] / pitch,
        ];
        // Stems end on the first return circle, so the central odd port forms a T.
        segments.push(
          ...append(
            [{ line: true, from: [frame.x, frame.y], to: end, owner: index }],
            later
          )
        );
      }
      return;
    }
    const own = [];
    connections.forEach(([type, edge], slot) => {
      if (type === TRI_STRIPES) {
        const covers = [
          ...(entry.occluders ?? []).map((cover) =>
            occluderSector(cover, pitch)
          ),
          ...later,
        ];
        const lines = Array.from(
          { length: stripeCount(cell.size, pitch) },
          (_, lane) => {
            const r = (lane + 0.5) / pitch;
            return {
              line: true,
              from: stripePoint(cell, edge % 3, r, 0),
              to: stripePoint(cell, edge % 3, r, 1),
              owner: index,
              slot,
              lane,
            };
          }
        );
        segments.push(...append(lines, covers));
        return;
      }
      const sector = familySector(cell, type, edge, pitch);
      const wedge =
        type === 5
          ? { start: 0, span: Math.PI * 2 }
          : fanFrame(cell, edge, type);
      const covers = [
        ...own,
        ...(entry.occluders ?? []).map((cover) => occluderSector(cover, pitch)),
        ...later,
      ];
      laneRadii(type, cell.size, pitch, edge).forEach(([, radius], lane) => {
        if (radius <= 0) return;
        segments.push(
          ...append(
            [
              {
                x: sector.x,
                y: sector.y,
                radius,
                ...wedge,
                owner: index,
                slot,
                lane,
              },
            ],
            covers
          )
        );
      });
      own.push(sector);
    });
  });
  return segments;
}
