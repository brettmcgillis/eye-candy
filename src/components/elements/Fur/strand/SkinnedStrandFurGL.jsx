import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import BoundSkinnedMesh from '../BoundSkinnedMesh';
import FurPointerSurface from '../FurPointerSurface';
import FurRootPortal from '../FurRootPortal';
import { createSolidColorTexture, normalizeWaveDirection } from '../furUtils';

const DEFAULT_ALPHA_TEXTURE_PATH = '/textures/fur/uneven-alpha.png';

const vertexShader = `
#include <common>
#include <skinning_pars_vertex>

attribute vec3 aRootPosition;
attribute vec3 aRootNormal;
attribute float aScale;
attribute float aPhase;
attribute vec4 aQuat;
attribute vec2 aRootUv;

uniform float uTime;
uniform float uBladeHeight;
uniform float uCurvature;
uniform float uWindStrength;
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;
uniform float uWaveAmplitude;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform vec2 uWaveDirection;
uniform vec3 uInteractorPos;
uniform float uInteractorRadius;
uniform float uInteractorStrength;
uniform float uInteractorEnabled;

varying float vProgress;
varying float vShade;
varying vec2 vBladeUv;
varying vec2 vRootUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}


float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 quatRotate(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  vec3 strand = position;
  float progress = clamp(position.y, 0.0, 1.0);
  float waveDirectionLength = max(length(uWaveDirection), 0.0001);
  vec2 waveDirection = uWaveDirection / waveDirectionLength;
  float timeValue = uTime + aPhase;
  float sway =
    sin(timeValue * 1.3 + aRootPosition.x * 0.2) +
    cos(timeValue * 0.7 + aRootPosition.z * 0.15);
  float wavePhase =
    dot(aRootPosition.xz, waveDirection) / max(uWaveLength, 0.0001);
  float wave =
    sin(wavePhase * 6.2831852 - uTime * uWaveSpeed) *
    uWaveAmplitude *
    progress;
  float shade =
    noise(
      aRootPosition.xz * max(uNoiseFrequency, 0.0001) +
        progress * 4.0 +
        uTime * 0.1
    );

  vProgress = progress;
  vShade = shade;
  vBladeUv = uv;
  vRootUv = aRootUv;

  strand.y *= uBladeHeight * aScale;
  strand.x += uCurvature * progress * progress;
  sway *= uWindStrength * progress * progress;
  strand.x += sway * 0.4;
  strand.z += sway * 0.15;
  strand.xz += waveDirection * wave;
  strand.xz += (shade - 0.5) * uNoiseAmplitude * progress;
  strand = quatRotate(aQuat, strand);

  vec3 bindSurfaceNormal = normalize(aRootNormal);
  vec3 bindRootPosition = aRootPosition;
  vec3 bindStrandPosition = bindRootPosition + strand;
  vec3 currentRootPosition = bindRootPosition;
  vec3 currentStrandPosition = bindStrandPosition;
  vec3 surfaceNormal = bindSurfaceNormal;

  #ifdef USE_SKINNING
    #include <skinbase_vertex>

    vec4 rootSkinVertex = bindMatrix * vec4(bindRootPosition, 1.0);
    vec4 strandSkinVertex = bindMatrix * vec4(bindStrandPosition, 1.0);
    vec4 skinnedRoot = vec4(0.0);
    vec4 skinnedStrand = vec4(0.0);

    skinnedRoot += boneMatX * rootSkinVertex * skinWeight.x;
    skinnedRoot += boneMatY * rootSkinVertex * skinWeight.y;
    skinnedRoot += boneMatZ * rootSkinVertex * skinWeight.z;
    skinnedRoot += boneMatW * rootSkinVertex * skinWeight.w;

    skinnedStrand += boneMatX * strandSkinVertex * skinWeight.x;
    skinnedStrand += boneMatY * strandSkinVertex * skinWeight.y;
    skinnedStrand += boneMatZ * strandSkinVertex * skinWeight.z;
    skinnedStrand += boneMatW * strandSkinVertex * skinWeight.w;

    currentRootPosition = (bindMatrixInverse * skinnedRoot).xyz;
    currentStrandPosition = (bindMatrixInverse * skinnedStrand).xyz;

    mat4 skinMatrix = mat4(0.0);
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix += skinWeight.w * boneMatW;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
    surfaceNormal = vec4(skinMatrix * vec4(bindSurfaceNormal, 0.0)).xyz;
  #endif

  surfaceNormal = normalize(surfaceNormal);

  vec3 tangentDelta =
    (currentRootPosition - uInteractorPos) -
    surfaceNormal * dot(currentRootPosition - uInteractorPos, surfaceNormal);
  float tangentDistance = length(tangentDelta);
  float interaction = clamp(
    (1.0 - smoothstep(0.0, uInteractorRadius, tangentDistance)) *
      uInteractorStrength *
      uInteractorEnabled,
    0.0,
    1.0
  );
  vec3 interactionDirection = tangentDelta / max(tangentDistance, 0.00001);

  currentStrandPosition +=
    interactionDirection * (interaction * uBladeHeight * 0.9) * progress;
  currentStrandPosition = mix(
    currentStrandPosition,
    currentRootPosition,
    interaction * 0.25 * progress
  );

  gl_Position =
    projectionMatrix * modelViewMatrix * vec4(currentStrandPosition, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D uAlphaMap;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform float uTipMix;
uniform sampler2D uSourceMap;
uniform float uUseExplicitTipColor;
uniform float uUseSourceMap;

varying float vProgress;
varying float vShade;
varying vec2 vBladeUv;
varying vec2 vRootUv;

void main() {
  vec3 sourceColor = uBaseColor;

  if (uUseSourceMap > 0.5) {
    sourceColor *= texture2D(uSourceMap, vRootUv).rgb;
  }

  vec3 tipColor = mix(sourceColor, uTipColor, uTipMix * uUseExplicitTipColor);
  vec3 color = mix(sourceColor, tipColor, pow(vProgress, 1.2));
  float furMask = smoothstep(0.08, 0.65, texture2D(uAlphaMap, vBladeUv).r);

  color *= mix(0.75, 1.25, vShade);
  color *= mix(0.82, 1.0, furMask);
  color += smoothstep(0.7, 1.0, vProgress) * 0.12;

  if (furMask <= 0.01) {
    discard;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function SkinnedStrandFurGL({
  source,
  geometry,
  bladeHeight = 0.045,
  alphaTexturePath = DEFAULT_ALPHA_TEXTURE_PATH,
  rootColor = null,
  tipColor = null,
  tipMix = 0.18,
  curvature = 0.05,
  windStrength = 0.18,
  noiseFrequency = 0.4,
  noiseAmplitude = 0.02,
  waveAmplitude = 0.025,
  waveLength = 0.7,
  waveSpeed = 1.2,
  waveDirection = [1, 0],
  interactive = true,
  interactionRadius = 0.18,
  interactionStrength = 1.2,
  showInteractionSurface = false,
  ...groupProps
}) {
  const rootRef = useRef();
  const localPointerRef = useRef(new THREE.Vector3());
  const useExplicitTipColor = tipColor !== null && tipColor !== undefined;
  const spatialScale = source.radius || 1;
  const resolvedBladeHeight = bladeHeight * spatialScale;
  const resolvedInteractionRadius = interactionRadius * spatialScale;
  const resolvedNoiseAmplitude = noiseAmplitude * spatialScale;
  const resolvedWaveAmplitude = waveAmplitude * spatialScale;
  const fallbackTexture = useMemo(() => createSolidColorTexture(), []);
  const alphaTexture = useTexture(alphaTexturePath);
  const resolvedBaseColor = useMemo(() => {
    const color = source.baseColor.clone();

    if (rootColor) {
      color.set(rootColor);
    }

    return color;
  }, [rootColor, source.baseColor]);
  const resolvedTipColor = useMemo(() => {
    if (tipColor) {
      return new THREE.Color(tipColor);
    }

    return source.baseColor.clone();
  }, [source.baseColor, tipColor]);
  const resolvedWaveDirection = useMemo(
    () => normalizeWaveDirection(waveDirection),
    [waveDirection]
  );
  const material = useMemo(() => {
    const nextMaterial = new THREE.ShaderMaterial({
      fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uAlphaMap: { value: alphaTexture || fallbackTexture },
        uBaseColor: { value: resolvedBaseColor.clone() },
        uBladeHeight: { value: resolvedBladeHeight },
        uCurvature: { value: curvature },
        uInteractorEnabled: { value: 0 },
        uInteractorPos: { value: new THREE.Vector3(1000, 1000, 1000) },
        uInteractorRadius: { value: resolvedInteractionRadius },
        uInteractorStrength: { value: interactionStrength },
        uNoiseAmplitude: { value: resolvedNoiseAmplitude },
        uNoiseFrequency: { value: noiseFrequency },
        uSourceMap: { value: source.map || fallbackTexture },
        uTime: { value: 0 },
        uTipColor: { value: resolvedTipColor.clone() },
        uTipMix: { value: tipMix },
        uUseExplicitTipColor: { value: useExplicitTipColor ? 1 : 0 },
        uUseSourceMap: { value: source.map ? 1 : 0 },
        uWaveAmplitude: { value: resolvedWaveAmplitude },
        uWaveDirection: { value: resolvedWaveDirection.clone() },
        uWaveLength: { value: waveLength },
        uWaveSpeed: { value: waveSpeed },
        uWindStrength: { value: windStrength },
      },
      vertexShader,
    });

    nextMaterial.skinning = true;

    return nextMaterial;
  }, []);

  useEffect(
    () => () => {
      fallbackTexture.dispose();
      material.dispose();
    },
    [fallbackTexture, material]
  );

  useEffect(() => {
    material.uniforms.uAlphaMap.value = alphaTexture || fallbackTexture;
    material.uniforms.uBaseColor.value.copy(resolvedBaseColor);
    material.uniforms.uBladeHeight.value = resolvedBladeHeight;
    material.uniforms.uCurvature.value = curvature;
    material.uniforms.uInteractorRadius.value = resolvedInteractionRadius;
    material.uniforms.uInteractorStrength.value = interactionStrength;
    material.uniforms.uNoiseAmplitude.value = resolvedNoiseAmplitude;
    material.uniforms.uNoiseFrequency.value = noiseFrequency;
    material.uniforms.uSourceMap.value = source.map || fallbackTexture;
    material.uniforms.uTipColor.value.copy(resolvedTipColor);
    material.uniforms.uTipMix.value = tipMix;
    material.uniforms.uUseExplicitTipColor.value = useExplicitTipColor ? 1 : 0;
    material.uniforms.uUseSourceMap.value = source.map ? 1 : 0;
    material.uniforms.uWaveAmplitude.value = resolvedWaveAmplitude;
    material.uniforms.uWaveDirection.value.copy(resolvedWaveDirection);
    material.uniforms.uWaveLength.value = waveLength;
    material.uniforms.uWaveSpeed.value = waveSpeed;
    material.uniforms.uWindStrength.value = windStrength;
  }, [
    alphaTexture,
    curvature,
    fallbackTexture,
    interactionStrength,
    material,
    noiseFrequency,
    resolvedBaseColor,
    resolvedBladeHeight,
    resolvedInteractionRadius,
    resolvedNoiseAmplitude,
    resolvedTipColor,
    resolvedWaveAmplitude,
    resolvedWaveDirection,
    source.map,
    tipMix,
    useExplicitTipColor,
    waveLength,
    waveSpeed,
    windStrength,
  ]);

  const updateInteractor = useCallback(
    (event) => {
      if (!interactive || !rootRef.current) {
        return;
      }

      event.stopPropagation();
      localPointerRef.current.copy(event.point);
      rootRef.current.worldToLocal(localPointerRef.current);
      material.uniforms.uInteractorEnabled.value = 1;
      material.uniforms.uInteractorPos.value.copy(localPointerRef.current);
    },
    [interactive, material]
  );

  const resetInteractor = useCallback(() => {
    material.uniforms.uInteractorEnabled.value = 0;
  }, [material]);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
  });

  if (!geometry || !source.mesh) {
    return null;
  }

  return (
    <FurRootPortal ref={rootRef} source={source} {...groupProps}>
      <BoundSkinnedMesh
        frustumCulled={false}
        geometry={geometry}
        material={material}
        sourceMesh={source.mesh}
      />

      <FurPointerSurface
        onPointerDown={interactive ? updateInteractor : undefined}
        onPointerLeave={interactive ? resetInteractor : undefined}
        onPointerMove={interactive ? updateInteractor : undefined}
        showInteractionSurface={showInteractionSurface}
        source={source}
      />
    </FurRootPortal>
  );
}
