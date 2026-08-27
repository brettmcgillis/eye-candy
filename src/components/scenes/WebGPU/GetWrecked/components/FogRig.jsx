import { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import {
  fog,
  oneMinus,
  positionView,
  positionWorld,
  smoothstep,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Haze for the godray shaft to land in, installed as `scene.fogNode`. Pooled
// low to the ground by a height ramp so the shaft reads as a cone standing in
// still air rather than an even wash that would just grey the black
// background back out.
function FogRig({ config }) {
  const scene = useThree((state) => state.scene);

  const uniforms = useMemo(
    () => ({
      color: uniform(new THREE.Color(config.fogColor)),
      near: uniform(config.fogNear),
      far: uniform(config.fogFar),
      bottom: uniform(config.fogBottom),
      top: uniform(config.fogTop),
      density: uniform(config.fogDensity),
    }),
    []
  );

  useEffect(() => {
    uniforms.color.value.set(config.fogColor);
    uniforms.near.value = config.fogNear;
    uniforms.far.value = config.fogFar;
    uniforms.bottom.value = config.fogBottom;
    uniforms.top.value = config.fogTop;
    uniforms.density.value = config.fogDensity;
  }, [
    config.fogBottom,
    config.fogColor,
    config.fogDensity,
    config.fogFar,
    config.fogNear,
    config.fogTop,
    uniforms,
  ]);

  const fogNode = useMemo(() => {
    // Both ramps are built low-edge-first and inverted where needed: a
    // smoothstep whose first edge exceeds its second is undefined in WGSL.
    const distance = smoothstep(
      uniforms.near,
      uniforms.far.max(uniforms.near.add(0.01)),
      positionView.z.negate()
    );
    const height = oneMinus(
      smoothstep(
        uniforms.bottom,
        uniforms.top.max(uniforms.bottom.add(0.01)),
        positionWorld.y
      )
    );
    return fog(uniforms.color, distance.mul(height).mul(uniforms.density));
  }, [uniforms]);

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
