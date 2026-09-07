// Where the pieces sit relative to one another. One coordinate system for the
// whole descent rather than one per zone: the corridor's far end *is* the
// room's doorway, and the room's hole *is* the head of the shaft, so the
// walker crossing between them changes which zone is clamping its step without
// anything in the world moving. Zones with their own origins would each be
// correct on their own and teleport at every threshold.
export default function createLayout(config) {
  const doorwayX = config.hallLength;
  const centre = { x: doorwayX + config.roomSize * 0.5, z: 0 };
  return {
    doorwayX,
    roomCentre: centre,
    // The stairwell drops from the middle of the room, so the shaft's axis and
    // the room's hole are the same point by construction.
    origin: centre,
  };
}
