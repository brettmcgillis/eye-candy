// CrtBlueScreenMaterial.js
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

/* ---------------------------------------------
   Shaders
---------------------------------------------- */

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform sampler2D uTextTexture;

uniform vec3  uScreenColor;
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
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

void main() {

  vec2 uv = curve(vUv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float roll = sin(uv.y * 8.0 + uTime * uRollSpeed) * 0.003 * uRollStrength;
  uv.y = fract(uv.y + roll + uTime * 0.02 * uRollStrength);

  vec3 color = uScreenColor;

  float n = hash(uv * 800.0 + uTime * 60.0);
  color += (n - 0.5) * uNoiseStrength;

  float scan = sin(uv.y * uScanlineDensity);
  color -= scan * uScanlineStrength;

  float off = uChromaOffset;
  vec4 tr = texture2D(uTextTexture, uv + vec2(off, 0.0));
  vec4 tg = texture2D(uTextTexture, uv);
  vec4 tb = texture2D(uTextTexture, uv - vec2(off, 0.0));

  vec3 textRGB = vec3(tr.r, tg.g, tb.b);
  float textA = max(tr.a, max(tg.a, tb.a));

  color = mix(color, textRGB, textA);
  color += textRGB * uGlowStrength * textA;

  float d = distance(uv, vec2(0.5));
  float vig = smoothstep(uVignette, 0.45, d);
  color *= mix(1.0, vig, 0.6);

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

/* ---------------------------------------------
   Canvas helpers
---------------------------------------------- */

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
    ctx.fillText(l, x, y + i * lineHeight);
  });

  return { lines, y: y + (lines.length - 1) * lineHeight };
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

  const lineHeight = fontSize * 1.3;
  const maxWidth = canvas.width - horizontalPadding * 2;

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

/* ---------------------------------------------
   Component
---------------------------------------------- */

export const BsodFonts = [
  /* ----------------- CRT / UI ----------------- */ 'Arial Black',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',

  /* ----------------- Terminal ----------------- */
  'Courier New',
  'Lucida Console',
  'Monaco',
  'Consolas',
  'Menlo',

  /* ----------------- Google (imported globally) ----------------- */
  'Orbitron',
  'VT323',
  'Press Start 2P',

  /* ----------------- Generic fallbacks ----------------- */
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
  screenText: 'USERNAME: @ruinedpaintings\nPASSWORD: ********',
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

  useFrame((_, delta) => {
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
