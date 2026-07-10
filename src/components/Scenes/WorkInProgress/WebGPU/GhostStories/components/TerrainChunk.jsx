import React, { memo, useEffect, useMemo } from 'react';

import { RigidBody, TrimeshCollider } from '@react-three/rapier';

import buildTerrainChunk from '../utils/terrainChunk';
import { CHUNK_SIZE } from '../utils/worldgen';

// One streamed ground tile: CPU-displaced mesh + fixed trimesh collider
// built from the exact same vertices, positioned at the chunk center.
function TerrainChunk({ cx, cz, material, segments, world }) {
  const { colliderIndices, colliderVertices, geometry } = useMemo(
    () => buildTerrainChunk(world, cx, cz, segments),
    [cx, cz, segments, world]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <RigidBody
      colliders={false}
      position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]}
      type="fixed"
    >
      <mesh geometry={geometry} material={material} />
      <TrimeshCollider args={[colliderVertices, colliderIndices]} />
    </RigidBody>
  );
}

export default memo(TerrainChunk);
