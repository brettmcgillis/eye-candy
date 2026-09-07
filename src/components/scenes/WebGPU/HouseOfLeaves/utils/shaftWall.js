import * as THREE from 'three/webgpu';

import { axisAt, riseAt, voidRadiusAt } from '@modules/houseOfLeaves';

// Fine enough that a doorway-sized patch is several cells across. At the old
// resolution one row spanned seven metres, so a seven-metre opening cut a
// single quad and no panel could be sized to cover it sensibly.
export const WALL_ROWS = 240;
export const WALL_COLUMNS = 192;

// The wall is a surface of revolution whose radius and centre both follow the
// profile, so it can never disagree with the stair it encloses — a fixed
// cylinder would clip the treads as soon as the shaft started to open.
//
// Lofted over the visible window and rebuilt only when the walker has moved far
// enough to need it, rather than per frame: at a walk that is once every few
// seconds for a few thousand vertices.
export default function buildShaftWall({
  fromU,
  toU,
  config,
  frame,
  mouths = [],
  uRef,
  rows,
  columns,
}) {
  const p = config.shaft;
  const { landings } = frame;
  // Heights are relative to the build's own reference so the caller can carry
  // the wall forward with a single Y shift; see Shaft.jsx for why that shift
  // must be a difference of rises rather than a stored absolute.
  const riseRef = riseAt(uRef, landings);
  const positions = [];
  const indices = [];
  const du = (toU - fromU) / (rows - 1);

  // A plain patch is given up where a hallway leaves; the arch itself is cut
  // into a curved panel that covers the patch. The patch is deliberately
  // tighter than the panel — both sit at the same radius in the same material,
  // so overlapping is invisible where a gap would not be.
  const heights = new Array(rows);
  const openAt = (row, angle) =>
    mouths.some((mouth) => {
      let delta = angle - mouth.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      if (Math.abs(delta) >= mouth.panelArc * 0.5) return false;
      // The mouth's floor is resolved in the build's own frame, so the patch
      // travels with the wall when it is carried forward by a Y shift.
      const above = -(riseAt(mouth.u, landings) - riseRef) - heights[row];
      return above >= mouth.panelBase && above <= mouth.panelHeight;
    });

  for (let r = 0; r < rows; r += 1) {
    const u = fromU + r * du;
    const radius = voidRadiusAt(u, p) + config.stairWidth + config.wallGap;
    const axis = axisAt(u, p);
    const y = -(riseAt(u, landings) - riseRef);
    heights[r] = y;
    for (let c = 0; c <= columns; c += 1) {
      const a = (c / columns) * Math.PI * 2;
      positions.push(
        axis.x + Math.cos(a) * radius,
        y,
        axis.z + Math.sin(a) * radius
      );
    }
  }

  const stride = columns + 1;
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const angle = (c / columns) * Math.PI * 2;
      if (!openAt(r, angle) && !openAt(r + 1, angle)) {
        const a = r * stride + c;
        const b = a + 1;
        const d = a + stride;
        const e = d + 1;
        indices.push(a, d, e, a, e, b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
