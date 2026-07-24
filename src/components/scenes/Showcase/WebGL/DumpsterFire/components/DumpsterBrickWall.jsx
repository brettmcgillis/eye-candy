import * as THREE from 'three';

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { InstancedRigidBodies } from '@react-three/rapier';

import { modelFile } from '../../../../../../utils/appUtils';
import bakeInstancedGeometry from '../../../../../../utils/instancedGeometry';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import {
  FLOOR_COLLIDER_HALF_EXTENTS,
  FLOOR_COLLIDER_POSITION,
  SCENE_ROOT_POSITION,
} from '../utils/sceneData';

const CINDERBLOCK_ASSETS = Object.freeze([
  {
    key: 'cinderBlock1',
    filePath: modelFile('/cinderblock1.glb'),
    geometryKey: 'cinderblock1',
  },
  {
    key: 'cinderBlock2',
    filePath: modelFile('/cinderblock2.glb'),
    geometryKey: 'cinderblock2',
  },
  {
    key: 'cinderBlock3',
    filePath: modelFile('/cinderblock3.glb'),
    geometryKey: 'cinderblock3',
  },
  {
    key: 'cinderBlock4',
    filePath: modelFile('/cinderblock4.glb'),
    geometryKey: 'cinderblock4',
  },
]);

const SOURCE_GEOMETRY_TRANSFORM = Object.freeze({
  rotation: [Math.PI, 0, 0],
  scale: 0.01,
});

const TARGET_BLOCK_HEIGHT = 0.48;
const BLOCK_HORIZONTAL_GAP = 0.04;
const BLOCK_VERTICAL_GAP = 0.02;
const WALL_EDGE_MARGIN = 1.2;
const MAX_WALL_COLUMNS = 24;
const MAX_WALL_ROWS = 9;
const WALL_BLOCK_MASS = 0.9;
const EPSILON = 0.0001;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getGeometrySize(geometry) {
  geometry.computeBoundingBox();

  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);

  return size;
}

function centerGeometry(geometry) {
  geometry.computeBoundingBox();

  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);

  return bakeInstancedGeometry(geometry, [
    {
      position: [-center.x, -center.y, -center.z],
    },
  ]);
}

function buildNormalizedVariants(variantDefinitions) {
  const bakedVariants = variantDefinitions.map((variant) => ({
    key: variant.key,
    geometry: bakeInstancedGeometry(variant.geometry, [
      SOURCE_GEOMETRY_TRANSFORM,
    ]),
    material: variant.material,
  }));

  const referenceSize = getGeometrySize(bakedVariants[0].geometry);
  const referenceScale =
    TARGET_BLOCK_HEIGHT / Math.max(referenceSize.y, EPSILON);
  const targetSize = referenceSize.clone().multiplyScalar(referenceScale);

  return bakedVariants.map((variant) => {
    const geometrySize = getGeometrySize(variant.geometry);
    const normalizedGeometry = bakeInstancedGeometry(variant.geometry, [
      {
        scale: [
          targetSize.x / Math.max(geometrySize.x, EPSILON),
          targetSize.y / Math.max(geometrySize.y, EPSILON),
          targetSize.z / Math.max(geometrySize.z, EPSILON),
        ],
      },
    ]);

    return {
      key: variant.key,
      geometry: centerGeometry(normalizedGeometry),
      // Own a mutable clone so the tint can be updated in place without
      // rebuilding the geometry or remounting the physics bodies.
      material: variant.material.clone(),
    };
  });
}

function buildWallBatches({ enabled, length, height, variants }) {
  if (!enabled || !variants.length) {
    return [];
  }

  const blockSize = getGeometrySize(variants[0].geometry);
  const maxWallLength =
    FLOOR_COLLIDER_HALF_EXTENTS[0] * 2 - WALL_EDGE_MARGIN * 2;
  const clampedLength = clamp(length, blockSize.x, maxWallLength);
  const columnSpan = blockSize.x + BLOCK_HORIZONTAL_GAP;
  const rowSpan = blockSize.y + BLOCK_VERTICAL_GAP;
  const fullColumns = clamp(
    Math.floor((clampedLength + BLOCK_HORIZONTAL_GAP) / columnSpan),
    1,
    MAX_WALL_COLUMNS
  );
  const rows = clamp(
    Math.floor((height + BLOCK_VERTICAL_GAP) / rowSpan),
    1,
    MAX_WALL_ROWS
  );
  const localFloorCenterX = FLOOR_COLLIDER_POSITION[0] - SCENE_ROOT_POSITION[0];
  const localBackEdgeZ =
    FLOOR_COLLIDER_POSITION[2] -
    SCENE_ROOT_POSITION[2] -
    FLOOR_COLLIDER_HALF_EXTENTS[2] +
    WALL_EDGE_MARGIN +
    blockSize.z / 2;
  const instancesByVariant = variants.reduce((acc, variant) => {
    acc[variant.key] = [];

    return acc;
  }, {});

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const isStaggeredRow = rowIndex % 2 === 1 && fullColumns > 1;
    const columns = isStaggeredRow ? fullColumns - 1 : fullColumns;
    const rowLength =
      columns * blockSize.x + Math.max(columns - 1, 0) * BLOCK_HORIZONTAL_GAP;
    const rowStartX = localFloorCenterX - rowLength / 2 + blockSize.x / 2;
    const rowY = blockSize.y / 2 + rowIndex * rowSpan;

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const variant = variants[(rowIndex * 3 + columnIndex) % variants.length];

      instancesByVariant[variant.key].push({
        key: `${variant.key}-${rowIndex}-${columnIndex}`,
        position: [rowStartX + columnIndex * columnSpan, rowY, localBackEdgeZ],
        rotation: [0, 0, 0],
      });
    }
  }

  return variants
    .map((variant) => ({
      ...variant,
      instances: instancesByVariant[variant.key],
    }))
    .filter((variant) => variant.instances.length > 0);
}

