import React, { memo, useCallback, useMemo } from 'react';

import { Grass, scatterGrid } from '@elements/Grass';

import sampleGrassGround from '../utils/grass';
import { CHUNK_SIZE } from '../utils/worldgen';

const MATERIAL = {
  aoFloor: 0.35,
  fade: true,
  gradient: 2,
  gustGlow: 0.35,
  jitterTint: [0.85, 0.95, 1.1],
  roughness: 0.9,
  touch: true,
  wind: 'quick',
};

function GrassChunk({ bladeCount, clumpSize, cx, cz, uniforms, world }) {
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;

  const scatter = useCallback(
    (store) =>
      scatterGrid(store, {
        centerX,
        centerZ,
        clumpSize,
        count: bladeCount,
        sample: (x, z) => sampleGrassGround(world, x, z),
        seed: world.seed,
        size: CHUNK_SIZE,
      }),
    [bladeCount, centerX, centerZ, clumpSize, world]
  );

  const material = useMemo(
    () => ({ ...MATERIAL, chunkOffsetX: centerX, chunkOffsetZ: centerZ }),
    [centerX, centerZ]
  );

  return (
    <Grass
      material={material}
      maxCount={bladeCount}
      position={[centerX, 0, centerZ]}
      scatter={scatter}
      uniforms={uniforms}
    />
  );
}

export default memo(GrassChunk);
