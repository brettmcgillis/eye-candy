import { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import { fog, rangeFogFactor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

function FogRig({ config }) {
  const scene = useThree((state) => state.scene);

  const uniforms = useMemo(
    () => ({
      color: uniform(new THREE.Color()),
      far: uniform(20),
      near: uniform(6),
    }),
    []
  );

  const fogNode = useMemo(
    () =>
      fog(
        uniforms.color,
        rangeFogFactor(uniforms.near, uniforms.far.max(uniforms.near.add(0.01)))
      ),
    [uniforms]
  );

  useEffect(() => {
    uniforms.color.value.set(config.fogColor);
    uniforms.near.value = config.fogNear;
    uniforms.far.value = config.fogFar;
  }, [config.fogColor, config.fogFar, config.fogNear, uniforms]);

  useEffect(() => {
    if (!config.fogEnabled) return undefined;

    const previous = scene.fogNode;
    scene.fogNode = fogNode;

    return () => {
      scene.fogNode = previous;
    };
  }, [config.fogEnabled, fogNode, scene]);

  return null;
}

export default memo(FogRig);
