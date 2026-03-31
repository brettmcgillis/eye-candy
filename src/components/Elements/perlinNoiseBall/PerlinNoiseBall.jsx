//
// PerlinNoiseBall — vertex-displacement ball using periodic Perlin noise.
//
// Base component shared by Fireball (colour) and SmokeBall (greyscale).
// The `greyscale` prop (0 or 1) switches the fragment shader between a
// texture-sampled fire palette and a desaturated smoke palette.
//
// Verbatim displacement logic from:
//   https://www.clicktorelease.com/code/perlin/explosion.html
//
import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame, useLoader } from '@react-three/fiber';

import noiseGlsl from './noiseGlsl';

// ─── Vertex shader ───────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
${noiseGlsl}

varying float ao;
uniform float time;
uniform float weight;

void main() {
  float noise = turbulence( 0.5 * normal + time );

  float displacement = - weight * ( 10.0 * -0.10 * noise );
  displacement += 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );

  ao = noise;
  vec3 newPosition = position + normal * vec3( displacement );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
`;

// ─── Fragment shader ─────────────────────────────────────────────────────────

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tExplosion;
uniform float greyscale;
uniform vec3 smokeLightColor;
uniform vec3 smokeDarkColor;

varying float ao;

float random(vec3 scale, float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

void main() {
  float r = 0.01 * random(vec3(12.9898, 78.233, 151.7182), 0.0);
  float v = (1.1 * ao + 1.0) / 1.1;
  vec3 texColor = texture2D(tExplosion, vec2(0.5, v + r)).rgb;

  // Smoke: desaturate the texture and remap through smoke palette
  float lum = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
  vec3 smokeColor = mix(smokeDarkColor, smokeLightColor, lum);

  vec3 color = mix(texColor, smokeColor, greyscale);
  gl_FragColor = vec4(color, 1.0);
}
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function PerlinNoiseBall({
  position = [0, 0, 0],
  radius = 20,
  detail = 6,
  speed = 1.0,
  weight = 10.0,
  texturePath = '/images/explosion.png',
  animated = true,
  greyscale = false,
  smokeLightColor = '#4a4a58',
  smokeDarkColor = '#1a1a22',
}) {
  const startTime = useMemo(() => Date.now(), []);

  const tExplosionRaw = useLoader(THREE.TextureLoader, texturePath);
  const tExplosion = useMemo(() => {
    tExplosionRaw.colorSpace = THREE.NoColorSpace;
    return tExplosionRaw;
  }, [tExplosionRaw]);

  const uniformsRef = useRef({
    tExplosion: { value: tExplosion },
    time: { value: 0.0 },
    weight: { value: weight },
    greyscale: { value: greyscale ? 1.0 : 0.0 },
    smokeLightColor: { value: new THREE.Color(smokeLightColor) },
    smokeDarkColor: { value: new THREE.Color(smokeDarkColor) },
  });

  const uniforms = uniformsRef.current;
  uniforms.tExplosion.value = tExplosion;
  uniforms.weight.value = weight;
  uniforms.greyscale.value = greyscale ? 1.0 : 0.0;
  uniforms.smokeLightColor.value.set(smokeLightColor);
  uniforms.smokeDarkColor.value.set(smokeDarkColor);

  useFrame(() => {
    if (!animated) return;
    uniforms.time.value = 0.00025 * speed * (Date.now() - startTime);
  });

  return (
    <mesh position={position}>
      <icosahedronGeometry args={[radius, detail]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}
