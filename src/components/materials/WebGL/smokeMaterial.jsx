import React from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

import * as THREE from 'three';

// ── Perlin 2D (same implementation as the coffee-steam reference) ───────────
const PERLIN_2D = /* glsl */ `
  vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float perlin2d(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
      vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }
`;

// ── FBM (fractional Brownian motion) layered on top of perlin2d ─────────────
const FBM_2D = /* glsl */ `
  // Rotate helper to de-correlate successive octaves
  mat2 fbmRot = mat2(0.8660, 0.5, -0.5, 0.8660); // ~30° rotation

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.55;
    for (int i = 0; i < 4; i++) {
      v += a * perlin2d(p);
      p = fbmRot * p * 2.08;
      a *= 0.48;
    }
    return v;
  }
`;

// ── Vertex shader ───────────────────────────────────────────────────────────
const SMOKE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uRiseSpeed;
  uniform float uSpreadStrength;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${PERLIN_2D}
  ${FBM_2D}

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Scrolling displacement UV (moves in rise direction; flipped for inverted smoke)
    vec2 displacementUv = uv * 4.0;
    displacementUv.y -= uTime * uRiseSpeed * uScrollDir;

    // Displacement builds up away from the wick
    float displacementStrength = pow(uv.y * 2.8, 2.0);

    // Two-octave FBM gives more organic horizontal waver
    float waver = fbm(displacementUv);
    float waver2 = perlin2d(displacementUv * 2.1 + vec2(4.7, 0.0));

    pos.x += (waver + waver2 * 0.3) * displacementStrength * uSpreadStrength;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// ── Fragment shader ─────────────────────────────────────────────────────────
const SMOKE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uTimeFrequency;
  uniform vec2  uUvFrequency;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uScrollDir;

  varying vec2 vUv;

  ${PERLIN_2D}
  ${FBM_2D}

  void main() {
    vec2 uv = vUv * uUvFrequency;
    uv.y -= uTime * uTimeFrequency * uScrollDir;

    // Smooth S-curve fade at horizontal edges
    float borderAlpha = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
    // Gentle power-curve fade toward the far tip (smoke disperses)
    borderAlpha *= pow(1.0 - vUv.y, 0.65);
    // Short fade-in at the wick so there is no hard edge at the source
    borderAlpha *= smoothstep(0.0, 0.1, vUv.y);

    // FBM for multi-octave wispy density
    float density = fbm(uv);
    density *= borderAlpha;
    density *= uOpacity;
    density = clamp(density, 0.0, 1.0);

    gl_FragColor = vec4(uColor, density);
  }
`;

// ── Material definition ─────────────────────────────────────────────────────
const SmokeMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uTimeFrequency: 0.45,
    uUvFrequency: new THREE.Vector2(3, 5),
    uColor: new THREE.Color('#b8b8b8'),
    uOpacity: 0.6,
    uRiseSpeed: 0.35,
    uSpreadStrength: 0.18,
    uScrollDir: 1.0,
  },
  SMOKE_VERT,
  SMOKE_FRAG
);

extend({ SmokeMaterialImpl });

const SmokeMaterial = React.forwardRef(function SmokeMaterial(
  { side = THREE.DoubleSide },
  forwardedRef
) {
  return (
    <smokeMaterialImpl
      ref={forwardedRef}
      transparent
      side={side}
      depthWrite={false}
      toneMapped={false}
    />
  );
});

export default SmokeMaterial;
