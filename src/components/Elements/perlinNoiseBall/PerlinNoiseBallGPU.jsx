import {
  dot,
  float,
  mix,
  normalLocal,
  positionLocal,
  texture as tslTexture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { textureFile } from '../../../utils/appUtils';
import { approximateTurbulence, signedPerlinApprox } from './perlinNoiseNodes';

useTexture.preload(textureFile('explosion.png'));

export default function PerlinNoiseBallGPU({
  position = [0, 0, 0],
  radius = 20,
  detail = 6,
  speed = 1.0,
  weight = 10.0,
  noiseFreq = 0.05,
  noiseAmp = 5.0,
  texturePath = 'explosion.png',
  animated = true,
  greyscale = false,
  smokeLightColor = '#4a4a58',
  smokeDarkColor = '#1a1a22',
}) {
  const tExplosion = useTexture(textureFile(texturePath));

  useEffect(() => {
    tExplosion.colorSpace = THREE.NoColorSpace;
    tExplosion.needsUpdate = true;
  }, [tExplosion]);

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      weight: uniform(weight),
      noiseFreq: uniform(noiseFreq),
      noiseAmp: uniform(noiseAmp),
      greyscale: uniform(greyscale ? 1.0 : 0.0),
      smokeLightColor: uniform(new THREE.Color(smokeLightColor)),
      smokeDarkColor: uniform(new THREE.Color(smokeDarkColor)),
    }),
    []
  );

  useEffect(() => {
    uniforms.weight.value = weight;
    uniforms.noiseFreq.value = noiseFreq;
    uniforms.noiseAmp.value = noiseAmp;
    uniforms.greyscale.value = greyscale ? 1.0 : 0.0;
    uniforms.smokeLightColor.value.set(smokeLightColor);
    uniforms.smokeDarkColor.value.set(smokeDarkColor);
  }, [
    greyscale,
    noiseAmp,
    noiseFreq,
    smokeDarkColor,
    smokeLightColor,
    uniforms,
    weight,
  ]);

  const material = useMemo(() => {
    const timeVec = vec3(uniforms.time, uniforms.time, uniforms.time);
    const aoNode = approximateTurbulence(
      normalLocal.mul(float(0.5)).add(timeVec)
    );
    const ao = aoNode.toVarying('vPerlinNoiseBallAo');
    const billow = signedPerlinApprox(
      positionLocal.mul(uniforms.noiseFreq).add(timeVec.mul(float(2.0)))
    );
    const displacement = uniforms.weight
      .mul(aoNode)
      .add(uniforms.noiseAmp.mul(billow));

    const paletteT = ao
      .mul(float(1.1))
      .add(float(1.0))
      .div(float(1.1))
      .clamp(0.0, 1.0);
    const texColor = tslTexture(tExplosion, vec2(0.5, paletteT)).rgb;
    const luminance = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
    const smokeColor = mix(
      uniforms.smokeDarkColor,
      uniforms.smokeLightColor,
      luminance
    );

    const materialNode = new THREE.MeshBasicNodeMaterial({
      side: THREE.FrontSide,
      toneMapped: false,
    });

    materialNode.positionNode = positionLocal.add(
      normalLocal.mul(displacement)
    );
    materialNode.colorNode = mix(texColor, smokeColor, uniforms.greyscale);

    return materialNode;
  }, [tExplosion, uniforms]);

  useFrame(({ clock }) => {
    if (!animated) return;
    uniforms.time.value = clock.getElapsedTime() * 0.25 * speed;
  });

  return (
    <mesh position={position} material={material}>
      <icosahedronGeometry args={[radius, detail]} />
    </mesh>
  );
}
