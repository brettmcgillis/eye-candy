**New Context**

I have a collection of shaders that generally do the same thing, show something, and apply crt style glitch effects and processing. They can be generalized as follows:

CRTStaticMaterial - show nothing, just tv static & effects
CRTSmtpeMaterial - show SMTPE bars, add tv static & effects
CRTBlueScreenMaterial - show single color background and text, add tv static & effects
CRTShowMaterial - show video (mp4 or webcam), add tv static & effects
CRTSceneMaterial - show a threejs scene/component, add tv static & effects
CRTSceneInSceneMaterial - show the default camera's view of the scene, add tv static & effects.

I would like to refactor them to use common tv static and effects logic, so that I might power tv and effects logic for all materials with a single set of controls. I understand that the nuances mean the certain materials will need additional specialized props and thats fine. I recently heard about TSL as well and it sounds like it might be a good option for creating reusable shader logic. If this is too cumbersome Im happy to have duplicated logic in each file, im more concerned with my ability to control the shaders than my ability to reduce duplication. Im also happy to leave the existing files as they are and start build version 2 of them all, I just need insight into how to do it the easiest way to get me back and bootstrapped.

// CRTStaticMaterial.js
import React, { useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/_ ---------------------------------------------
Shaders
----------------------------------------------_/

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform float uTime;

/_ snow controls _/
uniform float uSnowAmount;
uniform float uSnowScale;
uniform float uSnowSpeed;
uniform float uSnowSize;
uniform float uSnap;

/_ band + RF controls _/
uniform float uBandStrength;
uniform float uBandSpeed;
uniform float uBandScale;

uniform float uRFStrength;
uniform float uRFScale;
uniform float uRFSpeed;

uniform float uCurvature;
uniform float uVignette;

varying vec2 vUv;

/_ ----------------- Noise utils ----------------- _/

vec2 hash2(vec2 p) {
p = vec2(dot(p, vec2(127.1,311.7)),
dot(p, vec2(269.5,183.3)));
return -1.0 + 2.0 _ fract(sin(p) _ 43758.5453123);
}

float perlin(vec2 p) {
vec2 i = floor(p);
vec2 f = fract(p);

vec2 u = f*f*(3.0-2.0\*f);

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
v += a _ perlin(p);
p _= 2.0;
a \*= 0.5;
}
return v;
}

/_ ----------------- CRT warp ----------------- _/

vec2 curve(vec2 uv, float k) {
uv = uv _ 2.0 - 1.0;
uv _= 1.0 + k _ pow(abs(uv.yx), vec2(2.0));
return uv _ 0.5 + 0.5;
}

/_ ----------------- Main ----------------- _/

void main() {

vec2 uv = curve(vUv, uCurvature);

if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
gl_FragColor = vec4(0.0);
return;
}

float t = floor(uTime _ uSnowSpeed _ uSnap) / uSnap;

/_ ----------------- pixelated snow UVs ----------------- _/

vec2 pixelUV = floor(uv \* uSnowSize) / uSnowSize;

/_ ----------------- perlin snow field ----------------- _/

float snowField = fbm(pixelUV _ uSnowScale + vec2(t _ 1.2, -t _ 0.7));
snowField = snowField _ 0.5 + 0.5;

float snow = step(0.5, snowField);
snow = mix(snowField, snow, 0.65);

/_ ----------------- rolling static bands ----------------- _/

float band =
sin(uv.y _ uBandScale + uTime _ uBandSpeed) \* 0.5 + 0.5;

float bandNoise = fbm(vec2(uv.y _ 4.0, uTime _ 0.15));
band \*= bandNoise;

snow += band \* uBandStrength;

/_ ----------------- RF interference streaks ----------------- _/

float rf = fbm(vec2(uv.y _ uRFScale, uTime _ uRFSpeed));
rf = smoothstep(0.4, 0.75, rf);
rf _= sin((uv.y + uTime _ 0.15) _ 80.0) _ 0.5 + 0.5;

