/* eslint-disable camelcase */
import {
  Fn,
  float,
  int,
  mx_fractal_noise_float,
  smoothstep,
  time,
  uniform,
  vec3,
} from 'three/tsl';

import { memo, useEffect, useMemo } from 'react';

import WebGPUProjectorLight from '../../../../../elements/webgpu/lights/WebGPUProjectorLight';

function MoonlightProjectorInner({
  color = '#b8ccf0',
  peakIntensity = 200,
  posX = -3,
  posY = 12,
  posZ = 6,
  angle = 24,
  cloudDensity = -0.2,
  cloudContrast = 0.5,
  cloudScale = 4.5,
  cloudSpeed = 1.0,
  cloudFloor = 0.15,
}) {
  const uniforms = useMemo(
    () => ({
      noiseScale: uniform(cloudScale),
      density: uniform(cloudDensity),
      contrast: uniform(cloudContrast),
      speed: uniform(cloudSpeed),
      floor: uniform(cloudFloor),
    }),
    []
  );

  const colorNode = useMemo(() => {
    const { noiseScale, density, contrast, speed, floor: floorU } = uniforms;
    return Fn(([projectorUV]) => {
      const noisePos = vec3(
        projectorUV.x.mul(noiseScale).add(time.mul(speed.mul(float(0.022)))),
        projectorUV.y.mul(noiseScale).add(time.mul(speed.mul(float(0.009)))),
        time.mul(speed.mul(float(0.018)))
      );
      const cloud = mx_fractal_noise_float(
        noisePos,
        int(4),
        float(2.0),
        float(0.45)
      );
      // density controls where in the noise range light starts breaking through
      // (negative = more light overall, positive = heavier overcast)
      const transmission = smoothstep(density, density.add(contrast), cloud);
      // floor guarantees a minimum moonlight even through the thickest cloud
      const floored = transmission.mul(float(1.0).sub(floorU)).add(floorU);
      return vec3(float(0.72), float(0.84), float(1.0)).mul(floored);
    });
  }, [uniforms]);

  // Sync uniform values when Leva controls change
  useEffect(() => {
    uniforms.noiseScale.value = cloudScale;
  }, [cloudScale, uniforms]);
  useEffect(() => {
    uniforms.density.value = cloudDensity;
  }, [cloudDensity, uniforms]);
  useEffect(() => {
    uniforms.contrast.value = cloudContrast;
  }, [cloudContrast, uniforms]);
  useEffect(() => {
    uniforms.speed.value = cloudSpeed;
  }, [cloudSpeed, uniforms]);
  useEffect(() => {
    uniforms.floor.value = cloudFloor;
  }, [cloudFloor, uniforms]);

  return (
    <WebGPUProjectorLight
      angle={(angle * Math.PI) / 180}
      castShadow={false}
      color={color}
      colorNode={colorNode}
      decay={2}
      distance={0}
      intensity={peakIntensity}
      penumbra={0.5}
      position={[posX, posY, posZ]}
      shadowFar={24}
      shadowFocus={1}
      shadowMapSize={[2048, 2048]}
      shadowNear={0.5}
      target={[0, 0.5, 0]}
    />
  );
}

export default memo(MoonlightProjectorInner);
