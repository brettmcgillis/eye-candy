import React, { memo, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

import WallSegment from './WallSegment';

const CINDERBLOCK_FILES = [
  'cinderblock1.glb',
  'cinderblock2.glb',
  'cinderblock3.glb',
  'cinderblock4.glb',
];
const CINDERBLOCK_NODES = [
  'cinderblock1',
  'cinderblock2',
  'cinderblock3',
  'cinderblock4',
];
const SOURCE_TRANSFORM_EULER = new THREE.Euler(Math.PI, 0, 0);
const SOURCE_SCALE = 0.01;
// Real cinderblocks run ~19-20cm tall with a thin mortar joint (todo 36).
const TARGET_BLOCK_HEIGHT = 0.2;
const HORIZONTAL_GAP = 0.012;
const EPSILON = 0.0001;
// Per-variant lightness/hue offsets around the base tint so the wall reads
// as shades of brick reds/browns instead of one flat (and previously
// near-black) color (todo item 54). Applied via offsetHSL on the base tint.
const VARIANT_SHADE_OFFSETS = [
  { h: 0, s: 0, l: 0 },
  { h: 0.01, s: 0.02, l: 0.06 },
  { h: -0.012, s: -0.03, l: -0.04 },
  { h: 0.005, s: 0.04, l: 0.1 },
];

function boundsOf(geometry) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  return { size, center };
}

// Static (non-physics) instanced cinderblock wall — a stripped-down sibling
// of DumpsterFire's DumpsterBrickWall (kept local since scenes never share
// code across folders; see docs/scene-conventions.md).
function useCinderblockVariants(tintColor) {
  const block1 = useGLTF(modelFile(CINDERBLOCK_FILES[0]));
  const block2 = useGLTF(modelFile(CINDERBLOCK_FILES[1]));
  const block3 = useGLTF(modelFile(CINDERBLOCK_FILES[2]));
  const block4 = useGLTF(modelFile(CINDERBLOCK_FILES[3]));
  const gltfs = useMemo(
    () => [block1, block2, block3, block4],
    [block1, block2, block3, block4]
  );

  return useMemo(() => {
    const raw = gltfs.map((gltf, i) => ({
      geometry: gltf.nodes[CINDERBLOCK_NODES[i]].geometry,
      material: gltf.materials.cinder_block_mat,
    }));

    const normalized = raw.map(({ geometry, material }) => {
      const baked = geometry.clone();
      baked.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(),
          new THREE.Quaternion().setFromEuler(SOURCE_TRANSFORM_EULER),
          new THREE.Vector3(SOURCE_SCALE, SOURCE_SCALE, SOURCE_SCALE)
        )
      );
      return { geometry: baked, material };
    });

    const referenceSize = boundsOf(normalized[0].geometry).size;
    const scale = TARGET_BLOCK_HEIGHT / Math.max(referenceSize.y, EPSILON);

    return normalized.map(({ geometry, material }, index) => {
      const { size, center } = boundsOf(geometry);
      const finalGeometry = geometry.clone();
      finalGeometry.translate(-center.x, -center.y, -center.z);
      finalGeometry.scale(scale, scale, scale);

      const tintedMaterial = material.clone();
      const shade = VARIANT_SHADE_OFFSETS[index % VARIANT_SHADE_OFFSETS.length];
      tintedMaterial.color.set(tintColor).offsetHSL(shade.h, shade.s, shade.l);

      return {
        geometry: finalGeometry,
        material: tintedMaterial,
        size: size.multiplyScalar(scale),
      };
    });
  }, [gltfs, tintColor]);
}

// Three segments in a bracket/staple shape ('[' seen from above): a back
// wall plus two side "returns" that extend toward the viewer, closing off
// the staggered-brick silhouette (todo item 36). All three faces are
// paintable (todo item 47). The side segments are pulled half a block into
// the back wall along z (and inward along x by half a block's depth) so the
// two grids interpenetrate at the corner — combined with each grid's
// staggered rows overhanging their ends (WallSegment.jsx), no every-other-
// row corner holes remain (todo item 49).
function BrickWall({
  height = 3.2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  sideDepth = 6,
  tintColor = '#9c5a45',
  width = 12,
}) {
  const variants = useCinderblockVariants(tintColor);
  const blockSize = variants[0].size;
  const cornerTuckZ = blockSize.x / 2;
  const cornerTuckX = blockSize.z / 2;

  return (
    <group position={position} rotation={rotation}>
      <WallSegment
        variants={variants}
        length={width}
        height={height}
        brickGap={HORIZONTAL_GAP}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        paintable
      />
      <WallSegment
        variants={variants}
        length={sideDepth}
        height={height}
        brickGap={HORIZONTAL_GAP}
        position={[-width / 2 + cornerTuckX, 0, sideDepth / 2 - cornerTuckZ]}
        rotation={[0, Math.PI / 2, 0]}
        paintable
      />
      <WallSegment
        variants={variants}
        length={sideDepth}
        height={height}
        brickGap={HORIZONTAL_GAP}
        position={[width / 2 - cornerTuckX, 0, sideDepth / 2 - cornerTuckZ]}
        rotation={[0, -Math.PI / 2, 0]}
        paintable
      />
    </group>
  );
}

export default memo(BrickWall);

CINDERBLOCK_FILES.forEach((file) => useGLTF.preload(modelFile(file)));