snow += rf \* uRFStrength;

/_ ----------------- tone shaping ----------------- _/

snow = clamp(snow, 0.0, 1.0);

vec3 color = vec3(snow);

/_ vignette _/
float d = distance(uv, vec2(0.5));
float vig = 1.0 - smoothstep(0.75, uVignette, d);
color \*= vig;

/_ global mix _/
color = mix(vec3(0.0), color, uSnowAmount);

gl_FragColor = vec4(color, 1.0);
}
`;

/_ ---------------------------------------------
Drei material class
----------------------------------------------_/

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

useFrame((\_, delta) => {
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

// CrtSmtpeStaticMaterial.js
import React, { useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/_ ---------------------------------------------
Shaders
----------------------------------------------_/

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

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

/_ --- next tier --- _/
uniform float uRetrace;
uniform float uBeamWidth;
uniform float uChromaDrift;
uniform float uHum;

uniform float uThermalDrift;
uniform float uSpotNoise;
uniform float uMaskMode;
uniform float uBarrelConverge;

varying vec2 vUv;

/_ ----------------- Utils ----------------- _/

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1,311.7))) \* 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
uv = uv _ 2.0 - 1.0;
uv _= 1.0 + k _ pow(abs(uv.yx), vec2(2.0));
return uv _ 0.5 + 0.5;
}

/_ ----------------- Colors ----------------- _/

vec3 WHITE = vec3(1.0);
vec3 YELLOW = vec3(1.0,1.0,0.0);
vec3 CYAN = vec3(0.0,1.0,1.0);
vec3 GREEN = vec3(0.0,1.0,0.0);
vec3 MAGENTA = vec3(1.0,0.0,1.0);
vec3 RED = vec3(1.0,0.0,0.0);
vec3 BLUE = vec3(0.0,0.0,1.0);
vec3 BLACK = vec3(0.0);
vec3 GRAY = vec3(0.4);
vec3 NAVY = vec3(0.0,0.0,0.4);

/_ ----------------- RP-219 Layout ----------------- _/

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

/_ ----------------- Main ----------------- _/

void main() {

vec2 uv = vUv;

float t = floor(uTime _ uStaticSpeed _ uSnap) / uSnap;

float staticField =
hash(uv _ uStaticScale + vec2(t, -t)) _ 0.6 +
hash(uv _ uStaticScale _ 1.7 + vec2(-t _ 2.0, t)) _ 0.4;

float thermalTime = uTime _ 0.02;
vec2 thermalWarp = vec2(
sin(thermalTime _ 0.7 + uv.y _ 2.0),
cos(thermalTime _ 0.5 + uv.x _ 2.0)
) _ 0.004 \* uThermalDrift;

uv += thermalWarp;

float breathe = sin(uTime _ 0.35) _ 0.003 _ uBreath;
uv += vec2(sin(uv.y _ 3.0 + uTime _ 0.4), cos(uv.x _ 2.0 + uTime _ 0.3)) _ breathe;

uv.x += sin(uTime _ 0.12 + uv.y _ 3.0) _ 0.002 _ uChromaDrift;

uv.y += sin(uTime _ 40.0 + uv.y _ 800.0) _ 0.0015 _ uFlyback;
uv.y += sin(uTime _ 3.0) _ 0.002 \* uFlyback;

uv = curve(uv, uCurvature);

if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
gl_FragColor = vec4(0.0);
return;
}

vec2 centered = uv \* 2.0 - 1.0;
float barrel = dot(centered, centered);

float drift =
sin(uTime _ 0.6) _
0.002 _
uConverge _
mix(0.3, 1.5, barrel \* uBarrelConverge);

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

bars.r += hash(uv + uTime) _ uColorBleed;
bars.b -= hash(uv - uTime) _ uColorBleed;

bars += hash(uv _ 60.0 + uTime _ 0.4) \* 0.02;

float luma = dot(bars, vec3(0.299,0.587,0.114));
float beam = mix(900.0, 700.0, smoothstep(0.4,1.0,luma) _ uBeamWidth);
beam += staticField _ 120.0 \* uSpotNoise;

float scan = sin(uv.y _ beam) _ 0.05 \* uScanlineStrength;
bars -= scan;

vec3 triad = vec3(
sin(uv.x _ 900.0),
sin(uv.x _ 900.0 + 2.1),
sin(uv.x _ 900.0 + 4.2)
) _ 0.5 + 0.5;

float grille = sin(uv.x _ 1400.0) _ 0.5 + 0.5;
vec3 aperture = vec3(grille);

vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
bars \*= mix(vec3(1.0), mask, uMaskStrength);

bars += bars _ smoothstep(0.65, 1.0, luma) _ uBloom;

float retrace = smoothstep(0.0, 0.04, abs(fract(uTime _ 0.8) - uv.y));
bars _= mix(1.0, 0.55, retrace \* uRetrace);

float hum = sin((uv.y + uTime _ 0.15) _ 6.2831) _ 0.04 _ uHum;
bars -= hum;

float d = distance(uv, vec2(0.5));
float vig = 1.0 - smoothstep(0.75, uVignette, d);
bars \*= vig;

float spot =
hash(uv _ uStaticScale _ 0.8 + uTime) _
staticField _
0.15 \*
uSpotNoise;

bars += spot;

vec3 staticColor = vec3(staticField);
float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime _ 10.0), 0.0)));
vec3 finalColor = mix(bars, staticColor, glitch _ uStaticAmount);

gl_FragColor = vec4(finalColor, 1.0);
}
`;

