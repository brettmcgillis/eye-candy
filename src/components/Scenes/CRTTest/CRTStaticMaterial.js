// CrtStaticMaterial.js
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

uniform float uStaticAmount;
uniform float uStaticScale;
uniform float uStaticSpeed;
uniform float uSnap;

uniform float uGlitchRate;
uniform float uScanlineStrength;
uniform float uColorBleed;

uniform float uCurvature;
uniform float uVignette;
uniform float uMaskStrength;

uniform float uFlyback;
uniform float uConverge;
uniform float uBloom;
uniform float uBreath;

/* --- next tier --- */
uniform float uRetrace;
uniform float uBeamWidth;
uniform float uChromaDrift;
uniform float uHum;

uniform float uThermalDrift;
uniform float uSpotNoise;
uniform float uMaskMode;
uniform float uBarrelConverge;

varying vec2 vUv;

/* ----------------- Utils ----------------- */

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

/* ----------------- Colors ----------------- */

vec3 WHITE   = vec3(1.0);
vec3 YELLOW  = vec3(1.0,1.0,0.0);
vec3 CYAN    = vec3(0.0,1.0,1.0);
vec3 GREEN   = vec3(0.0,1.0,0.0);
vec3 MAGENTA = vec3(1.0,0.0,1.0);
vec3 RED     = vec3(1.0,0.0,0.0);
vec3 BLUE    = vec3(0.0,0.0,1.0);
vec3 BLACK   = vec3(0.0);
vec3 GRAY    = vec3(0.4);
vec3 NAVY    = vec3(0.0,0.0,0.4);

/* ----------------- RP-219 Layout ----------------- */

vec3 topBars(float x) {
  if (x < 1.0/7.0) return WHITE;
  if (x < 2.0/7.0) return YELLOW;
  if (x < 3.0/7.0) return CYAN;
  if (x < 4.0/7.0) return GREEN;
  if (x < 5.0/7.0) return MAGENTA;
  if (x < 6.0/7.0) return RED;
  return BLUE;
}

vec3 midBars(float x) {
  if (x < 0.14) return BLUE;
  if (x < 0.28) return BLACK;
  if (x < 0.42) return MAGENTA;
  if (x < 0.56) return BLACK;
  if (x < 0.70) return CYAN;
  if (x < 0.84) return BLACK;
  return GRAY;
}

vec3 bottomBars(float x) {
  if (x < 0.18) return NAVY;
  if (x < 0.36) return WHITE;
  if (x < 0.54) return vec3(0.1);
  if (x < 0.72) return BLACK;
  if (x < 0.86) return GRAY;
  return BLACK;
}

/* ----------------- Main ----------------- */

