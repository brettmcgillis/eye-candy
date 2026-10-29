import { clipCircle, clipHalfPlane, clipLine } from './circleClip';
import {
  familySector,
  fanFrame,
  laneRadii,
  occluderSector,
} from './laneChannels';
import { boundaryRadii, boundarySize } from './triFans';
import { fanStart } from './triangle';

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

export function triangleSegments(field, pitch) {
  const segments = [];
  const append = (arcs, covers) =>
    arcs.flatMap((arc) =>
      covers.reduce(
        (pieces, cover) => pieces.flatMap((piece) => clipCircle(piece, cover)),
        [arc]
      )
    );
  field.cells.forEach((entry, index) => {
    const { cell, connections, cap } = entry;
    const later = (entry.renderOccluders ?? []).map((cover) =>
      occluderSector(cover, pitch)
    );
    if (cap) {
      const frame = capFrame(entry, pitch);
      const circle = { x: frame.x, y: frame.y, rMax: frame.rMax };
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
      const higher = [];
      cap.connections.forEach(([type, edge], slot) => {
        const sector = familySector(cap.host, type, edge, pitch);
        laneRadii(type, cap.host.size, pitch, edge).forEach(
          ([, radius], lane) => {
            let arcs = clipCircle(
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
              circle,
              true
            );
            arcs = arcs.flatMap((arc) =>
              clipHalfPlane(arc, [frame.x, frame.y], frame.normal)
            );
            segments.push(...append(arcs, [...higher, ...later]));
          }
        );
        higher.push(sector);
      });
      if (Math.round(cap.host.size * pitch) % 2 && frame.radii.length) {
        const end = [
          frame.x - frame.normal[0] / pitch,
          frame.y - frame.normal[1] / pitch,
        ];
        // Stems end on the first return circle, so the central odd port forms a T.
        segments.push(
          ...later.reduce(
            (pieces, cover) =>
              pieces.flatMap((piece) => clipLine(piece, cover)),
            [{ line: true, from: [frame.x, frame.y], to: end, owner: index }]
          )
        );
      }
      return;
    }
    const own = [];
    connections.forEach(([type, edge], slot) => {
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