/_ ---------------------------------------------
Drei material class
----------------------------------------------_/

const CrtSmtpeStaticMaterial = shaderMaterial(
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

extend({ CrtSmtpeStaticMaterial });

/_ ---------------------------------------------
React wrapper (drop-in)
----------------------------------------------_/

export default function CRTSmtpeStaticMaterial({
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

useFrame((\_, delta) => {
if (ref.current) ref.current.uTime += delta;
});

return (
<crtSmtpeStaticMaterial
      ref={ref}
      key={CrtSmtpeStaticMaterial.key}
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

/_ eslint-disable consistent-return _/
import React, { useEffect, useRef } from 'react';
import \* as THREE from 'three';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/_ ---------------------------------------------
Shaders
----------------------------------------------_/

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

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

/_ ----------------- Utils ----------------- _/

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1,311.7))) \* 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
uv = uv _ 2.0 - 1.0;
uv _= 1.0 + k _ pow(abs(uv.yx), vec2(2.0));
return uv _ 0.5 + 0.5;
}

/_ ----------------- Main ----------------- _/

void main() {

vec2 uv = vUv;

uv = (uv - 0.5) \* vec2(1.0 - uPadX, 1.0 - uPadY) + 0.5;

float t = floor(uTime _ uStaticSpeed _ uSnap) / uSnap;

float staticField =
hash(uv _ uStaticScale + vec2(t, -t)) _ 0.6 +
hash(uv _ uStaticScale _ 1.7 + vec2(-t _ 2.0, t)) _ 0.4;

float thermalTime = uTime _ 0.02;
vec2 thermalWarp = vec2(
sin(thermalTime _ 0.7 + uv.y _ 2.0),
cos(thermalTime _ 0.5 + uv.x _ 2.0)
) _ 0.004 \* uThermalDrift;

uv += thermalWarp;

float breathe = sin(uTime _ 0.35) _ 0.003 _ uBreath;
uv += vec2(sin(uv.y _ 3.0 + uTime _ 0.4), cos(uv.x _ 2.0 + uTime _ 0.3)) _ breathe;

uv.x += sin(uTime _ 0.12 + uv.y _ 3.0) _ 0.002 _ uChromaDrift;
uv.y += sin(uTime _ 40.0 + uv.y _ 800.0) _ 0.0015 _ uFlyback;
uv.y += sin(uTime _ 3.0) _ 0.002 \* uFlyback;

uv = curve(uv, uCurvature);

if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
gl_FragColor = vec4(0.0);
return;
}

