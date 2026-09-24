import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { createTubeGeometry } from '@modules/gpuTubes';
import { applySolverConfig } from '@modules/reactionDiffusion';

import useSkullField from '../hooks/useSkullField';
import authorStrands from '../utils/authorStrands';
import createStrandMaterial from '../utils/strandMaterial';
import {
  createStrandUniforms,
  syncStrandUniforms,
} from '../utils/strandUniforms';

const POINTS_PER_STRAND = 96;

function Threads({ config, restartRef }) {
  const { field, shell, surface } = useSkullField(config);

  const strands = useMemo(
    () =>
      authorStrands({
        flowCount: config.flowCount,
        lift: config.skullHeight * 0.0015,
        pointsPerStrand: POINTS_PER_STRAND,
        seed: config.strandSeed,
        surface,
        wanderCount: config.wanderCount,
        wanderSteps: config.wanderSteps,
      }),
    [
      config.flowCount,
      config.skullHeight,
      config.strandSeed,
      config.wanderCount,
      config.wanderSteps,
      surface,
    ]
  );

  const uniforms = useMemo(createStrandUniforms, []);

  const geometry = useMemo(
    () =>
      createTubeGeometry({
        instanceCount: strands.count,
        radialSegments: config.radialSegments,
        tubularSegments: config.tubularSegments,
      }),
    [config.radialSegments, config.tubularSegments, strands.count]
  );

  const material = useMemo(
    () =>
      createStrandMaterial({
        field: field.fieldTexture,
        frameMode: config.frameMode,
        pointsPerStrand: POINTS_PER_STRAND,
        strands,
        tubularSegments: config.tubularSegments,
        uniforms,
        volume: shell,
      }),
    [config.frameMode, config.tubularSegments, field, shell, strands, uniforms]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const renderer = useThree((state) => state.gl);
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    restartRef.current = () => field.reset(renderer);
  }, [field, renderer, restartRef]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20) * config.growthSpeed;
    syncStrandUniforms(uniforms, config);
    uniforms.phase.value += dt;
    applySolverConfig(field.uniforms, config);
    field.uniforms.front.value = 1e6;
    field.update(renderer, dt);
  });

  return (
    <mesh
      castShadow
      frustumCulled={false}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
}

export default memo(Threads);
