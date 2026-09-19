import { boxAir, buildAir } from './air';

export const LIVING_ROOM_DEFAULTS = {
  depth: 6.4,
  width: 4.6,
  height: 2.6,
  wallThickness: 0.14,
  door: { width: 1.0, height: 2.3, z: 0 },
};

// The ordinary room. Local +X points at the north wall, which stands at x=0;
// the room lies behind it in -X. When the doorway is open, the door is a box
// of air through the wall's thickness whose far face is dropped, so the
// corridor's first stretch continues it with nothing in between.
export default function createLivingRoom(options = {}) {
  const o = { ...LIVING_ROOM_DEFAULTS, ...options };
  const door = { ...LIVING_ROOM_DEFAULTS.door, ...o.door };
  const hw = o.width * 0.5;
  const room = boxAir(-o.depth, 0, 0, o.height, -hw, hw);
  if (!o.open) return buildAir([room]);
  const hd = door.width * 0.5;
  const passage = boxAir(
    -0.3,
    o.wallThickness,
    0,
    door.height,
    door.z - hd,
    door.z + hd,
    { drop: ['x+'] }
  );
  return buildAir([room, passage]);
}