vec2 centered = uv \* 2.0 - 1.0;
float barrel = dot(centered, centered);

float drift =
sin(uTime _ 0.6) _
0.002 _
uConverge _
mix(0.3, 1.5, barrel \* uBarrelConverge);

vec2 rUV = uv + vec2(drift, 0.0);
vec2 bUV = uv - vec2(drift, 0.0);

vec3 col = texture2D(uTexture, uv).rgb;
vec3 rCol = texture2D(uTexture, rUV).rgb;
vec3 bCol = texture2D(uTexture, bUV).rgb;

col.r = rCol.r;
col.b = bCol.b;

col.r += hash(uv + uTime) _ uColorBleed;
col.b -= hash(uv - uTime) _ uColorBleed;

float luma = dot(col, vec3(0.299,0.587,0.114));
float beam = mix(900.0, 700.0, smoothstep(0.4,1.0,luma) _ uBeamWidth);
beam += staticField _ 120.0 \* uSpotNoise;

float scan = sin(uv.y _ beam) _ 0.05 \* uScanlineStrength;
col -= scan;

vec3 triad = vec3(
sin(uv.x _ 900.0),
sin(uv.x _ 900.0 + 2.1),
sin(uv.x _ 900.0 + 4.2)
) _ 0.5 + 0.5;

float grille = sin(uv.x _ 1400.0) _ 0.5 + 0.5;
vec3 aperture = vec3(grille);

vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
col \*= mix(vec3(1.0), mask, uMaskStrength);

col += col _ smoothstep(0.65, 1.0, luma) _ uBloom;

float retrace = smoothstep(0.0, 0.04, abs(fract(uTime _ 0.8) - uv.y));
col _= mix(1.0, 0.55, retrace \* uRetrace);

float hum = sin((uv.y + uTime _ 0.15) _ 6.2831) _ 0.04 _ uHum;
col -= hum;

float d = distance(uv, vec2(0.5));
float vig = 1.0 - smoothstep(0.75, uVignette, d);
col \*= vig;

vec3 staticColor = vec3(staticField);
float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime _ 10.0), 0.0)));
vec3 finalColor = mix(col, staticColor, glitch _ uStaticAmount);

gl_FragColor = vec4(finalColor, 1.0);
}
`;

/_ ---------------------------------------------
Drei material
----------------------------------------------_/

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

/_ ---------------------------------------------
React wrapper (drop-in)
----------------------------------------------_/

export default function CRTShowMaterial({
src = `/videos/ren_and_stimpy.mp4`,
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

useFrame((\_, delta) => {
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

import React, { useRef } from 'react';

import { RenderTexture, shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/_ ---------------------------------------------
Shaders
----------------------------------------------_/

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform sampler2D uMap;
uniform float uTime;

uniform float uStaticAmount;
uniform float uStaticScale;
uniform float uStaticSpeed;

uniform float uScanlineStrength;
uniform float uCurvature;
uniform float uVignette;
uniform float uChromaDrift;
uniform float uBloom;

varying vec2 vUv;

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1,311.7))) \* 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
uv = uv _ 2.0 - 1.0;
uv _= 1.0 + k _ pow(abs(uv.yx), vec2(2.0));
return uv _ 0.5 + 0.5;
}

void main() {
vec2 uv = curve(vUv, uCurvature);

if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
gl_FragColor = vec4(0.0);
return;
}

float drift = sin(uTime _ 0.6 + uv.y _ 4.0) _ 0.002 _ uChromaDrift;

vec3 col;
col.r = texture2D(uMap, uv + vec2(drift, 0.0)).r;
col.g = texture2D(uMap, uv).g;
col.b = texture2D(uMap, uv - vec2(drift, 0.0)).b;

float t = floor(uTime _ uStaticSpeed);
float noise =
hash(uv _ uStaticScale + t) _ 0.6 +
hash(uv _ uStaticScale _ 1.7 - t) _ 0.4;

col = mix(col, vec3(noise), uStaticAmount);

float scan = sin(uv.y _ 900.0) _ 0.04 \* uScanlineStrength;
col -= scan;

float luma = dot(col, vec3(0.299,0.587,0.114));
col += col _ smoothstep(0.6, 1.0, luma) _ uBloom;

float d = distance(uv, vec2(0.5));
col \*= 1.0 - smoothstep(0.6, uVignette, d);

gl_FragColor = vec4(col, 1.0);
}
`;