void main() {

  vec2 uv = vUv;

  float t = floor(uTime * uStaticSpeed * uSnap) / uSnap;

  float staticField =
    hash(uv * uStaticScale + vec2(t, -t)) * 0.6 +
    hash(uv * uStaticScale * 1.7 + vec2(-t * 2.0, t)) * 0.4;

  float thermalTime = uTime * 0.02;
  vec2 thermalWarp = vec2(
    sin(thermalTime * 0.7 + uv.y * 2.0),
    cos(thermalTime * 0.5 + uv.x * 2.0)
  ) * 0.004 * uThermalDrift;

  uv += thermalWarp;

  float breathe = sin(uTime * 0.35) * 0.003 * uBreath;
  uv += vec2(sin(uv.y * 3.0 + uTime * 0.4), cos(uv.x * 2.0 + uTime * 0.3)) * breathe;

  uv.x += sin(uTime * 0.12 + uv.y * 3.0) * 0.002 * uChromaDrift;

  uv.y += sin(uTime * 40.0 + uv.y * 800.0) * 0.0015 * uFlyback;
  uv.y += sin(uTime * 3.0) * 0.002 * uFlyback;

  uv = curve(uv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 centered = uv * 2.0 - 1.0;
  float barrel = dot(centered, centered);

  float drift =
    sin(uTime * 0.6) *
    0.002 *
    uConverge *
    mix(0.3, 1.5, barrel * uBarrelConverge);

  vec2 rUV = uv + vec2(drift, 0.0);
  vec2 bUV = uv - vec2(drift, 0.0);

  vec3 bars;

  if (uv.y > 0.38) bars = topBars(uv.x);
  else if (uv.y > 0.30) bars = midBars(uv.x);
  else bars = bottomBars(uv.x);

  vec3 rBars = bars;
  vec3 bBars = bars;

  if (rUV.y > 0.38) rBars = topBars(rUV.x);
  else if (rUV.y > 0.30) rBars = midBars(rUV.x);
  else rBars = bottomBars(rUV.x);

  if (bUV.y > 0.38) bBars = topBars(bUV.x);
  else if (bUV.y > 0.30) bBars = midBars(bUV.x);
  else bBars = bottomBars(bUV.x);

  bars.r = rBars.r;
  bars.b = bBars.b;

  bars.r += hash(uv + uTime) * uColorBleed;
  bars.b -= hash(uv - uTime) * uColorBleed;

  bars += hash(uv * 60.0 + uTime * 0.4) * 0.02;

  float luma = dot(bars, vec3(0.299,0.587,0.114));
  float beam = mix(900.0, 700.0, smoothstep(0.4,1.0,luma) * uBeamWidth);
  beam += staticField * 120.0 * uSpotNoise;

  float scan = sin(uv.y * beam) * 0.05 * uScanlineStrength;
  bars -= scan;

  vec3 triad = vec3(
    sin(uv.x * 900.0),
    sin(uv.x * 900.0 + 2.1),
    sin(uv.x * 900.0 + 4.2)
  ) * 0.5 + 0.5;

  float grille = sin(uv.x * 1400.0) * 0.5 + 0.5;
  vec3 aperture = vec3(grille);

  vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
  bars *= mix(vec3(1.0), mask, uMaskStrength);

  bars += bars * smoothstep(0.65, 1.0, luma) * uBloom;

  float retrace = smoothstep(0.0, 0.04, abs(fract(uTime * 0.8) - uv.y));
  bars *= mix(1.0, 0.55, retrace * uRetrace);

  float hum = sin((uv.y + uTime * 0.15) * 6.2831) * 0.04 * uHum;
  bars -= hum;

  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.75, uVignette, d);
  bars *= vig;

  float spot =
    hash(uv * uStaticScale * 0.8 + uTime) *
    staticField *
    0.15 *
    uSpotNoise;

  bars += spot;

  vec3 staticColor = vec3(staticField);
  float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime * 10.0), 0.0)));
  vec3 finalColor = mix(bars, staticColor, glitch * uStaticAmount);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

/* ---------------------------------------------
   Drei material class
----------------------------------------------*/

const CrtStaticMaterial = shaderMaterial(
  {
    uTime: 0,

    uStaticAmount: 0,
    uStaticScale: 0,
    uStaticSpeed: 0,
    uSnap: 0,

    uGlitchRate: 0,
    uScanlineStrength: 0,
    uColorBleed: 0,

    uCurvature: 0,
    uVignette: 0,
    uMaskStrength: 0,

    uFlyback: 0,
    uConverge: 0,
    uBloom: 0,
    uBreath: 0,

    uRetrace: 0,
    uBeamWidth: 0,
    uChromaDrift: 0,
    uHum: 0,

    uThermalDrift: 0,
    uSpotNoise: 0,
    uMaskMode: 0,
    uBarrelConverge: 0,
  },
  vertexShader,
  fragmentShader
);

extend({ CrtStaticMaterial });

/* ---------------------------------------------
   React wrapper (drop-in)
----------------------------------------------*/

export default function CRTStaticMaterial({
  staticAmount = 0.35,
  staticScale = 700,
  staticSpeed = 9,
  snap = 24,

  glitchRate = 0.18,

  scanlineStrength = 0.55,
  colorBleed = 0.14,

  curvature = 0.12,
  vignette = 0.75,
  maskStrength = 0.35,

  flybackStrength = 0.35,
  convergenceDrift = 0.4,
  bloomStrength = 0.25,
  breathStrength = 0.35,

  retraceStrength = 0.35,
  beamWidth = 0.5,
  chromaDrift = 0.3,
  humStrength = 0.25,

  barrelConvergence = 0.6,
  spotNoise = 0.35,
  thermalDrift = 0.15,
  maskMode = 0,
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
      uStaticAmount={staticAmount}
      uStaticScale={staticScale}
      uStaticSpeed={staticSpeed}
      uSnap={snap}
      uGlitchRate={glitchRate}
      uScanlineStrength={scanlineStrength}
      uColorBleed={colorBleed}
      uCurvature={curvature}
      uVignette={vignette}
      uMaskStrength={maskStrength}
      uFlyback={flybackStrength}
      uConverge={convergenceDrift}
      uBloom={bloomStrength}
      uBreath={breathStrength}
      uRetrace={retraceStrength}
      uBeamWidth={beamWidth}
      uChromaDrift={chromaDrift}
      uHum={humStrength}
      uThermalDrift={thermalDrift}
      uSpotNoise={spotNoise}
      uMaskMode={maskMode}
      uBarrelConverge={barrelConvergence}
    />
  );
}
