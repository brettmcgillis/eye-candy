import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { boxAir, buildAir, loftAir } from './air';

export const SHAFT_FLOOR_DEFAULTS = {
  spokeLength: 3,
  reach: 2,
};

// The bottom of the descent. The last stretch of the shaft wall is rebuilt
// here as a closed loft on the same grid the streamed wall uses — its top ring
// is the wall's own row, its bottom cap is the floor — and every way out is a
// box of air unioned through it. The spokes are short stubs; the corridors
// that continue them begin at their open ends.
export default function createShaftFloor({
  ring,
  inward,
  rowTop,
  rowFloor,
  cols,
  centre,
  exits,
  spokeLength = SHAFT_FLOOR_DEFAULTS.spokeLength,
  reach = SHAFT_FLOOR_DEFAULTS.reach,
  radius,
  depth = 6,
}) {
  // Two rings only: the wall between the top row and the floor is a straight
  // frustum, and every row in between would only be paid for in the boolean.
  const skirt = loftAir({
    rows: [rowTop, rowFloor],
    rowIndices: [rowTop, rowFloor],
    cols: [0, cols],
    colsTotal: cols,
    ring,
    inward,
    depth,
    keepCaps: true,
  });
  // Only the floor is a real surface; the top ring opens into the shaft.
  const { keep } = skirt.attributes;
  const { normal } = skirt.attributes;
  const floorY = ring(rowFloor, 0)[1];
  const { position } = skirt.attributes;
  for (let i = 0; i < keep.count; i += 1) {
    if (normal.getY(i) > 0.9 && position.getY(i) > floorY + 0.01)
      keep.setX(i, 0);
  }

  // One boolean, not one per exit: every union re-walks the skirt, and six
  // of them cost half a second where one costs a tenth of that.
  const boxes = exits.map((exit) => {
    const box = boxAir(
      radius - reach,
      radius + spokeLength,
      floorY,
      floorY + exit.height,
      -exit.width * 0.5,
      exit.width * 0.5,
      { drop: ['x+'] }
    );
    box.rotateY(-exit.angle);
    box.translate(centre.x, 0, centre.z);
    return box.toNonIndexed();
  });
  const cutter = mergeGeometries(boxes, false);
  boxes.forEach((box) => box.dispose());
  return buildAir([skirt, cutter]);
}

// Deterministic ring of exits, varied in size, for the room at the bottom.
export function shaftFloorDoorways({
  count = 6,
  radius = 30,
  baseWidth = 5,
  baseHeight = 8,
  variance = 0.5,
  avoidAngle = null,
  seed = 0,
} = {}) {
  const doorways = [];
  const spacing = (Math.PI * 2) / Math.max(1, count);
  // Centre the widest gap on the angle to avoid, so the last flight of stairs
  // comes down between two exits rather than across one.
  const offset = avoidAngle === null ? 0 : avoidAngle + spacing * 0.5;
  for (let i = 0; i < count; i += 1) {
    const angle = offset + i * spacing;
    const roll = Math.sin((i + seed * 7) * 12.9898) * 43758.5453;
    const jitter = roll - Math.floor(roll);
    const scale = 1 + (jitter - 0.5) * variance;
    const width = Math.max(1.2, baseWidth * scale);
    const height = Math.max(2.2, baseHeight * scale);
    doorways.push({
      index: i,
      angle: ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
      width: Math.min(width, radius * 0.9),
      height,
    });
  }
  return doorways;
}