const CrtSceneShaderMaterial = shaderMaterial(
{
uMap: null,
uTime: 0,

    uStaticAmount: 0.1,
    uStaticScale: 600,
    uStaticSpeed: 6,

    uScanlineStrength: 0.4,
    uCurvature: 0.12,
    uVignette: 0.85,
    uChromaDrift: 0.25,
    uBloom: 0.25,

},
vertexShader,
fragmentShader
);

extend({ CrtSceneShaderMaterial });

/_ ---------------------------------------------
Drop-in material
----------------------------------------------_/

export default function CRTSceneMaterial({
scene,
resolution = 1024,

staticAmount = 0.12,
staticScale = 600,
staticSpeed = 6,

scanlineStrength = 0.4,
curvature = 0.12,
vignette = 0.85,
chromaDrift = 0.25,
bloom = 0.25,
}) {
const mat = useRef();

useFrame((\_, dt) => {
if (mat.current) mat.current.uTime += dt;
});

return (
<crtSceneShaderMaterial
      ref={mat}
      uStaticAmount={staticAmount}
      uStaticScale={staticScale}
      uStaticSpeed={staticSpeed}
      uScanlineStrength={scanlineStrength}
      uCurvature={curvature}
      uVignette={vignette}
      uChromaDrift={chromaDrift}
      uBloom={bloom}
      toneMapped={false}
    >
{/_ 👇 this is the critical change _/}
<RenderTexture
        attach="uMap"
        frames={Infinity}
        width={resolution}
        height={resolution}
        anisotropy={8}
      >
{scene}
</RenderTexture>
</crtSceneShaderMaterial>
);
}

/_ eslint-disable no-unused-vars _/
import React, { useMemo, useRef } from 'react';
import \* as THREE from 'three';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';

/_ ---------------- shaders ---------------- _/

const vertexShader = `varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

const fragmentShader = `
uniform sampler2D uScene;
uniform sampler2D uFeedback;
uniform float uTime;

uniform float uDecay;
uniform float uZoom;
uniform float uWarp;

uniform float uStaticAmount;
uniform float uScanlineStrength;
uniform float uCurvature;
uniform float uVignette;

varying vec2 vUv;

float hash(vec2 p){
return fract(sin(dot(p,vec2(127.1,311.7))) \* 43758.5453123);
}

vec2 curve(vec2 uv,float k){
uv = uv*2.0-1.0;
uv *= 1.0 + k * pow(abs(uv.yx),vec2(2.0));
return uv*0.5+0.5;
}

