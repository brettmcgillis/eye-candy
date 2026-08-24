import React, { memo, useEffect, useMemo } from 'react';

import createBladeMaterial from '../utils/bladeMaterial';
import { createGrassStore, scatterChunkBlades } from '../utils/grass';
import { CHUNK_SIZE } from '../utils/worldgen';

// One chunk of instanced grass. The store is allocated once per chunk and
// refilled in place on rescatter; the material binds this chunk's instanced
// attributes plus the world offset (blades bend from world-space wind and
// the ghost's position), while all artistic uniforms are shared.
function GrassChunk({ bladeCount, clumpSize, cx, cz, uniforms, world }) {
  const store = useMemo(() => createGrassStore(bladeCount), [bladeCount]);

  useEffect(() => {
    scatterChunkBlades(store, {
      clumpSize,
      count: bladeCount,
      cx,
      cz,
      world,
    });
  }, [bladeCount, clumpSize, cx, cz, store, world]);

  const material = useMemo(
    () =>
      createBladeMaterial({
        chunkOffsetX: cx * CHUNK_SIZE,
        chunkOffsetZ: cz * CHUNK_SIZE,
        store,
        uniforms,
      }),
    [cx, cz, store, uniforms]
  );

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => store.geometry.dispose(), [store]);

  return (
    <mesh
      frustumCulled={false}
      geometry={store.geometry}
      material={material}
      position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]}
    />
  );
}

export default memo(GrassChunk);
