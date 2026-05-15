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
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

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
  const { scene } = useThree();
  const lightRef = useRef(null);

  // Uniform nodes — created once, values updated on prop changes
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

  // Cloud colorNode — SpotLightNode.setupDirect checks light.colorNode and calls
  // it with lightProjectionUV ([0,1] UV across the cone). Unlike ProjectorLight
  // which uses lightShadowMatrix (needs castShadow=true, causes frustum-corner
  // triangle artifacts), SpotLight's lightProjectionUV needs no shadow matrix.
  const colorNode = useMemo(() => {
    const { noiseScale, density, contrast, speed, floor: floorU } = uniforms;
    return Fn(([lightCoord]) => {
      const noisePos = vec3(
        lightCoord.x.mul(noiseScale).add(time.mul(speed.mul(float(0.022)))),
        lightCoord.y.mul(noiseScale).add(time.mul(speed.mul(float(0.009)))),
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

  // Build the light once; re-run only if scene or colorNode changes
  useEffect(() => {
    const target = new THREE.Object3D();
    target.position.set(0, 0.5, 0);
    scene.add(target);

    const light = new THREE.SpotLight(new THREE.Color(color), peakIntensity);
    light.colorNode = colorNode;
    light.position.set(posX, posY, posZ);
    light.angle = (angle * Math.PI) / 180;
    light.penumbra = 0.5;
    light.decay = 2;
    light.distance = 0;
    light.castShadow = false;
    light.target = target;
    scene.add(light);
    lightRef.current = light;

    return () => {
      scene.remove(light);
      scene.remove(target);
      lightRef.current = null;
    };
  }, [scene, colorNode]);

  // Sync mutable light properties when controls change
  useEffect(() => {
    if (lightRef.current) lightRef.current.color.set(color);
  }, [color]);
  useEffect(() => {
    if (lightRef.current) lightRef.current.intensity = peakIntensity;
  }, [peakIntensity]);
  useEffect(() => {
    if (lightRef.current) lightRef.current.position.set(posX, posY, posZ);
  }, [posX, posY, posZ]);
  useEffect(() => {
    if (lightRef.current) lightRef.current.angle = (angle * Math.PI) / 180;
  }, [angle]);

  return null;
}

export default memo(MoonlightProjectorInner);