void main(){
vec2 uv = vUv;

// warp feedback inward (recursion illusion)
vec2 fUV = (uv - 0.5) / uZoom + 0.5;
fUV += sin(vec2(uv.y, uv.x) * 6.0 + uTime*0.4) _ 0.003 _ uWarp;
fUV = curve(fUV, uCurvature);

vec3 sceneCol = texture2D(uScene, uv).rgb;
vec3 feedbackCol = texture2D(uFeedback, fUV).rgb;

vec3 col = mix(sceneCol, feedbackCol, uDecay);

col -= sin(uv.y*900.0)*0.04*uScanlineStrength;
col = mix(col, vec3(hash(uv*600.0+uTime)), uStaticAmount);

float d = distance(uv,vec2(0.5));
col \*= 1.0-smoothstep(0.6,uVignette,d);

gl_FragColor = vec4(col,1.0);
}
`;

const CrtAccumMaterial = shaderMaterial(
{
uScene: null,
uFeedback: null,
uTime: 0,
uDecay: 0.85,
uZoom: 1.01,
uWarp: 0.6,
uStaticAmount: 0.04,
uScanlineStrength: 0.4,
uCurvature: 0.12,
uVignette: 0.85,
},
vertexShader,
fragmentShader
);

extend({ CrtAccumMaterial });

/_ ---------------- material ---------------- _/

export default function CRTSceneInSceneMaterial({
resolution = 1024,

decay = 0.85,
zoom = 1.01,
warp = 0.6,

staticAmount = 0.04,
scanlineStrength = 0.4,
curvature = 0.12,
vignette = 0.85,
}) {
const mat = useRef();
const { gl, scene, camera } = useThree();

const sceneRT = useMemo(
() => new THREE.WebGLRenderTarget(resolution, resolution),
[resolution]
);
const fbA = useMemo(
() => new THREE.WebGLRenderTarget(resolution, resolution),
[resolution]
);
const fbB = useMemo(
() => new THREE.WebGLRenderTarget(resolution, resolution),
[resolution]
);

const swap = useRef(false);

useFrame((\_, dt) => {
if (!mat.current) return;
mat.current.uTime += dt;

    const prev = gl.getRenderTarget();

    // 1. render world once
    gl.setRenderTarget(sceneRT);
    gl.clear();
    gl.render(scene, camera);

    // 2. feedback pass (GPU cheap)
    const read = swap.current ? fbA : fbB;
    const write = swap.current ? fbB : fbA;

    mat.current.uScene = sceneRT.texture;
    mat.current.uFeedback = read.texture;

    gl.setRenderTarget(write);
    gl.clear();
    gl.render(scene, camera); // screen draws feedback into itself

    gl.setRenderTarget(prev);
    swap.current = !swap.current;

    // 3. display accumulated result
    mat.current.uFeedback = write.texture;

});

return (
<crtAccumMaterial
      ref={mat}
      uDecay={decay}
      uZoom={zoom}
      uWarp={warp}
      uStaticAmount={staticAmount}
      uScanlineStrength={scanlineStrength}
      uCurvature={curvature}
      uVignette={vignette}
      toneMapped={false}
    />
);
}
// CrtBlueScreenMaterial.js
import React, { useEffect, useMemo, useRef } from 'react';
import \* as THREE from 'three';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/_ ---------------------------------------------
Shaders
---------------------------------------------- _/

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform float uTime;
uniform sampler2D uTextTexture;

uniform vec3 uScreenColor;
uniform float uNoiseStrength;
uniform float uGlowStrength;
uniform float uCurvature;
uniform float uVignette;

uniform float uScanlineStrength;
uniform float uScanlineDensity;
uniform float uRollSpeed;
uniform float uRollStrength;

uniform float uChromaOffset;

varying vec2 vUv;

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1,311.7))) \* 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
uv = uv _ 2.0 - 1.0;
uv _= 1.0 + k _ pow(abs(uv.yx), vec2(2.0));
return uv _ 0.5 + 0.5;
}

void main() {

vec2 uv = curve(vUv, uCurvature);

if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
gl_FragColor = vec4(0.0);
return;
}

float roll = sin(uv.y _ 8.0 + uTime _ uRollSpeed) _ 0.003 _ uRollStrength;
uv.y = fract(uv.y + roll + uTime _ 0.02 _ uRollStrength);

vec3 color = uScreenColor;

float n = hash(uv _ 800.0 + uTime _ 60.0);
color += (n - 0.5) \* uNoiseStrength;

float scan = sin(uv.y _ uScanlineDensity);
color -= scan _ uScanlineStrength;

float off = uChromaOffset;
vec4 tr = texture2D(uTextTexture, uv + vec2(off, 0.0));
vec4 tg = texture2D(uTextTexture, uv);
vec4 tb = texture2D(uTextTexture, uv - vec2(off, 0.0));

vec3 textRGB = vec3(tr.r, tg.g, tb.b);
float textA = max(tr.a, max(tg.a, tb.a));

color = mix(color, textRGB, textA);
color += textRGB _ uGlowStrength _ textA;

float d = distance(uv, vec2(0.5));
float vig = smoothstep(uVignette, 0.45, d);
color \*= mix(1.0, vig, 0.6);

gl_FragColor = vec4(clamp(color, 0.0, 1.5), 1.0);
}
`;

