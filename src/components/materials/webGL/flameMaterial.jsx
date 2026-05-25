import * as THREE from 'three';

import React from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

import { FLAME_SHADER_CONSTANTS } from '../../elements/flame/flameShared';

const glslNumberLiteral = (value) =>
  Number.isInteger(value) ? `${value}.0` : `${value}`;

const glslLiteral = (value) => {
  if (typeof value === 'number') {
    return glslNumberLiteral(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => glslLiteral(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, glslLiteral(entry)])
    );
  }

  return value;
};

const vec3Literal = (value) => `vec3(${value.join(', ')})`;

const { alpha, baseScale, bend, color, opacity, shimmer, vertical } =
  glslLiteral(FLAME_SHADER_CONSTANTS);

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
    pos *= ${vec3Literal(baseScale)};
    hValue = position.y;
    float posXZlen = length(position.xz);
    pos.y *= 1.0 + (cos((posXZlen + ${vertical.cosOffset}) * ${vertical.pi}) * ${vertical.cosAmp}
           + noise(vec2(0.0, time)) * ${vertical.staticNoiseAmp}
           + noise(vec2(position.x + time, position.z + time)) * ${vertical.flowNoiseAmp}) * position.y;

    float signedNoiseX = noise(vec2(time * ${bend.timeScale}, (position.y - time) * ${bend.heightScale})) * 2.0 - 1.0;
    float signedNoiseZ = noise(vec2((position.y - time) * ${bend.heightScale}, time * ${bend.timeScale})) * 2.0 - 1.0;
    float bendEnvelope = pow(clamp(hValue, 0.0, 1.0), ${bend.power});
    float scoopCycle = sin(time * ${bend.scoopFreq});
    float scoopCrossCycle = sin(time * ${bend.scoopCrossFreq} + ${bend.scoopCrossPhase});
    float driftX = sin(time * ${bend.driftXFreq} + hValue * ${bend.driftXHeightFreq}) * ${bend.driftXAmp};
    float driftZ = cos(time * ${bend.driftZFreq} + hValue * ${bend.driftZHeightFreq} + ${bend.driftZPhase}) * ${bend.driftZAmp};

    pos.x += (scoopCycle * ${bend.scoopAmp} + signedNoiseX * ${bend.signedNoiseXAmp} + driftX) * bendEnvelope;
    pos.z += (scoopCrossCycle * ${bend.scoopCrossAmp} + signedNoiseZ * ${bend.signedNoiseZAmp} + driftZ) * bendEnvelope;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FLAME_FRAG = /* glsl */ `
  uniform float time;
  varying float hValue;
  varying vec2 vUv;

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
    float center = abs(vUv.x - 0.5) * 2.0;
    float radialFalloff = 1.0 - center;
    float heightMask = smoothstep(${alpha.heightStart}, ${alpha.heightPeak}, hValue) * (1.0 - smoothstep(${alpha.tipFadeStart}, ${alpha.tipFadeEnd}, hValue));
    float taperedWidth = mix(${alpha.widthBase}, ${alpha.widthTip}, smoothstep(${alpha.widthTaperStart}, ${alpha.widthTaperEnd}, hValue));
    float edgeNoise = noise(vec2(center * ${alpha.edgeNoiseXScale} + time * ${alpha.edgeNoiseTimeScale}, hValue * ${alpha.edgeNoiseYScale} - time * ${alpha.edgeNoiseTimeSpeed}));
    float edgeMask = 1.0 - smoothstep(taperedWidth, taperedWidth + ${alpha.edgeSoftness} + edgeNoise * ${alpha.edgeNoiseAmp}, center);
    float alpha = heightMask * edgeMask;

    float blueBase = (1.0 - smoothstep(${color.blueBaseFadeStart}, ${color.blueBaseFadeEnd}, hValue)) * smoothstep(${color.blueBaseRadialStart}, ${color.blueBaseRadialEnd}, radialFalloff);
    float innerCore =
      smoothstep(${color.innerCoreHeightStart}, ${color.innerCoreHeightPeak}, hValue) *
      (1.0 - smoothstep(${color.innerCoreFadeStart}, ${color.innerCoreFadeEnd}, hValue)) *
      smoothstep(${color.innerCoreRadialStart}, ${color.innerCoreRadialEnd}, radialFalloff);
    float warmBody =
      smoothstep(${color.warmBodyStart}, ${color.warmBodyEnd}, hValue) *
      (1.0 - smoothstep(${color.warmBodyFadeStart}, ${color.warmBodyFadeEnd}, hValue));
    float emberTip = smoothstep(${color.emberTipStart}, ${color.emberTipEnd}, hValue) * smoothstep(${color.emberCenterStart}, ${color.emberCenterEnd}, center);

    vec3 outerColor = mix(
      ${vec3Literal(color.outerLow)},
      ${vec3Literal(color.outerHigh)},
      smoothstep(${color.outerMixStart}, ${color.outerMixEnd}, hValue)
    );

    vec3 color = outerColor;
    color += ${vec3Literal(color.blue)} * blueBase * ${color.blueScale};
    color = mix(color, ${vec3Literal(color.core)}, innerCore);
    color += ${vec3Literal(color.warm)} * warmBody * radialFalloff * ${color.warmScale};
    color = mix(color, ${vec3Literal(color.ember)}, emberTip * ${color.emberMix});

    float shimmer = ${shimmer.base} + noise(vec2(vUv.x * ${shimmer.xScale} - time * ${shimmer.timeScale}, hValue * ${shimmer.yScale} + time * ${shimmer.timeSpeed})) * ${shimmer.amp};
    color *= shimmer;
    alpha *= ${opacity.base} + innerCore * ${opacity.innerCoreBoost};

    gl_FragColor = vec4(color, alpha);
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
      blending={THREE.NormalBlending}
      side={side}
      depthWrite={false}
      toneMapped={false}
    />
  );
});

export default FlameMaterial;
