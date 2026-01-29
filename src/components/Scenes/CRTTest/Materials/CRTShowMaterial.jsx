/* eslint-disable consistent-return */
import * as THREE from 'three';

import React, { useEffect, useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

import { videoFile } from '../../../../utils/appUtils';

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
uniform sampler2D uTexture;

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

uniform float uRetrace;
uniform float uBeamWidth;
uniform float uChromaDrift;
uniform float uHum;

uniform float uThermalDrift;
uniform float uSpotNoise;
uniform float uMaskMode;
uniform float uBarrelConverge;

uniform float uPadX;
uniform float uPadY;

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

/* ----------------- Main ----------------- */

void main() {

  vec2 uv = vUv;

  uv = (uv - 0.5) * vec2(1.0 - uPadX, 1.0 - uPadY) + 0.5;

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

  vec3 col = texture2D(uTexture, uv).rgb;
  vec3 rCol = texture2D(uTexture, rUV).rgb;
  vec3 bCol = texture2D(uTexture, bUV).rgb;

  col.r = rCol.r;
  col.b = bCol.b;

  col.r += hash(uv + uTime) * uColorBleed;
  col.b -= hash(uv - uTime) * uColorBleed;

  float luma = dot(col, vec3(0.299,0.587,0.114));
  float beam = mix(900.0, 700.0, smoothstep(0.4,1.0,luma) * uBeamWidth);
  beam += staticField * 120.0 * uSpotNoise;

  float scan = sin(uv.y * beam) * 0.05 * uScanlineStrength;
  col -= scan;

  vec3 triad = vec3(
    sin(uv.x * 900.0),
    sin(uv.x * 900.0 + 2.1),
    sin(uv.x * 900.0 + 4.2)
  ) * 0.5 + 0.5;

  float grille = sin(uv.x * 1400.0) * 0.5 + 0.5;
  vec3 aperture = vec3(grille);

  vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
  col *= mix(vec3(1.0), mask, uMaskStrength);

  col += col * smoothstep(0.65, 1.0, luma) * uBloom;

  float retrace = smoothstep(0.0, 0.04, abs(fract(uTime * 0.8) - uv.y));
  col *= mix(1.0, 0.55, retrace * uRetrace);

  float hum = sin((uv.y + uTime * 0.15) * 6.2831) * 0.04 * uHum;
  col -= hum;

  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.75, uVignette, d);
  col *= vig;

  vec3 staticColor = vec3(staticField);
  float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime * 10.0), 0.0)));
  vec3 finalColor = mix(col, staticColor, glitch * uStaticAmount);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

/* ---------------------------------------------
   Drei material
----------------------------------------------*/

const CrtShowMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,

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

    uPadX: 0.0,
    uPadY: 0.0,
  },
  vertexShader,
  fragmentShader
);

extend({ CrtShowMaterial });

/* ---------------------------------------------
   React wrapper (drop-in)
----------------------------------------------*/

export default function CRTShowMaterial({
  src = videoFile(`ren_and_stimpy.mp4`),
  useWebcam = false,

  padX = 0.06,
  padY = 0.08,

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

  useEffect(() => {
    if (!ref.current) return;

    let stream = null;
    let disposed = false;

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true; // critical for iOS
    video.autoplay = true;

    const startVideoTexture = () => {
      if (disposed) return;

      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;

      ref.current.uTexture = tex;
    };

    const startFallbackVideo = async () => {
      try {
        video.src = src;
        await video.play();
        startVideoTexture();
      } catch (e) {
        console.error('[CRTShowMaterial] Video failed to play:', e);
      }
    };

    const startWebcam = async () => {
      try {
        const nav = navigator;

        const getUserMedia =
          nav.mediaDevices?.getUserMedia ||
          nav.getUserMedia ||
          nav.webkitGetUserMedia ||
          nav.mozGetUserMedia;

        if (!getUserMedia) {
          throw new Error('getUserMedia not supported on this device');
        }

        if (nav.mediaDevices?.getUserMedia) {
          stream = await nav.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } else {
          // Legacy mobile fallback
          stream = await new Promise((resolve, reject) => {
            getUserMedia.call(
              nav,
              { video: true, audio: false },
              resolve,
              reject
            );
          });
        }

        video.srcObject = stream;

        await video.play();
        startVideoTexture();
      } catch (err) {
        console.warn(
          '[CRTShowMaterial] Webcam failed, falling back to video:',
          err
        );
        startFallbackVideo();
      }
    };

    if (useWebcam) {
      startWebcam();
    } else {
      startFallbackVideo();
    }

    return () => {
      disposed = true;

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      if (ref.current?.uTexture) {
        ref.current.uTexture.dispose();
      }

      video.pause();
      video.remove();
    };
  }, [src, useWebcam]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.uTime += delta;
  });

  return (
    <crtShowMaterial
      ref={ref}
      key={CrtShowMaterial.key}
      toneMapped={false}
      uPadX={padX}
      uPadY={padY}
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
