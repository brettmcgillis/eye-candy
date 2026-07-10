/* eslint-disable camelcase */
import {
  clamp,
  fog,
  mx_noise_float,
  positionView,
  positionWorld,
  smoothstep,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

// Height fog that pools in the low ground: a world-space noise field (so
// the layer is patchy, not an even blanket) drifting with the same wind
// direction as the grass, fading in with height below `fogTop` and with
// distance from the camera. A separate long-range haze veils the mountain
// ring. Installed as `scene.fogNode`, so the sky dome opts out via
// `fog={false}` on its material.
function FogRig({ config }) {
  const scene = useThree((state) => state.scene);

  const uniforms = useMemo(
    () => ({
      color: uniform(new THREE.Color(config.fogColor)),
      distFar: uniform(config.fogDistanceFar),
      distNear: uniform(config.fogDistanceNear),
      hazeStrength: uniform(config.fogHazeStrength),
      noiseAmount: uniform(config.fogNoiseAmount),
      noiseScale: uniform(config.fogNoiseScale),
      poolDensity: uniform(config.fogPoolDensity),
      top: uniform(config.fogTop),
      bottom: uniform(config.fogBottom),
      windX: uniform(config.windDirX),
      windZ: uniform(config.windDirZ),
      windSpeed: uniform(config.fogWindSpeed),
    }),
    []
  );

  useEffect(() => {
    uniforms.color.value.set(config.fogColor);
    uniforms.distFar.value = config.fogDistanceFar;
    uniforms.distNear.value = config.fogDistanceNear;
    uniforms.hazeStrength.value = config.fogHazeStrength;
    uniforms.noiseAmount.value = config.fogNoiseAmount;
    uniforms.noiseScale.value = config.fogNoiseScale;
    uniforms.poolDensity.value = config.fogPoolDensity;
    uniforms.top.value = config.fogTop;
    uniforms.bottom.value = config.fogBottom;
    const length = Math.hypot(config.windDirX, config.windDirZ) || 1;
    uniforms.windX.value = config.windDirX / length;
    uniforms.windZ.value = config.windDirZ / length;
    uniforms.windSpeed.value = config.fogWindSpeed;
  }, [
    config.fogBottom,
    config.fogColor,
    config.fogDistanceFar,
    config.fogDistanceNear,
    config.fogHazeStrength,
    config.fogNoiseAmount,
    config.fogNoiseScale,
    config.fogPoolDensity,
    config.fogTop,
    config.fogWindSpeed,
    config.windDirX,
    config.windDirZ,
    uniforms,
  ]);

  const fogNode = useMemo(() => {
    if (!config.fogEnabled) return null;

    // Patchy pool mask: world-space noise blown along the wind.
    const drift = time.mul(uniforms.windSpeed);
    const noise = mx_noise_float(
      vec3(
        positionWorld.x.mul(uniforms.noiseScale).sub(drift.mul(uniforms.windX)),
        positionWorld.y.mul(uniforms.noiseScale.mul(2)),
        positionWorld.z.mul(uniforms.noiseScale).sub(drift.mul(uniforms.windZ))
      )
    )
      .mul(0.5)
      .add(0.5);
    const patchy = noise
      .mul(uniforms.noiseAmount)
      .add(clamp(uniforms.noiseAmount.oneMinus(), 0, 1));

    // Denser toward the ground, gone above fogTop.
    const heightFactor = smoothstep(
      uniforms.top,
      uniforms.bottom,
      positionWorld.y
    );

    // Pool fog only needs a short run-up — the ghost should be able to
    // wade into a fog bank pooled in a dip and visibly sink into it.
    const viewDist = positionView.length();
    const poolRamp = smoothstep(1.0, 8.0, viewDist);
    const pool = heightFactor
      .mul(patchy)
      .mul(uniforms.poolDensity)
      .mul(poolRamp);

    // Long-range haze that swallows the mountain ring.
    const haze = smoothstep(uniforms.distNear, uniforms.distFar, viewDist).mul(
      uniforms.hazeStrength
    );

    const factor = clamp(pool.add(haze), 0, 1);
    return fog(uniforms.color, factor);
  }, [config.fogEnabled, uniforms]);

  useEffect(() => {
    scene.fogNode = fogNode;
    return () => {
      scene.fogNode = null;
    };
  }, [fogNode, scene]);

  return null;
}

export default memo(FogRig);
