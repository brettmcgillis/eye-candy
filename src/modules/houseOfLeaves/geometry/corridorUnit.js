import { boxAir, buildAir, mergeAir, prismAir } from './air';
import { createJointWall } from './frame';

export const CORRIDOR_UNIT_DEFAULTS = {
  revealDepth: 0.5,
  branchLength: 26,
  deadEndLength: 9,
  branchRoomWidth: 14,
  branchRoomDepth: 12,
  branchRoomHeight: 9,
};

// One streamed stretch of corridor and whatever leaves it — a doorway into a
// room, a branch that carries on into the dark, or one that stops — as a
// single inward-facing surface. The side opening is the branch's own air
// meeting the corridor's, so it cannot be misaligned with what is behind it,
// and the corridor's taper across the opening is simply where the two
// volumes intersect.
//
// `entry` is the section of whatever the unit is entered from when that is
// not the previous unit (a spoke doorway, say); a joint wall covers the
// difference. A stepped change at the far end is covered the same way.
export default function createCorridorUnit({
  segment,
  variation,
  door,
  entry = null,
  options = {},
}) {
  const o = { ...CORRIDOR_UNIT_DEFAULTS, ...options };
  const { length } = segment;
  const along = length * 0.5;
  const side = variation.side ?? 1;
  const kind = variation.kind ?? 'plain';
  const halfMid = (segment.widthStart + segment.widthEnd) * 0.25;
  // Far enough past the wall's inner face, wherever the taper puts it across
  // the opening, that the branch's own faces are all outside the corridor.
  const wallOut = halfMid + o.revealDepth;

  const parts = [
    prismAir({
      length,
      widthStart: segment.widthStart,
      heightStart: segment.heightStart,
      widthEnd: segment.widthEnd,
      heightEnd: segment.heightEnd,
    }),
  ];
  const range = (a, b) => (side > 0 ? [a, b] : [-b, -a]);
  let opening = null;

  if (kind !== 'plain' && door) {
    const halfDoor = door.width * 0.5;
    opening = { along, side, width: door.width, height: door.height, kind };
    if (kind === 'room') {
      const roomWidth = Math.max(door.width + 1, o.branchRoomWidth);
      const roomHeight = Math.max(door.height + 0.5, o.branchRoomHeight);
      parts.push(
        boxAir(
          along - halfDoor,
          along + halfDoor,
          0,
          door.height,
          ...range(0, wallOut + 0.01)
        )
      );
      parts.push(
        boxAir(
          along - roomWidth * 0.5,
          along + roomWidth * 0.5,
          0,
          roomHeight,
          ...range(wallOut, wallOut + o.branchRoomDepth)
        )
      );
      opening.depth = wallOut + o.branchRoomDepth;
    } else {
      const reach = kind === 'deadEnd' ? o.deadEndLength : o.branchLength;
      const far = side > 0 ? 'z+' : 'z-';
      parts.push(
        boxAir(
          along - halfDoor,
          along + halfDoor,
          0,
          door.height,
          ...range(0, halfMid + reach),
          {
            drop: kind === 'junction' ? [far] : [],
          }
        )
      );
      opening.depth = halfMid + reach;
    }
  }

  const pieces = [buildAir(parts)];
  if (entry) {
    pieces.push(
      createJointWall({
        x: 0,
        from: entry,
        to: { width: segment.widthStart, height: segment.heightStart },
      })
    );
  }
  if (segment.jump) {
    pieces.push(
      createJointWall({
        x: length,
        from: { width: segment.widthEnd, height: segment.heightEnd },
        to: { width: segment.nextWidth, height: segment.nextHeight },
      })
    );
  }
  return { geometry: mergeAir(pieces), opening };
}
