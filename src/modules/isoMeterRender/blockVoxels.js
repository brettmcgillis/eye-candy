import * as THREE from 'three/webgpu';

import { createBuild, voxelData } from '@modules/isoMeter';

import { createChunkObjects } from './voxelChunks';

export default function buildBlockVoxels(
  piece,
  materials,
  { fill = true } = {}
) {
  const build = createBuild(piece, { record: true });
  build.step(Infinity);
  const heights = build.heights();
  const data = voxelData(build.lattice.cubes, (tri) =>
    piece.shade(tri, heights)
  );
  const group = new THREE.Group();
  createChunkObjects(data, materials, { fill }).forEach((object) =>
    group.add(object)
  );
  return { data, group };
}
