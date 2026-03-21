// CRTStaticMaterial.js
import React, { useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/* ---------------------------------------------
   Shaders 
----------------------------------------------*/

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;

/* snow controls */
uniform float uSnowAmount;
uniform float uSnowScale;
uniform float uSnowSpeed;
uniform float uSnowSize;
uniform float uSnap;

/* band + RF controls */
uniform float uBandStrength;
uniform float uBandSpeed;
uniform float uBandScale;

uniform float uRFStrength;
uniform float uRFScale;
uniform float uRFSpeed;

uniform float uCurvature;
uniform float uVignette;

varying vec2 vUv;

/* ----------------- Noise utils ----------------- */

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1,311.7)),
           dot(p, vec2(269.5,183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  vec2 u = f*f*(3.0-2.0*f);

  return mix(
    mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
        dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
        dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for(int i = 0; i < 4; i++) {
    v += a * perlin(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

/* ----------------- CRT warp ----------------- */

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

/* ----------------- Main ----------------- */

void main() {

  vec2 uv = curve(vUv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float t = floor(uTime * uSnowSpeed * uSnap) / uSnap;

  /* ----------------- pixelated snow UVs ----------------- */

  vec2 pixelUV = floor(uv * uSnowSize) / uSnowSize;

  /* ----------------- perlin snow field ----------------- */

  float snowField = fbm(pixelUV * uSnowScale + vec2(t * 1.2, -t * 0.7));
  snowField = snowField * 0.5 + 0.5;

  float snow = step(0.5, snowField);
  snow = mix(snowField, snow, 0.65);

  /* ----------------- rolling static bands ----------------- */

  float band =
    sin(uv.y * uBandScale + uTime * uBandSpeed) * 0.5 + 0.5;

  float bandNoise = fbm(vec2(uv.y * 4.0, uTime * 0.15));
  band *= bandNoise;

  snow += band * uBandStrength;

  /* ----------------- RF interference streaks ----------------- */

  float rf = fbm(vec2(uv.y * uRFScale, uTime * uRFSpeed));
  rf = smoothstep(0.4, 0.75, rf);
  rf *= sin((uv.y + uTime * 0.15) * 80.0) * 0.5 + 0.5;

  snow += rf * uRFStrength;

  /* ----------------- tone shaping ----------------- */

  snow = clamp(snow, 0.0, 1.0);

  vec3 color = vec3(snow);

  /* vignette */
  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.75, uVignette, d);
  color *= vig;

  /* global mix */
  color = mix(vec3(0.0), color, uSnowAmount);

  gl_FragColor = vec4(color, 1.0);
}
`;

/* ---------------------------------------------
   Drei material class
----------------------------------------------*/

const CrtStaticMaterial = shaderMaterial(
  {
    uTime: 0,

    uSnowAmount: 1,
    uSnowScale: 140,
    uSnowSpeed: 1,
    uSnowSize: 240,
    uSnap: 60,

    uBandStrength: 0.35,
    uBandSpeed: 0.6,
    uBandScale: 8,

    uRFStrength: 0.25,
    uRFScale: 22,
    uRFSpeed: 0.4,

    uCurvature: 0,
    uVignette: 1.1,
  },
  vertexShader,
  fragmentShader
);

extend({ CrtStaticMaterial });

export default function CRTStaticMaterial({
  snowAmount = 1,
  snowScale = 180,
  snowSpeed = 1,
  snowSize = 240,
  curvature = 0.12,
  vignette = 0.75,
  bandStrength = 0.35,
  bandSpeed = 0.6,
  bandScale = 8,
  snap = 24,
  rfStrength = 0.25,
  rfScale = 22,
  rfSpeed = 0.4,
}) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) ref.current.uTime += delta;
  });

  return (
    <crtStaticMaterial
      ref={ref}
      key={CrtStaticMaterial.key}
      transparent={false}
      depthWrite
      toneMapped={false}
      uSnowAmount={snowAmount}
      uSnowScale={snowScale}
      uSnowSpeed={snowSpeed}
      uSnowSize={snowSize}
      uSnap={snap}
      uBandStrength={bandStrength}
      uBandSpeed={bandSpeed}
      uBandScale={bandScale}
      uRFStrength={rfStrength}
      uRFScale={rfScale}
      uRFSpeed={rfSpeed}
      uCurvature={curvature}
      uVignette={vignette}
    />
  );
}
