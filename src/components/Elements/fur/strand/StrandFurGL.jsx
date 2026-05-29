import * as THREE from 'three';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import FurPointerSurface from '../FurPointerSurface';
import FurRootPortal from '../FurRootPortal';
import {
  clampStrandCount,
  createSolidColorTexture,
  normalizeWaveDirection,
} from '../furUtils';
import SkinnedStrandFurGL from './SkinnedStrandFurGL';
import {
  createStrandGeometry,
  updateSkinnedStrandGeometry,
} from './strandGeometry';

const DEFAULT_ALPHA_TEXTURE_PATH = '/textures/fur/uneven-alpha.png';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;
attribute vec4 aQuat;
attribute vec2 aRootUv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
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
  float progress = clamp(strand.y, 0.0, 1.0);
  float waveDirectionLength = max(length(uWaveDirection), 0.0001);
  vec2 waveDirection = uWaveDirection / waveDirectionLength;
  float timeValue = uTime + aPhase;
  float sway =
    sin(timeValue * 1.3 + aOffset.x * 0.2) +
    cos(timeValue * 0.7 + aOffset.z * 0.15);
  float wavePhase = dot(aOffset.xz, waveDirection) / max(uWaveLength, 0.0001);
  float wave =
    sin(wavePhase * 6.2831852 - uTime * uWaveSpeed) *
    uWaveAmplitude *
    progress;
  float shade =
    noise(
      aOffset.xz * max(uNoiseFrequency, 0.0001) +
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

  vec3 surfaceNormal = normalize(quatRotate(aQuat, vec3(0.0, 1.0, 0.0)));
  vec3 tangentDelta =
    (aOffset - uInteractorPos) -
    surfaceNormal * dot(aOffset - uInteractorPos, surfaceNormal);
  float tangentDistance = length(tangentDelta);
  float interaction = clamp(
    (1.0 - smoothstep(0.0, uInteractorRadius, tangentDistance)) *
    uInteractorStrength *
    uInteractorEnabled,
    0.0,
    1.0
  );
  vec3 interactionDirection = tangentDelta / max(tangentDistance, 0.00001);

  strand += interactionDirection * (interaction * uBladeHeight * 0.9) * progress;
  strand.y *= 1.0 - interaction * 0.25 * progress;

  vec3 localPosition = strand + aOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(localPosition, 1.0);
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

export default function StrandFurGL({
  source,
  count = 5000,
  bladeHeight = 0.045,
  bladeWidth = 0.008,
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
  seed = 1,
  showInteractionSurface = false,
  ...groupProps
}) {
  const rootRef = useRef();
  const localPointerRef = useRef(new THREE.Vector3());
  const useExplicitTipColor = tipColor !== null && tipColor !== undefined;
  const spatialScale = source.radius || 1;
  const resolvedBladeHeight = bladeHeight * spatialScale;
  const resolvedBladeWidth = bladeWidth * spatialScale;
  const resolvedInteractionRadius = interactionRadius * spatialScale;
  const resolvedNoiseAmplitude = noiseAmplitude * spatialScale;
  const resolvedWaveAmplitude = waveAmplitude * spatialScale;
  const resolvedCount = useMemo(
    () => clampStrandCount(count, source.isSkinnedMesh),
    [count, source.isSkinnedMesh]
  );
  const fallbackTexture = useMemo(() => createSolidColorTexture(), []);
  const alphaTexture = useTexture(alphaTexturePath);
  const geometry = useMemo(
    () =>
      createStrandGeometry({
        bladeWidth: resolvedBladeWidth,
        isSkinnedMesh: source.isSkinnedMesh,
        seed,
        sourceGeometry: source.geometry,
        strandCount: resolvedCount,
      }),
    [
      resolvedBladeWidth,
      resolvedCount,
      seed,
      source.geometry,
      source.isSkinnedMesh,
    ]
  );
  const isSkinnedGeometry =
    geometry?.userData?.strandGeometryType === 'skinned';
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
  const uniformsRef = useRef({
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
  });

  useEffect(() => () => fallbackTexture.dispose(), [fallbackTexture]);

  useEffect(() => {
    const uniforms = uniformsRef.current;

    uniforms.uAlphaMap.value = alphaTexture || fallbackTexture;
    uniforms.uBaseColor.value.copy(resolvedBaseColor);
    uniforms.uTipColor.value.copy(resolvedTipColor);
    uniforms.uBladeHeight.value = resolvedBladeHeight;
    uniforms.uCurvature.value = curvature;
    uniforms.uInteractorRadius.value = resolvedInteractionRadius;
    uniforms.uInteractorStrength.value = interactionStrength;
    uniforms.uNoiseAmplitude.value = resolvedNoiseAmplitude;
    uniforms.uNoiseFrequency.value = noiseFrequency;
    uniforms.uSourceMap.value = source.map || fallbackTexture;
    uniforms.uTipMix.value = tipMix;
    uniforms.uUseExplicitTipColor.value = useExplicitTipColor ? 1 : 0;
    uniforms.uUseSourceMap.value = source.map ? 1 : 0;
    uniforms.uWaveAmplitude.value = resolvedWaveAmplitude;
    uniforms.uWaveDirection.value.copy(resolvedWaveDirection);
    uniforms.uWaveLength.value = waveLength;
    uniforms.uWaveSpeed.value = waveSpeed;
    uniforms.uWindStrength.value = windStrength;
  }, [
    alphaTexture,
    resolvedBladeHeight,
    curvature,
    fallbackTexture,
    resolvedInteractionRadius,
    interactionStrength,
    resolvedNoiseAmplitude,
    noiseFrequency,
    resolvedBaseColor,
    resolvedTipColor,
    resolvedWaveDirection,
    resolvedWaveAmplitude,
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
      uniformsRef.current.uInteractorEnabled.value = 1;
      uniformsRef.current.uInteractorPos.value.copy(localPointerRef.current);
    },
    [interactive]
  );

  const resetInteractor = useCallback(() => {
    uniformsRef.current.uInteractorEnabled.value = 0;
  }, []);

  useFrame((_, delta) => {
    uniformsRef.current.uTime.value += delta;

    if (!isSkinnedGeometry && source.isSkinnedMesh && source.mesh) {
      updateSkinnedStrandGeometry(geometry, source.mesh);
    }
  });

  if (!geometry) {
    return null;
  }

  if (isSkinnedGeometry && source.mesh) {
    return (
      <SkinnedStrandFurGL
        alphaTexturePath={alphaTexturePath}
        bladeHeight={bladeHeight}
        curvature={curvature}
        geometry={geometry}
        interactionRadius={interactionRadius}
        interactionStrength={interactionStrength}
        interactive={interactive}
        noiseAmplitude={noiseAmplitude}
        noiseFrequency={noiseFrequency}
        rootColor={rootColor}
        showInteractionSurface={showInteractionSurface}
        source={source}
        tipColor={tipColor}
        tipMix={tipMix}
        waveAmplitude={waveAmplitude}
        waveDirection={waveDirection}
        waveLength={waveLength}
        waveSpeed={waveSpeed}
        windStrength={windStrength}
        {...groupProps}
      />
    );
  }

  return (
    <FurRootPortal ref={rootRef} source={source} {...groupProps}>
      <mesh frustumCulled={false} geometry={geometry}>
        <rawShaderMaterial
          fragmentShader={fragmentShader}
          side={THREE.DoubleSide}
          uniforms={uniformsRef.current}
          vertexShader={vertexShader}
        />
      </mesh>

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
