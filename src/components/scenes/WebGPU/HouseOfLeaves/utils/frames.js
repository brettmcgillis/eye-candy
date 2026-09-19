// A placement: where a space's local origin sits and which way its local +X
// points. Every zone is authored in its own local frame and placed by one of
// these, which is what lets the same living room be laid down again at the
// end of the return hallway.
export function createFrame({ x = 0, y = 0, z = 0, heading = 0 }) {
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  return {
    x,
    y,
    z,
    heading,
    cos,
    sin,
    // three rotates +X toward -Z for a positive Y rotation, so a bearing of
    // `heading` in the XZ plane is a rotation of its negative.
    rotationY: -heading,
    toWorld(lx, lz) {
      return { x: x + lx * cos - lz * sin, z: z + lx * sin + lz * cos };
    },
    toLocal(wx, wz) {
      const dx = wx - x;
      const dz = wz - z;
      return { x: dx * cos + dz * sin, z: -dx * sin + dz * cos };
    },
    // A world-space step turned into a local one: rotation only.
    deltaToLocal(dx, dz) {
      return { x: dx * cos + dz * sin, z: -dx * sin + dz * cos };
    },
  };
}

// Yaw 0 looks down -Z, so a direction (dx, dz) is looked along by this yaw.
export function yawFromDirection(dx, dz) {
  return Math.atan2(-dx, -dz);
}

export function yawAlong(frame, localAngle = 0) {
  const a = frame.heading + localAngle;
  return yawFromDirection(Math.cos(a), Math.sin(a));
}

// The frame with the given heading whose local point (lx, lz) lands on the
// world point.
export function frameThroughPoint(point, heading, lx, lz) {
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  return createFrame({
    x: point.x - (lx * cos - lz * sin),
    y: point.y ?? 0,
    z: point.z - (lx * sin + lz * cos),
    heading,
  });
}

export function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
