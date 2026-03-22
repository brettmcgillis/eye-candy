import * as THREE from 'three';

import React from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const FLAME_VERT = /* glsl */ `
  uniform float time;
  varying vec2 vUv;
  varying float hValue;

  float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos *= vec3(0.8, 2.0, 0.725);
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + 0.25) * 3.1415926) * 0.25
           + noise(vec2(0.0, time)) * 0.125
           + noise(vec2(position.x + time, position.z + time)) * 0.5) * position.y;
    pos.x += noise(vec2(time * 2.0, (position.y - time) * 4.0)) * hValue * 0.0312;
    pos.z += noise(vec2((position.y - time) * 4.0, time * 2.0)) * hValue * 0.0312;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FLAME_FRAG = /* glsl */ `
  varying float hValue;
  varying vec2 vUv;

  vec3 heatmapGradient(float t) {
    return clamp(
      (pow(t, 1.5) * 0.8 + 0.2) * vec3(
        smoothstep(0.0, 0.35, t) + t * 0.5,
        smoothstep(0.5, 1.0, t),
        max(1.0 - t * 1.7, t * 7.0 - 6.0)
      ), 0.0, 1.0);
  }

  void main() {
    float v = abs(smoothstep(0.0, 0.4, hValue) - 1.0);
    float alpha = (1.0 - v) * 0.99;
    alpha -= 1.0 - smoothstep(1.0, 0.97, hValue);
    gl_FragColor = vec4(
      heatmapGradient(smoothstep(0.0, 0.3, hValue)) * vec3(0.95, 0.95, 0.4),
      alpha
    );
    gl_FragColor.rgb = mix(vec3(0.0, 0.0, 1.0), gl_FragColor.rgb, smoothstep(0.0, 0.3, hValue));
    // Inner-core glow: concentrated in the lower flame body, fades toward tip and base
    float coreGlow = smoothstep(0.0, 0.3, hValue) * (1.0 - smoothstep(0.3, 0.88, hValue));
    gl_FragColor.rgb += vec3(1.0, 0.88, 0.5) * coreGlow * 0.65;
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1.0, hValue));
  }
`;

const FlameMaterialImpl = shaderMaterial({ time: 0 }, FLAME_VERT, FLAME_FRAG);

extend({ FlameMaterialImpl });

const FlameMaterial = React.forwardRef(function FlameMaterial(
  { side = THREE.FrontSide },
  forwardedRef
) {
  return (
    <flameMaterialImpl
      ref={forwardedRef}
      transparent
      side={side}
      depthWrite={false}
    />
  );
});

export default FlameMaterial;
