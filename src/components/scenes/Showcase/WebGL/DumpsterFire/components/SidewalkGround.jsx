import * as THREE from 'three';

import React, { useLayoutEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../../../utils/appUtils';
import { GROUND_Y } from '../utils/sceneData';

// Long curb-with-sidewalk slabs (~7m x 5.9m each). The four variants are
// near-identical paving sections cycled to break up obvious repetition. Corner
// and driveway pieces are left out of the auto-tiler for hand placement later.
const TILE_VARIANTS = Object.freeze([
  {
    key: 'curb',
    file: 'curb.glb',
    node: 'Sidewwalk_Long3_SidewalkMat_0',
    weight: 1,
  },
  {
    key: 'curb2',
    file: 'curb2.glb',
    node: 'Sidewwalk_Long2_SidewalkMat_0',
    weight: 1,
  },
  {
    key: 'curb3',
    file: 'curb3.glb',
    node: 'Sidewwalk_Long1_SidewalkMat_0',
    weight: 1,
  },
  {
    key: 'curb4',
    file: 'curb4.glb',
    node: 'Sidewwalk_Long_SidewalkMat_0',
    weight: 1,
  },
]);

// Deterministic pseudo-random in [0, 1) so the tile layout is stable across
// renders (no flicker when controls change).
function hash2d(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;

  return n - Math.floor(n);
}

function pickVariant(weightedKeys, column, row) {
  const index = Math.floor(hash2d(column, row) * weightedKeys.length);

  return weightedKeys[Math.min(index, weightedKeys.length - 1)];
}

function centerGeometryHorizontally(sourceGeometry) {
  const geometry = sourceGeometry.clone();

  geometry.computeBoundingBox();

  const { min, max } = geometry.boundingBox;
  const centerX = (min.x + max.x) / 2;
  const centerZ = (min.z + max.z) / 2;

  geometry.translate(-centerX, 0, -centerZ);
  geometry.computeBoundingBox();

  return geometry;
}

function useSidewalkTiles() {
  const curb = useGLTF(modelFile(TILE_VARIANTS[0].file));
  const curb2 = useGLTF(modelFile(TILE_VARIANTS[1].file));
  const curb3 = useGLTF(modelFile(TILE_VARIANTS[2].file));
  const curb4 = useGLTF(modelFile(TILE_VARIANTS[3].file));

  return useMemo(() => {
    const gltfs = [curb, curb2, curb3, curb4];
    const tiles = {};
    let maxTop = -Infinity;

    TILE_VARIANTS.forEach((variant, index) => {
      const gltf = gltfs[index];
      const geometry = centerGeometryHorizontally(
        gltf.nodes[variant.node].geometry
      );

      maxTop = Math.max(maxTop, geometry.boundingBox.max.y);
      tiles[variant.key] = {
        geometry,
        material: gltf.materials.SidewalkMat,
      };
    });

    // Grid cell size is driven by the first base tile so seams stay flush.
    const baseBox = tiles[TILE_VARIANTS[0].key].geometry.boundingBox;
    const cellX = baseBox.max.x - baseBox.min.x;
    const cellZ = baseBox.max.z - baseBox.min.z;

    const weightedKeys = TILE_VARIANTS.flatMap((variant) =>
      Array.from({ length: variant.weight }, () => variant.key)
    );

    return { tiles, cellX, cellZ, maxTop, weightedKeys };
  }, [curb, curb2, curb3, curb4]);
}

function TileLayer({ geometry, material, positions }) {
  const meshRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const dummy = new THREE.Object3D();

    positions.forEach((position, index) => {
      dummy.position.set(position[0], position[1], position[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, positions.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

export default function SidewalkGround({ config }) {
  const enabled = config?.enabled ?? true;
  const length = config?.length ?? 16;
  const rows = Math.max(1, Math.round(config?.rows ?? 2));
  const rotationDeg = config?.rotationDeg ?? 0;
  const position = config?.position ?? { x: 0, y: GROUND_Y, z: 0 };
  const { tiles, cellX, cellZ, maxTop, weightedKeys } = useSidewalkTiles();

  const positionsByVariant = useMemo(() => {
    const columns = Math.max(1, Math.round(length / cellX));
    const startX = -((columns - 1) * cellX) / 2;
    const startZ = -((rows - 1) * cellZ) / 2;
    const grouped = {};

    TILE_VARIANTS.forEach((variant) => {
      grouped[variant.key] = [];
    });

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const variantKey = pickVariant(weightedKeys, column, row);

        grouped[variantKey].push([
          startX + column * cellX,
          0,
          startZ + row * cellZ,
        ]);
      }
    }

    return grouped;
  }, [cellX, cellZ, length, rows, weightedKeys]);

  if (!enabled) {
    return null;
  }

  // Align the tile tops to the trash floor (GROUND_Y) so debris rests on the
  // sidewalk surface rather than floating or sinking.
  const groupY = (position.y ?? GROUND_Y) - maxTop;

  return (
    <group
      position={[position.x ?? 0, groupY, position.z ?? 0]}
      rotation={[0, (rotationDeg * Math.PI) / 180, 0]}
    >
      {TILE_VARIANTS.map((variant) => (
        <TileLayer
          key={variant.key}
          geometry={tiles[variant.key].geometry}
          material={tiles[variant.key].material}
          positions={positionsByVariant[variant.key]}
        />
      ))}
    </group>
  );
}

TILE_VARIANTS.forEach((variant) => {
  useGLTF.preload(modelFile(variant.file));
});
