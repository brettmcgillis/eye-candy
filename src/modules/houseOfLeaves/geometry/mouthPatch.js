import { boxAir, buildAir, loftAir } from './air';

// The hallways that leave a landing. A patch of the shaft wall — a run of
// the streamed loft's own cells, so it shares every edge with the wall
// around it — is rebuilt as a closed slab of air and unioned with each
// mouth's box. What survives is the wall with a true rectangular hole in it
// and the tunnel beyond, cut by the same boolean, in one surface.
export default function createMouthPatch({
  ring,
  inward,
  rows,
  cols,
  colsTotal,
  depth = 4,
  mouths,
}) {
  const patch = loftAir({
    rows,
    cols,
    colsTotal,
    ring,
    inward,
    depth,
  });
  const parts = [patch];
  mouths.forEach((mouth) => {
    const box = boxAir(
      -mouth.reach,
      mouth.depth,
      mouth.sill,
      mouth.sill + mouth.height,
      -mouth.width * 0.5,
      mouth.width * 0.5,
      { drop: mouth.open ? ['x+'] : [] }
    );
    // Local +X is the bearing out of the shaft; the box is stood on the
    // wall point and turned to face away from the axis.
    box.rotateY(-mouth.angle);
    box.translate(mouth.x, 0, mouth.z);
    parts.push(box);
  });
  return buildAir(parts);
}
