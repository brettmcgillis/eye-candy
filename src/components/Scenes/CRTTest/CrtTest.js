import { folder, monitor, useControls } from 'leva';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';

/* ---------------------------------------------
   Shader
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

  /* -------- static field (MOVED EARLY) -------- */

  float t = floor(uTime * uStaticSpeed * uSnap) / uSnap;

  float staticField =
    hash(uv * uStaticScale + vec2(t, -t)) * 0.6 +
    hash(uv * uStaticScale * 1.7 + vec2(-t * 2.0, t)) * 0.4;

  /* thermal drift */
  float thermalTime = uTime * 0.02;
  vec2 thermalWarp = vec2(
    sin(thermalTime * 0.7 + uv.y * 2.0),
    cos(thermalTime * 0.5 + uv.x * 2.0)
  ) * 0.004 * uThermalDrift;

  uv += thermalWarp;

  /* low-frequency breathing */
  float breathe = sin(uTime * 0.35) * 0.003 * uBreath;
  uv += vec2(sin(uv.y * 3.0 + uTime * 0.4), cos(uv.x * 2.0 + uTime * 0.3)) * breathe;

  /* chroma phase drift */
  uv.x += sin(uTime * 0.12 + uv.y * 3.0) * 0.002 * uChromaDrift;

  /* flyback jitter */
  uv.y += sin(uTime * 40.0 + uv.y * 800.0) * 0.0015 * uFlyback;
  uv.y += sin(uTime * 3.0) * 0.002 * uFlyback;

  uv = curve(uv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  /* convergence drift */
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

  /* chromatic bleed */
  bars.r += hash(uv + uTime) * uColorBleed;
  bars.b -= hash(uv - uTime) * uColorBleed;

  /* analog shimmer */
  bars += hash(uv * 60.0 + uTime * 0.4) * 0.02;

  /* beam width */
  float luma = dot(bars, vec3(0.299,0.587,0.114));
  float beam =
    mix(900.0, 700.0, smoothstep(0.4,1.0,luma) * uBeamWidth);

  beam += staticField * 120.0 * uSpotNoise;

  /* scanlines */
  float scan = sin(uv.y * beam) * 0.05 * uScanlineStrength;
  bars -= scan;

  /* mask system */
  vec3 triad = vec3(
    sin(uv.x * 900.0),
    sin(uv.x * 900.0 + 2.1),
    sin(uv.x * 900.0 + 4.2)
  ) * 0.5 + 0.5;

  float grille = sin(uv.x * 1400.0) * 0.5 + 0.5;
  vec3 aperture = vec3(grille);

  vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
  bars *= mix(vec3(1.0), mask, uMaskStrength);

  /* bloom */
  bars += bars * smoothstep(0.65, 1.0, luma) * uBloom;

  /* retrace */
  float retrace = smoothstep(0.0, 0.04, abs(fract(uTime * 0.8) - uv.y));
  bars *= mix(1.0, 0.55, retrace * uRetrace);

  /* hum */
  float hum = sin((uv.y + uTime * 0.15) * 6.2831) * 0.04 * uHum;
  bars -= hum;

  /* vignette (FIXED) */
  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.75, uVignette, d);
  bars *= vig;

  /* spot noise */
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
   Shader (UNCHANGED)
----------------------------------------------*/
// vertexShader + fragmentShader unchanged

/* ---------------------------------------------
   Telemetry store
----------------------------------------------*/

const telemetry = {
  time: 0,
  glitch: 0,
  scan: 0,
  retrace: 0,
  hum: 0,
  chroma: 0,
  energy: 0,
};

/* ---------------------------------------------
   Component
----------------------------------------------*/