const CrtBlueScreenMaterial = shaderMaterial(
{
uTime: 0,
uTextTexture: null,

    uScreenColor: new THREE.Color(0.05, 0.18, 0.85),
    uNoiseStrength: 0.08,
    uGlowStrength: 0.35,
    uCurvature: 0.06,
    uVignette: 0.85,

    uScanlineStrength: 0.08,
    uScanlineDensity: 900,
    uRollSpeed: 0.4,
    uRollStrength: 0.4,

    uChromaOffset: 0.0025,

},
vertexShader,
fragmentShader
);

extend({ CrtBlueScreenMaterial });

/_ ---------------------------------------------
Canvas helpers
---------------------------------------------- _/

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
const chars = text.split('');
let line = '';
const lines = [];

chars.forEach((char) => {
if (char === '\n') {
lines.push(line);
line = '';
} else {
const test = line + char;
if (ctx.measureText(test).width > maxWidth && line) {
lines.push(line);
line = char;
} else {
line = test;
}
}
});

if (line) lines.push(line);

lines.forEach((l, i) => {
ctx.fillText(l, x, y + i \* lineHeight);
});

return { lines, y: y + (lines.length - 1) \* lineHeight };
}
function drawTextToCanvas({
canvas,
text,
font,
fontSize,
fontColor,
showCaret,
caretMode,
horizontalPadding,
verticalPadding,
}) {
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, canvas.width, canvas.height);

ctx.font = font;
ctx.fillStyle = fontColor;
ctx.textBaseline = 'top';

const lineHeight = fontSize _ 1.3;
const maxWidth = canvas.width - horizontalPadding _ 2;

const { lines, y } = wrapText(
ctx,
text,
horizontalPadding,
verticalPadding,
maxWidth,
lineHeight
);

if (showCaret && lines.length) {
const lastLine = lines[lines.length - 1];
const metrics = ctx.measureText(lastLine);

    const x = horizontalPadding + metrics.width + 4;
    const h =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent ||
      fontSize;

    if (caretMode === 'underscore') {
      // underscore caret  _
      ctx.fillRect(x, y + fontSize * 1.05, fontSize * 0.8, 3);
    } else if (caretMode === 'line') {
      // thin insertion bar  |
      ctx.fillRect(x, y + 2, Math.max(4, fontSize * 0.08), h);
    } else {
      // block caret █ (default)
      ctx.fillRect(x, y + 2, fontSize * 0.6, h);
    }

}
}

function createTextTexture() {
const canvas = document.createElement('canvas');
canvas.width = 1024;
canvas.height = 512;

const texture = new THREE.CanvasTexture(canvas);
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;

return { canvas, texture };
}

/_ ---------------------------------------------
Component
---------------------------------------------- _/

