import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Billboard: project centre into view space, then offset by screen-aligned quad
  vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float sx = length(vec3(modelMatrix[0]));
  float sy = length(vec3(modelMatrix[1]));
  // Anchor at the bottom of the plane — fire grows upward from origin
  center.xy += (position.xy + vec2(0.0, 0.5)) * vec2(sx, sy);
  gl_Position = projectionMatrix * center;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uIntensity;
uniform float uSeed;
varying vec2 vUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  // Scroll UVs upward → upward flame flow
  vec2 q = uv + vec2(uSeed * 1.3, 0.0);
  q.y -= uTime * 0.8;

  // Layered turbulent noise
  float n1 = fbm(q * 3.5);
  float n2 = fbm(q * 7.0 + n1 * 0.4 + uSeed);

  // Shape mask: parabolic, wider at base, narrowing toward tip
  float centerDist = abs(uv.x - 0.5) * 2.0;
  float baseTaper = mix(1.2, 0.15, uv.y);
  float shape = smoothstep(baseTaper, 0.0, centerDist);

  // Height fade — fire dissipates upward
  float heightFade = smoothstep(1.0, 0.0, pow(uv.y, 1.4));

  // Combined intensity
  float fire = shape * heightFade * mix(n1, n2, 0.45) * uIntensity;

  // Colour ramp: hot core → orange → dark red
  vec3 hot  = vec3(1.0, 0.95, 0.75);
  vec3 mid  = vec3(1.0, 0.45, 0.05);
  vec3 cool = vec3(0.65, 0.12, 0.02);

  vec3 col = mix(cool, mid, smoothstep(0.15, 0.40, fire));
  col = mix(col, hot, smoothstep(0.50, 0.85, fire));

  float alpha = smoothstep(0.04, 0.18, fire);

  gl_FragColor = vec4(col, alpha);
}
`;

export default function FireBillboard({
  position = [0, 0, 0],
  scale = [1, 2, 1],
  intensity = 1.5,
  speed = 1.0,
  seed = 0,
}) {
  const matRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uSeed: { value: seed },
    }),
    [intensity, seed]
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta * speed;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
