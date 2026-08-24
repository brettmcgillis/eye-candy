import React, { useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import {
  attribute,
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

import { textureFile } from '@utils/appUtils';

import {
  approximateTurbulence,
  signedPerlinApprox,
  smokeGradient,
} from './perlinNoiseNodes';
import {
  DEFAULT_CONTROL_POINTS,
  buildPlumeGeometry,
  toVec3,
} from './perlinNoiseSplineShared';

useTexture.preload(textureFile('explosion.png'));

export default function PerlinNoiseSplineGPU({
  controlPoints = DEFAULT_CONTROL_POINTS,
  tubularSegments = 128,
  radialSegments = 64,
  capSegments = 16,
  speed = 1.0,
  weight = 10.0,
  noiseFreq = 0.05,
  noiseAmp = 5.0,
  animated = true,
  texturePath = 'explosion.png',
  smokeLightColor = '#4a4a58',
  smokeDarkColor = '#1a1a22',
  greyscale = false,
  position = [0, 0, 0],
}) {
  const tExplosion = useTexture(textureFile(texturePath));

  useEffect(() => {
    tExplosion.colorSpace = THREE.NoColorSpace;
    tExplosion.needsUpdate = true;
  }, [tExplosion]);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      controlPoints.map((controlPoint) => toVec3(controlPoint.position)),
      false,
      'centripetal'
    );
    return buildPlumeGeometry(
      curve,
      controlPoints,
      tubularSegments,
      radialSegments,
      capSegments
    );
  }, [controlPoints, tubularSegments, radialSegments, capSegments]);

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
    const arcTAttr = attribute('arcT', 'float');
    const arcT = arcTAttr.toVarying('vPerlinNoiseSplineArcT');
    const timeVec = vec3(uniforms.time, uniforms.time, uniforms.time);
    const arcNoise = vec3(
      arcTAttr.mul(float(2.0)),
      arcTAttr.mul(float(2.0)),
      arcTAttr.mul(float(2.0))
    );

    const aoNode = approximateTurbulence(
      normalLocal.mul(float(0.5)).add(arcNoise).sub(timeVec)
    );
    const ao = aoNode.toVarying('vPerlinNoiseSplineAo');
    const billow = signedPerlinApprox(
      positionLocal.mul(uniforms.noiseFreq).sub(timeVec.mul(float(2.0)))
    );

    const displacement = uniforms.weight
      .mul(aoNode)
      .add(uniforms.noiseAmp.mul(billow));

    const jitter = float(0.0);
    const paletteT = ao
      .mul(float(1.1))
      .add(float(1.0))
      .div(float(1.1))
      .add(jitter)
      .clamp(0.0, 1.0);
    const fireColor = tslTexture(tExplosion, vec2(0.5, paletteT)).rgb;
    const luminance = dot(fireColor, vec3(0.2126, 0.7152, 0.0722));
    const fireDesaturated = mix(
      uniforms.smokeDarkColor,
      uniforms.smokeLightColor,
      luminance
    );
    const fireResult = mix(fireColor, fireDesaturated, uniforms.greyscale);
    const smokeHeat = ao
      .mul(float(2.0))
      .add(float(0.5))
      .add(jitter)
      .clamp(0.0, 1.0);
    const smokeColor = smokeGradient(
      smokeHeat,
      uniforms.smokeDarkColor,
      uniforms.smokeLightColor
    );

    const materialNode = new THREE.MeshBasicNodeMaterial({
      side: THREE.FrontSide,
      toneMapped: false,
    });

    materialNode.positionNode = positionLocal.add(
      normalLocal.mul(displacement)
    );
    materialNode.colorNode = mix(fireResult, smokeColor, arcT);

    return materialNode;
  }, [tExplosion, uniforms]);

  useFrame(({ clock }) => {
    if (!animated) return;
    uniforms.time.value = clock.getElapsedTime() * 0.25 * speed;
  });

  return (
    <group position={position}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
