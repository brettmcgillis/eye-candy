import React, { useRef } from 'react';

import { RenderTexture, shaderMaterial } from '@react-three/drei';
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

  float drift = sin(uTime * 0.6 + uv.y * 4.0) * 0.002 * uChromaDrift;

  vec3 col;
  col.r = texture2D(uMap, uv + vec2(drift, 0.0)).r;
  col.g = texture2D(uMap, uv).g;
  col.b = texture2D(uMap, uv - vec2(drift, 0.0)).b;

  float t = floor(uTime * uStaticSpeed);
  float noise =
    hash(uv * uStaticScale + t) * 0.6 +
    hash(uv * uStaticScale * 1.7 - t) * 0.4;

  col = mix(col, vec3(noise), uStaticAmount);

  float scan = sin(uv.y * 900.0) * 0.04 * uScanlineStrength;
  col -= scan;

  float luma = dot(col, vec3(0.299,0.587,0.114));
  col += col * smoothstep(0.6, 1.0, luma) * uBloom;

  float d = distance(uv, vec2(0.5));
  col *= 1.0 - smoothstep(0.6, uVignette, d);

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

/* ---------------------------------------------
   Drop-in material
----------------------------------------------*/

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

  useFrame((_, dt) => {
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
      {/* 👇 this is the critical change */}
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
