import * as THREE from 'three/webgpu';

import { EDGE_EPSILON, archHeightAt, sampleSpan } from './geometryUtils';

export const THRESHOLD_DEFAULTS = {
  wallWidth: 14,
  wallHeight: 9,
  thickness: 0.35,
  openingWidth: 4.5,
  openingHeight: 7,
  archRise: 2.25,
  columns: 64,
  arched: true,
};

// The archway that should not be there: a wall plane with an opening cut in
// it, standing at the mouth of the endless corridor. Placeholder for the
// domestic side — enough to judge the scale contrast at the threshold, without
// pretending to be finished trim.
export default function createThreshold(options = {}) {
  const o = { ...THRESHOLD_DEFAULTS, ...options };
  const columns = Math.max(4, Math.round(o.columns));
  const hw = o.wallWidth * 0.5;
  const positions = [];
  const indices = [];

  const openingTop = (z) => {
    if (o.arched) {
      return archHeightAt(z, {
        width: o.openingWidth,
        height: o.openingHeight,
        archRise: o.archRise,
      });
    }
    return Math.abs(z) < o.openingWidth * 0.5 ? o.openingHeight : 0;
  };

  const halfOpening = o.openingWidth * 0.5;
  const samples = sampleSpan(-hw, hw, columns, [-halfOpening, halfOpening]);

  const face = (x, flip) => {
    const base = positions.length / 3;
    samples.forEach((sample) => {
      const z = sample.v;
      const low = openingTop(z + sample.side * EDGE_EPSILON);
      positions.push(x, Math.min(low, o.wallHeight), z);
      positions.push(x, o.wallHeight, z);
    });
    for (let i = 0; i < samples.length - 1; i += 1) {
      const a = base + i * 2;
      if (flip) indices.push(a, a + 3, a + 1, a, a + 2, a + 3);
      else indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  };

  face(0, false);
  face(o.thickness, true);

  // Reveal: the depth of the opening through the wall's thickness. Sampled
  // across the opening only — `openingTop` returns 0 outside it, and reusing
  // that here made the soffit dive to the floor at the jambs.
  const springLine = Math.max(0, o.openingHeight - o.archRise);
  const soffitSteps = Math.max(8, Math.round(columns / 2));
  const soffitBase = positions.length / 3;
  for (let i = 0; i <= soffitSteps; i += 1) {
    const z = -o.openingWidth * 0.5 + (i / soffitSteps) * o.openingWidth;
    const top = Math.max(openingTop(z), springLine);
    positions.push(0, top, z);
    positions.push(o.thickness, top, z);
  }
  for (let i = 0; i < soffitSteps; i += 1) {
    const a = soffitBase + i * 2;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }

  // Jambs: the reveal above only covers the arch. Without these the opening
  // has a soffit and no sides, so walking through it there is nothing left or
  // right of you.
  // Overlap the soffit slightly: meeting it exactly leaves a hairline seam at
  // the springline that rays (and grazing views) fall through.
  const jambHeight = (o.arched ? springLine : o.openingHeight) + 0.02;
  if (jambHeight > 0.001) {
    [-1, 1].forEach((side) => {
      const z = side * o.openingWidth * 0.5;
      const j = positions.length / 3;
      positions.push(0, 0, z);
      positions.push(o.thickness, 0, z);
      positions.push(0, jambHeight, z);
      positions.push(o.thickness, jambHeight, z);
      if (side > 0) indices.push(j, j + 1, j + 3, j, j + 3, j + 2);
      else indices.push(j, j + 3, j + 1, j, j + 2, j + 3);
    });
  }

  // The floor of the opening. Without it the doorway is a hole you can fall
  // through: the wall has thickness, so the passage through it needs a floor
  // like any other passage.
  if (o.thickness > 0.001) {
    const zf = o.openingWidth * 0.5;
    const f = positions.length / 3;
    positions.push(0, 0, -zf);
    positions.push(o.thickness, 0, -zf);
    positions.push(0, 0, zf);
    positions.push(o.thickness, 0, zf);
    indices.push(f, f + 1, f + 3, f, f + 3, f + 2);
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