export const BsodFonts = [
/_ ----------------- CRT / UI ----------------- _/ 'Arial Black',
'Arial',
'Verdana',
'Tahoma',
'Trebuchet MS',
'Impact',

/_ ----------------- Terminal ----------------- _/
'Courier New',
'Lucida Console',
'Monaco',
'Consolas',
'Menlo',

/_ ----------------- Google (imported globally) ----------------- _/
'Orbitron',
'VT323',
'Press Start 2P',

/_ ----------------- Generic fallbacks ----------------- _/
'monospace',
'sans-serif',
'serif',
'terminal',
];

export const VHSSetting = {
screenText: '12:00 FEB. 28, 1986\r\n<< REWIND',
fontSize: 28,
fontName: 'Press Start 2P',
fontColor: '#FFFFFF',
showCaret: false,
caretMode: 'block',
caretBlinkRate: 2,
horizontalPadding: 48,
verticalPadding: 40,

screenColor: '#0b2fd8',
glowStrength: 0.35,
curvature: 0.06,
vignette: 1.15,

noiseStrength: 0.08,
scanlineStrength: 0.08,
scanlineDensity: 900,

rollSpeed: 0.4,
rollStrength: 0,

chromaOffset: 0.0025,
};

export const TerminalSetting = {
screenText: 'USERNAME: @ruinedpaintings\nPASSWORD: **\*\*\*\***',
fontSize: 28,
fontName: 'Press Start 2P',
fontColor: '#48ff00',
showCaret: true,
caretMode: 'block',
caretBlinkRate: 2,
horizontalPadding: 48,
verticalPadding: 40,
screenColor: '#000000',
glowStrength: 0.35,
curvature: 0.06,
vignette: 1.15,

noiseStrength: 0.08,
scanlineStrength: 0.08,
scanlineDensity: 900,

rollSpeed: 0.4,
rollStrength: 0,

chromaOffset: 0.0025,
};

export default function CRTBlueScreenMaterial({
screenText = '12:00 FEB. 28, 1986',
fontSize = 28,
fontName = 'Press Start 2P',
fontColor = '#FFFFFF',

horizontalPadding = 48,
verticalPadding = 40,

showCaret = false,
caretMode = 'block',
caretBlinkRate = 2,

screenColor = '#0b2fd8',
glowStrength = 0.35,
curvature = 0.06,
vignette = 1.15,

noiseStrength = 0.08,
scanlineStrength = 0.08,
scanlineDensity = 900,

rollSpeed = 0.4,
rollStrength = 0,

chromaOffset = 0.0025,
}) {
const ref = useRef();
const caretClock = useRef(0);
const caretOn = useRef(true);

const { canvas, texture } = useMemo(createTextTexture, []);
const font = `${fontSize}px "${fontName}"`;

const redraw = (caretVisible) => {
drawTextToCanvas({
canvas,
text: screenText,
font,
fontSize,
fontColor,
showCaret: showCaret && caretVisible,
caretMode: caretMode || 'block',
horizontalPadding,
verticalPadding,
});

    texture.needsUpdate = true;

};

useEffect(() => {
redraw(true);
}, [
screenText,
font,
fontColor,
horizontalPadding,
verticalPadding,
showCaret,
caretMode,
]);

useFrame((\_, delta) => {
if (!ref.current) return;
ref.current.uTime += delta;

    if (!showCaret) return;

    caretClock.current += delta;
    if (caretClock.current >= 1 / Math.max(caretBlinkRate, 0.001)) {
      caretClock.current = 0;
      caretOn.current = !caretOn.current;
      redraw(caretOn.current);
    }

});

return (
<crtBlueScreenMaterial
      ref={ref}
      key={CrtBlueScreenMaterial.key}
      toneMapped={false}
      uTextTexture={texture}
      uScreenColor={screenColor}
      uNoiseStrength={noiseStrength}
      uGlowStrength={glowStrength}
      uCurvature={curvature}
      uVignette={vignette}
      uScanlineStrength={scanlineStrength}
      uScanlineDensity={scanlineDensity}
      uRollSpeed={rollSpeed}
      uRollStrength={rollStrength}
      uChromaOffset={chromaOffset}
    />
);
}
