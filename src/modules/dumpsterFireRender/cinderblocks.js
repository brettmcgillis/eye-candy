import { useLayoutEffect, useMemo } from 'react';

import * as THREE from 'three';

import useDracoGltf from '@hooks/useDracoGltf';
import { BLOCK_SIZE } from '@modules/dumpsterFire';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

export const CINDERBLOCK_ASSETS = Object.freeze([
  { filePath: modelFile('/cinderblock1.glb'), geometryKey: 'cinderblock1' },
  { filePath: modelFile('/cinderblock2.glb'), geometryKey: 'cinderblock2' },
  { filePath: modelFile('/cinderblock3.glb'), geometryKey: 'cinderblock3' },
  { filePath: modelFile('/cinderblock4.glb'), geometryKey: 'cinderblock4' },
]);

const SOURCE_GEOMETRY_TRANSFORM = Object.freeze({
  rotation: [Math.PI, 0, 0],
  scale: 0.01,
});

function centeredTo(geometry, [sx, sy, sz]) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const scaled = bakeInstancedGeometry(geometry, [
    { scale: [sx / size.x, sy / size.y, sz / size.z] },
  ]);
  const center = new THREE.Vector3();
  scaled.boundingBox.getCenter(center);
  return bakeInstancedGeometry(scaled, [
    { position: [-center.x, -center.y, -center.z] },
  ]);
}

// The four cinderblock GLBs as centred geometries, every one scaled to
// @modules/dumpsterFire's BLOCK_SIZE, each with its own material clone
// tinted in place (a colour change never rebuilds the wall).
export default function useCinderblocks(tintColor) {
  const gltfs = [
    useDracoGltf(CINDERBLOCK_ASSETS[0].filePath),
    useDracoGltf(CINDERBLOCK_ASSETS[1].filePath),
    useDracoGltf(CINDERBLOCK_ASSETS[2].filePath),
    useDracoGltf(CINDERBLOCK_ASSETS[3].filePath),
  ];

  const variants = useMemo(
    () =>
      CINDERBLOCK_ASSETS.map((asset, index) => ({
        geometry: centeredTo(
          bakeInstancedGeometry(
            gltfs[index].nodes[asset.geometryKey].geometry,
            [SOURCE_GEOMETRY_TRANSFORM]
          ),
          BLOCK_SIZE
        ),
        index,
        material: gltfs[index].materials.cinder_block_mat.clone(),
      })),
    gltfs
  );

  useLayoutEffect(() => {
    variants.forEach((variant) => variant.material.color?.set(tintColor));
  }, [variants, tintColor]);

  return variants;
}

CINDERBLOCK_ASSETS.forEach((asset) => useDracoGltf.preload(asset.filePath));