function useCinderblockVariants(tintColor) {
  const cinderBlock1 = useGLTF(CINDERBLOCK_ASSETS[0].filePath);
  const cinderBlock2 = useGLTF(CINDERBLOCK_ASSETS[1].filePath);
  const cinderBlock3 = useGLTF(CINDERBLOCK_ASSETS[2].filePath);
  const cinderBlock4 = useGLTF(CINDERBLOCK_ASSETS[3].filePath);

  const variants = useMemo(() => {
    const gltfs = [cinderBlock1, cinderBlock2, cinderBlock3, cinderBlock4];
    const variantDefinitions = CINDERBLOCK_ASSETS.map((asset, index) => ({
      key: asset.key,
      geometry: gltfs[index].nodes[asset.geometryKey].geometry,
      material: gltfs[index].materials.cinder_block_mat,
    }));

    return buildNormalizedVariants(variantDefinitions);
  }, [cinderBlock1, cinderBlock2, cinderBlock3, cinderBlock4]);

  // Update the tint in place so a color change never rebuilds the wall.
  useLayoutEffect(() => {
    variants.forEach((variant) => {
      variant.material.color?.set(tintColor);
    });
  }, [variants, tintColor]);

  return variants;
}

function BrickWallBatch({ batch, onCollisionEnter }) {
  const bodiesRef = useRef([]);
  const interactiveRootRef = useRef(null);
  const registerInteractiveTarget = useTrashBlasterStore(
    (s) => s.registerInteractiveTarget
  );
  const unregisterInteractiveTarget = useTrashBlasterStore(
    (s) => s.unregisterInteractiveTarget
  );

  useEffect(() => {
    const targetId = `brick-wall-${batch.key}`;

    registerInteractiveTarget(targetId, {
      getObject: () => interactiveRootRef.current,
      buildSession: ({ intersection, clientX, clientY }) => {
        const { instanceId } = intersection;

        if (!Number.isInteger(instanceId)) {
          return null;
        }

        const body = bodiesRef.current[instanceId];

        if (!body) {
          return null;
        }

        return {
          kind: 'body',
          body,
          point: intersection.point.clone(),
          clientX,
          clientY,
        };
      },
    });

    return () => {
      unregisterInteractiveTarget(targetId);
    };
  }, [batch.key, registerInteractiveTarget, unregisterInteractiveTarget]);

  return (
    <group ref={interactiveRootRef}>
      <InstancedRigidBodies
        colliders="cuboid"
        mass={WALL_BLOCK_MASS}
        friction={1.35}
        restitution={0.03}
        linearDamping={1.3}
        angularDamping={1.7}
        canSleep
        ccd
        instances={batch.instances}
        onCollisionEnter={onCollisionEnter}
        ref={bodiesRef}
      >
        <instancedMesh
          args={[batch.geometry, batch.material, batch.instances.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      </InstancedRigidBodies>
    </group>
  );
}

export default function DumpsterBrickWall({ config, onTrashCollision }) {
  const cleanupNonce = useTrashBlasterStore((s) => s.cleanupNonce);
  const enabled = config?.enabled ?? false;
  const length = config?.length ?? 24;
  const height = config?.height ?? 3.6;
  const tintColor = config?.tintColor ?? '#a65a4d';
  const wallPosition = config?.position ?? [0, 0, 0];
  const variants = useCinderblockVariants(tintColor);
  const wallBatches = useMemo(() => {
    return buildWallBatches({
      enabled,
      length,
      height,
      variants,
    });
  }, [enabled, height, length, variants]);

  if (!enabled || wallBatches.length === 0) {
    return null;
  }

  return (
    <group position={wallPosition}>
      {wallBatches.map((batch) => (
        <BrickWallBatch
          key={`${cleanupNonce}-${batch.key}`}
          batch={batch}
          onCollisionEnter={onTrashCollision}
        />
      ))}
    </group>
  );
}

useGLTF.preload(CINDERBLOCK_ASSETS[0].filePath);
useGLTF.preload(CINDERBLOCK_ASSETS[1].filePath);
useGLTF.preload(CINDERBLOCK_ASSETS[2].filePath);
useGLTF.preload(CINDERBLOCK_ASSETS[3].filePath);
