/* eslint-disable no-param-reassign */

/* eslint-disable no-plusplus */
import React, { useMemo, useRef } from 'react';

import { useFrame, useLoader } from '@react-three/fiber';

import * as THREE from 'three';

import { textureFile } from '@utils/appUtils';

import noiseGlsl from './noiseGlsl';
import {
  DEFAULT_CONTROL_POINTS,
  buildPlumeGeometry,
  toVec3,
} from './perlinNoiseSplineShared';

const vertexShader = /* glsl */ `
${noiseGlsl}

uniform float time;
uniform float weight;
uniform float noiseFreq;
uniform float noiseAmp;

attribute float arcT;

varying float ao;
varying float vArcT;

void main() {
  vec3 noiseCoord = 0.5 * normal + vec3(arcT * 2.0);
  float noise = turbulence(noiseCoord - time);

  float displacement = weight * noise;
  displacement += noiseAmp * pnoise(noiseFreq * position - vec3(2.0 * time), vec3(100.0));

  ao = noise;
  vArcT = arcT;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * displacement, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tExplosion;
uniform vec3 smokeLightColor;
uniform vec3 smokeDarkColor;
uniform float greyscale;

varying float ao;
varying float vArcT;

float rand(vec3 s, float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, s)) * 43758.5453 + seed);
}

vec3 smokeGradient(float heat) {
  if (heat < 0.5) return mix(smokeDarkColor, smokeLightColor, heat * 2.0);
  return mix(smokeLightColor, smokeLightColor + 0.1, (heat - 0.5) * 2.0);
}

void main() {
  float r = 0.01 * rand(vec3(12.9898, 78.233, 151.7182), 0.0);
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 fireColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  float lum = dot(fireColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 fireDesaturated = mix(smokeDarkColor, smokeLightColor, lum);
  vec3 fireResult = mix(fireColor, fireDesaturated, greyscale);

  float heat = clamp(ao * 2.0 + 0.5 + r, 0.0, 1.0);
  vec3 smokeColor = smokeGradient(heat);

  vec3 color = mix(fireResult, smokeColor, vArcT);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function PerlinNoiseSplineGL({
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
  const startTime = useMemo(() => Date.now(), []);

  const tExplosionRaw = useLoader(
    THREE.TextureLoader,
    textureFile(texturePath)
  );
  const tExplosion = useMemo(() => {
    tExplosionRaw.colorSpace = THREE.NoColorSpace;
    return tExplosionRaw;
  }, [tExplosionRaw]);

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

  const uniformsRef = useRef({
    tExplosion: { value: tExplosion },
    time: { value: 0.0 },
    weight: { value: weight },
    noiseFreq: { value: noiseFreq },
    noiseAmp: { value: noiseAmp },
    smokeLightColor: { value: new THREE.Color(smokeLightColor) },
    smokeDarkColor: { value: new THREE.Color(smokeDarkColor) },
    greyscale: { value: greyscale ? 1.0 : 0.0 },
  });

  const uniforms = uniformsRef.current;
  uniforms.tExplosion.value = tExplosion;
  uniforms.weight.value = weight;
  uniforms.noiseFreq.value = noiseFreq;
  uniforms.noiseAmp.value = noiseAmp;
  uniforms.smokeLightColor.value.set(smokeLightColor);
  uniforms.smokeDarkColor.value.set(smokeDarkColor);
  uniforms.greyscale.value = greyscale ? 1.0 : 0.0;

  useFrame(() => {
    if (!animated) return;
    uniforms.time.value = 0.00025 * speed * (Date.now() - startTime);
  });

  return (
    <group position={position}>
      <mesh geometry={geometry}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
