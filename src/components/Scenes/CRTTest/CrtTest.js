import { useControls } from 'leva';
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
  vec2 uv = curve(vUv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec3 bars;

  if (uv.y > 0.38) bars = topBars(uv.x);
  else if (uv.y > 0.30) bars = midBars(uv.x);
  else bars = bottomBars(uv.x);

  /* chromatic bleed */
  bars.r += hash(uv + uTime) * uColorBleed;
  bars.b -= hash(uv - uTime) * uColorBleed;

  /* analog shimmer */
  bars += hash(uv * 60.0 + uTime * 0.4) * 0.02;

  /* scanlines */
  float scan = sin(uv.y * 900.0) * 0.05 * uScanlineStrength;
  bars -= scan;

  /* shadow mask */
  vec3 triad = vec3(
    sin(uv.x * 900.0),
    sin(uv.x * 900.0 + 2.1),
    sin(uv.x * 900.0 + 4.2)
  ) * 0.5 + 0.5;

  bars *= mix(vec3(1.0), triad, uMaskStrength);

  /* vignette (fixed) */
  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(uVignette, 0.75, d);
  bars *= vig;

  /* -------- static -------- */

  float t = floor(uTime * uStaticSpeed * uSnap) / uSnap;

  float staticField =
    hash(uv * uStaticScale + vec2(t, -t)) * 0.6 +
    hash(uv * uStaticScale * 1.7 + vec2(-t * 2.0, t)) * 0.4;

  vec3 staticColor = vec3(staticField);

  float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime * 10.0), 0.0)));

  vec3 finalColor = mix(bars, staticColor, glitch * uStaticAmount);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

/* ---------------------------------------------
   Component
----------------------------------------------*/

export default function CRTStaticMesh(props) {
  const meshRef = useRef();

  const controls = useControls('CRT SMPTE RP-219', {
    staticAmount: { value: 0.35, min: 0, max: 1, step: 0.01 },
    staticScale: { value: 700, min: 50, max: 1400, step: 1 },
    staticSpeed: { value: 9, min: 0.1, max: 20, step: 0.1 },
    snap: { value: 24, min: 1, max: 60, step: 1 },

    glitchRate: { value: 0.18, min: 0, max: 1, step: 0.01 },

    scanlineStrength: { value: 0.55, min: 0, max: 1, step: 0.01 },
    colorBleed: { value: 0.14, min: 0, max: 0.5, step: 0.01 },

    curvature: { value: 0.12, min: 0, max: 0.4, step: 0.01 },
    vignette: { value: 0.88, min: 0.6, max: 0.98, step: 0.01 },
    maskStrength: { value: 0.35, min: 0, max: 1, step: 0.01 },
  });

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
      },
    });
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const u = meshRef.current.material.uniforms;

    u.uTime.value += delta;

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
  });

  return (
    <mesh ref={meshRef} material={material} {...props}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