export default function CRTStaticMesh(props) {
  const meshRef = useRef();

  /* -----------------------------
     Main CRT controls
  ----------------------------- */

  const controls = useControls('CRT SMPTE RP-219', {
    staticAmount: { value: 0.35, min: 0, max: 1, step: 0.01 },
    staticScale: { value: 700, min: 50, max: 1400, step: 1 },
    staticSpeed: { value: 9, min: 0.1, max: 20, step: 0.1 },
    snap: { value: 24, min: 1, max: 60, step: 1 },

    glitchRate: { value: 0.18, min: 0, max: 1, step: 0.01 },

    scanlineStrength: { value: 0.55, min: 0, max: 1, step: 0.01 },
    colorBleed: { value: 0.14, min: 0, max: 0.5, step: 0.01 },

    curvature: { value: 0.12, min: 0, max: 0.4, step: 0.01 },
    vignette: { value: 0.75, min: 0.6, max: 0.98, step: 0.01 },
    maskStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },

    flybackStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
    convergenceDrift: { value: 0.4, min: 0, max: 1, step: 0.01 },
    bloomStrength: { value: 0.25, min: 0, max: 1, step: 0.01 },
    breathStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },

    retraceStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
    beamWidth: { value: 0.5, min: 0, max: 1, step: 0.01 },
    chromaDrift: { value: 0.3, min: 0, max: 1, step: 0.01 },
    humStrength: { value: 0.25, min: 0, max: 1, step: 0.01 },

    barrelConvergence: { value: 0.6, min: 0, max: 2, step: 0.01 },
    spotNoise: { value: 0.35, min: 0, max: 1, step: 0.01 },
    thermalDrift: { value: 0.15, min: 0, max: 1, step: 0.01 },
    maskMode: { value: 0, options: { shadow: 0, grille: 1 } },
  });

  /* -----------------------------
     CRT Telemetry panel
  ----------------------------- */

  useControls('CRT Telemetry', {
    signals: folder(
      {
        glitch: monitor(
          () => telemetry.glitch,
          { graph: true, interval: 30 },
          { graph: true }
        ),
        scanlines: monitor(() => telemetry.scan, { graph: true, interval: 30 }),
        retrace: monitor(() => telemetry.retrace, {
          graph: true,
          interval: 30,
        }),
        hum: monitor(() => telemetry.hum, { graph: true, interval: 30 }),
        chroma: monitor(() => telemetry.chroma, { graph: true, interval: 30 }),
        energy: monitor(() => telemetry.energy, { graph: true, interval: 30 }),
      },
      { color: 'cyan' }
    ),
  });

  /* -----------------------------
     Material
  ----------------------------- */

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },

        uStaticAmount: { value: controls.staticAmount },
        uStaticScale: { value: controls.staticScale },
        uStaticSpeed: { value: controls.staticSpeed },
        uSnap: { value: controls.snap },

        uGlitchRate: { value: controls.glitchRate },
        uScanlineStrength: { value: controls.scanlineStrength },
        uColorBleed: { value: controls.colorBleed },

        uCurvature: { value: controls.curvature },
        uVignette: { value: controls.vignette },
        uMaskStrength: { value: controls.maskStrength },

        uFlyback: { value: controls.flybackStrength },
        uConverge: { value: controls.convergenceDrift },
        uBloom: { value: controls.bloomStrength },
        uBreath: { value: controls.breathStrength },

        uRetrace: { value: controls.retraceStrength },
        uBeamWidth: { value: controls.beamWidth },
        uChromaDrift: { value: controls.chromaDrift },
        uHum: { value: controls.humStrength },

        uThermalDrift: { value: controls.thermalDrift },
        uSpotNoise: { value: controls.spotNoise },
        uMaskMode: { value: controls.maskMode },
        uBarrelConverge: { value: controls.barrelConvergence },
      },
    });
  }, []);

  /* -----------------------------
     Frame loop + telemetry feed
  ----------------------------- */

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const u = meshRef.current.material.uniforms;

    u.uTime.value += delta;
    telemetry.time = u.uTime.value;

    const t = telemetry.time;

    telemetry.glitch = Math.sin(t * 10.0) * controls.glitchRate;
    telemetry.scan = Math.sin(t * 60.0) * controls.scanlineStrength;
    telemetry.retrace = Math.abs(Math.sin(t * 0.8)) * controls.retraceStrength;
    telemetry.hum = Math.sin(t * 3.77) * controls.humStrength;
    telemetry.chroma = Math.sin(t * 0.12) * controls.chromaDrift;

    telemetry.energy =
      (Math.abs(telemetry.glitch) +
        Math.abs(telemetry.scan) +
        Math.abs(telemetry.retrace) +
        Math.abs(telemetry.hum)) *
      0.25;

    u.uStaticAmount.value = controls.staticAmount;
    u.uStaticScale.value = controls.staticScale;
    u.uStaticSpeed.value = controls.staticSpeed;
    u.uSnap.value = controls.snap;

    u.uGlitchRate.value = controls.glitchRate;
    u.uScanlineStrength.value = controls.scanlineStrength;
    u.uColorBleed.value = controls.colorBleed;

    u.uCurvature.value = controls.curvature;
    u.uVignette.value = controls.vignette;
    u.uMaskStrength.value = controls.maskStrength;

    u.uFlyback.value = controls.flybackStrength;
    u.uConverge.value = controls.convergenceDrift;
    u.uBloom.value = controls.bloomStrength;
    u.uBreath.value = controls.breathStrength;

    u.uRetrace.value = controls.retraceStrength;
    u.uBeamWidth.value = controls.beamWidth;
    u.uChromaDrift.value = controls.chromaDrift;
    u.uHum.value = controls.humStrength;

    u.uThermalDrift.value = controls.thermalDrift;
    u.uSpotNoise.value = controls.spotNoise;
    u.uMaskMode.value = controls.maskMode;
    u.uBarrelConverge.value = controls.barrelConvergence;
  });

  return (
    <mesh ref={meshRef} material={material} {...props}>
      <planeGeometry args={[4, 3]} />
    </mesh>
  );
}
