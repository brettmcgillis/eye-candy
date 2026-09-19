// Which spaces are drawn. Not "the one the walker is in" — standing on the
// top landing you can see the room above you — but everything within reach,
// created ahead of the walk so it is there before it is looked at. The one
// exception is the pair of hallways that meet at a living room's doorway:
// only the one the open doorway belongs to may exist, or they would overlap.
export function ensureAhead(walker, world, margin) {
  const { zone, progress } = walker;
  if (zone.kind === 'livingRoom' && zone.doorState.attached === 'next') {
    world.next(zone, { to: 'corridor' });
  }
  if (zone.kind === 'corridor' && zone.role === 'out') {
    if (progress > zone.length - margin) world.next(zone, { to: 'greatRoom' });
  }
  if (zone.kind === 'greatRoom') world.next(zone, { to: 'shaft' });
  if (zone.kind === 'shaft') world.next(zone, { to: 'shaftFloor' });
  if (zone.kind === 'corridor' && zone.role === 'return') {
    if (progress > zone.length - margin) world.next(zone, { to: 'livingRoom' });
  }
}

function roomTouching(candidate, rooms) {
  return rooms.find(
    (room) =>
      (room.lap === candidate.lap && candidate.role === 'out') ||
      (room.lap === candidate.lap + 1 && candidate.role === 'return')
  );
}

// A lap's spaces are laid down where the previous lap's happen to be — the
// next hallway runs back through where the floor was — so nothing from an
// earlier lap is drawn once the walk has left it, except the hallway we just
// came in by while the door is still open onto it.
function lapAllowed(candidate, walker) {
  if (candidate.lap === walker.lap) return true;
  return (
    candidate.lap === walker.lap - 1 &&
    candidate.kind === 'corridor' &&
    candidate.role === 'return' &&
    walker.zone.kind === 'livingRoom'
  );
}

export default function selectMounted(walker, world, margin) {
  const { zone, position } = walker;
  const rooms = world.zones.filter((z) => z.kind === 'livingRoom');
  return world.zones.filter((candidate) => {
    if (candidate === zone) return true;
    if (!lapAllowed(candidate, walker)) return false;
    if (!candidate.near(position, margin)) return false;
    if (candidate.kind !== 'corridor') return true;
    const touching = roomTouching(candidate, rooms);
    if (!touching) return true;
    // From inside the room: only the hallway the door belongs to.
    if (zone.kind === 'livingRoom' && zone === touching) {
      return world.corridorFor(touching) === candidate;
    }
    // From the other hallway at the same door: never both at once.
    if (zone.kind === 'corridor' && roomTouching(zone, rooms) === touching) {
      return false;
    }
    return true;
  });
}
