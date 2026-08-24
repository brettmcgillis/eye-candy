import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import BoundSkinnedMesh from '../BoundSkinnedMesh';
import FurPointerSurface from '../FurPointerSurface';
import FurRootPortal from '../FurRootPortal';
import { clampShellCount, createSolidColorTexture } from '../furUtils';

const DEFAULT_START_TINT = [0.6, 0.6, 0.6, 1.0];
const DEFAULT_END_TINT = [1.0, 1.0, 1.0, 0.0];
const DEFAULT_ALPHA_TEXTURE_PATH = '/textures/fur/uneven-alpha.png';

function skipRaycast() {
  return null;
}

const vertexShader = `
precision highp float;

#include <common>
#include <uv_pars_vertex>
#include <skinning_pars_vertex>

uniform float uLayerIndex;
uniform float uLayerThickness;
uniform float uLayersCount;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;
uniform float uAlphaStart;
uniform float uAlphaEnd;
uniform float uTime;
uniform float uWaveScale;
uniform float uStiffness;
uniform vec3 uInteractorPos;
uniform vec3 uInteractorDir;
uniform vec3 uInteractorNormal;
uniform float uInteractorRadius;
uniform float uInteractorStrength;
uniform float uInteractorEnabled;

varying vec2 vTexCoord0;
varying vec4 vLayerColor;

const float RANDOM_COEFF_1 = 0.1376;
const float RANDOM_COEFF_2 = 0.3726;
const float RANDOM_COEFF_3 = 0.2546;

void main() {
  #include <uv_vertex>

  float furOffset = (uLayerIndex + 1.0) * uLayerThickness;
  float layerCoeff = uLayerIndex / max(uLayersCount, 1.0);
  vec3 basePosition = position;
  vec3 furPosition = position + normal * furOffset;
  vec3 shellNormal = normalize(normal);
  float timePi2 = uTime * PI2;
  float waveScaleFinal = uWaveScale * pow(layerCoeff, uStiffness);

  furPosition.x += sin(
    timePi2 + ((position.x + position.y + position.z) * RANDOM_COEFF_1)
  ) * waveScaleFinal;
  furPosition.y += cos(
    timePi2 + ((position.x - position.y + position.z) * RANDOM_COEFF_2)
  ) * waveScaleFinal;
  furPosition.z += sin(
    timePi2 + ((position.x + position.y - position.z) * RANDOM_COEFF_3)
  ) * waveScaleFinal;

  #ifdef USE_SKINNING
    mat4 boneMatX = getBoneMatrix(skinIndex.x);
    mat4 boneMatY = getBoneMatrix(skinIndex.y);
    mat4 boneMatZ = getBoneMatrix(skinIndex.z);
    mat4 boneMatW = getBoneMatrix(skinIndex.w);
    vec4 baseSkinVertex = bindMatrix * vec4(basePosition, 1.0);
    vec4 furSkinVertex = bindMatrix * vec4(furPosition, 1.0);
    vec4 skinnedBase = vec4(0.0);
    vec4 skinnedFur = vec4(0.0);
    skinnedBase += boneMatX * baseSkinVertex * skinWeight.x;
    skinnedBase += boneMatY * baseSkinVertex * skinWeight.y;
    skinnedBase += boneMatZ * baseSkinVertex * skinWeight.z;
    skinnedBase += boneMatW * baseSkinVertex * skinWeight.w;
    skinnedFur += boneMatX * furSkinVertex * skinWeight.x;
    skinnedFur += boneMatY * furSkinVertex * skinWeight.y;
    skinnedFur += boneMatZ * furSkinVertex * skinWeight.z;
    skinnedFur += boneMatW * furSkinVertex * skinWeight.w;
    basePosition = (bindMatrixInverse * skinnedBase).xyz;
    furPosition = (bindMatrixInverse * skinnedFur).xyz;

    mat4 skinMatrix = mat4(0.0);
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix += skinWeight.w * boneMatW;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
    shellNormal = vec4(skinMatrix * vec4(shellNormal, 0.0)).xyz;
  #endif

  shellNormal = normalize(shellNormal);
  vec3 interactionNormal = normalize(uInteractorNormal);

  vec3 interactionDelta = furPosition - uInteractorPos;
  float shellDepth = dot(interactionDelta, interactionNormal);
  vec3 tangentDelta =
    interactionDelta - interactionNormal * shellDepth;
  float tangentDistance = length(tangentDelta);
  vec3 tangentDirection = tangentDelta / max(tangentDistance, 0.00001);
  vec3 brushDelta =
    uInteractorDir - interactionNormal * dot(uInteractorDir, interactionNormal);
  float brushDeltaLength = length(brushDelta);
  vec3 brushDirection = mix(
    tangentDirection,
    brushDelta / max(brushDeltaLength, 0.00001),
    step(0.0001, brushDeltaLength)
  );
  float depthTolerance = max(uLayerThickness * 2.0, uInteractorRadius * 0.08);
  float surfaceMask =
    1.0 -
    smoothstep(depthTolerance, depthTolerance * 2.5, abs(shellDepth - furOffset));
  float compressionWeight = mix(1.0, 0.45, layerCoeff);
  float bendWeight = mix(0.35, 1.0, layerCoeff);
  float interaction =
    (1.0 - smoothstep(0.0, uInteractorRadius, tangentDistance)) *
    surfaceMask *
    uInteractorStrength *
    uInteractorEnabled;
  float flatten = clamp(interaction * compressionWeight * 0.32, 0.0, 0.6);
  vec3 transformed = furPosition + brushDirection * interaction * bendWeight * 0.85;

  transformed = mix(transformed, basePosition, flatten);
  transformed -= shellNormal * interaction * compressionWeight * 0.08;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  vTexCoord0 = uv;
  vLayerColor = vec4(
    mix(uColorStart, uColorEnd, layerCoeff),
    mix(uAlphaStart, uAlphaEnd, layerCoeff)
  );
}
`;

const fragmentShader = `
precision highp float;

uniform vec3 uBaseColor;
uniform sampler2D uSourceMap;
uniform sampler2D uAlphaMap;
uniform float uUseSourceMap;

varying vec2 vTexCoord0;
varying vec4 vLayerColor;

void main() {
  vec4 diffuseColor = vec4(uBaseColor, 1.0);

  if (uUseSourceMap > 0.5) {
    diffuseColor *= texture2D(uSourceMap, vTexCoord0);
  }

  float alphaColor = texture2D(uAlphaMap, vTexCoord0).r;
  vec4 furColor = diffuseColor * vLayerColor;
  furColor.a *= alphaColor;

  if (furColor.a <= 0.001) {
    discard;
  }

  gl_FragColor = furColor;
}
`;

function resolveLayerTint(tint, fallback) {
  const source = Array.isArray(tint) ? tint : fallback;

  return {
    alpha: source[3] ?? fallback[3],
    color: new THREE.Color(source[0], source[1], source[2]),
  };
}

function createShellMaterial({
  alphaMap,
  alphaEnd,
  alphaStart,
  baseColor,
  colorEnd,
  colorStart,
  fallbackTexture,
  layerIndex,
  layerThickness,
  layersCount,
  source,
  interactionRadius,
  interactionStrength,
  stiffness,
  waveScale,
}) {
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      uAlphaEnd: { value: alphaEnd },
      uAlphaMap: { value: alphaMap || fallbackTexture },
      uAlphaStart: { value: alphaStart },
      uBaseColor: { value: baseColor.clone() },
      uColorEnd: { value: colorEnd.clone() },
      uColorStart: { value: colorStart.clone() },
      uInteractorEnabled: { value: 0 },
      uInteractorDir: { value: new THREE.Vector3(1, 0, 0) },
      uInteractorNormal: { value: new THREE.Vector3(0, 1, 0) },
      uInteractorPos: { value: new THREE.Vector3(1000, 1000, 1000) },
      uInteractorRadius: { value: interactionRadius },
      uInteractorStrength: { value: interactionStrength },
      uLayerIndex: { value: layerIndex },
      uLayerThickness: { value: layerThickness },
      uLayersCount: { value: layersCount },
      uSourceMap: { value: source.map || fallbackTexture },
      uStiffness: { value: stiffness },
      uTime: { value: 0 },
      uUseSourceMap: { value: source.map ? 1 : 0 },
      uWaveScale: { value: waveScale },
    },
    vertexShader,
  });

  material.skinning = source.isSkinnedMesh;

  return material;
}

export default function ShellFurGL({
  source,
  layers = null,
  shellCount = 20,
  thickness = null,
  shellSpacing = null,
  waveScale = 0.06,
  stiffness = 2.75,
  startColor = DEFAULT_START_TINT,
  endColor = DEFAULT_END_TINT,
  alphaTexturePath = DEFAULT_ALPHA_TEXTURE_PATH,
  rootColor = null,
  interactive = false,
  interactionRadius = 0.18,
  interactionStrength = 1.2,
  showInteractionSurface = false,
  ...groupProps
}) {
  const rootRef = useRef();
  const localPointerRef = useRef(new THREE.Vector3());
  const localNormalRef = useRef(new THREE.Vector3(0, 1, 0));
  const previousPointerRef = useRef(new THREE.Vector3());
  const brushDirectionRef = useRef(new THREE.Vector3(1, 0, 0));
  const markerRef = useRef();
  const fallbackTexture = useMemo(() => createSolidColorTexture(), []);
  const alphaTexture = useTexture(alphaTexturePath);
  const shouldRenderInteractionSurface = interactive || showInteractionSurface;
  const resolvedLayerCount = useMemo(
    () => clampShellCount(layers ?? shellCount),
    [layers, shellCount]
  );
  const resolvedBaseColor = useMemo(() => {
    const color = source.baseColor.clone();

    if (rootColor) {
      color.set(rootColor);
    }

    return color;
  }, [rootColor, source.baseColor]);
  const resolvedStartTint = useMemo(
    () => resolveLayerTint(startColor, DEFAULT_START_TINT),
    [startColor]
  );
  const resolvedEndTint = useMemo(
    () => resolveLayerTint(endColor, DEFAULT_END_TINT),
    [endColor]
  );
  const resolvedLayerThickness = thickness ?? shellSpacing ?? 0.018;
  const resolvedInteractionRadius = interactionRadius * (source.radius || 1);
  const resolvedWaveScale = waveScale;
  const resolvedMarkerRadius = resolvedInteractionRadius;
  const materials = useMemo(
    () =>
      Array.from({ length: resolvedLayerCount }, (_, layerIndex) =>
        createShellMaterial({
          alphaMap: alphaTexture,
          alphaEnd: resolvedEndTint.alpha,
          alphaStart: resolvedStartTint.alpha,
          baseColor: resolvedBaseColor,
          colorEnd: resolvedEndTint.color,
          colorStart: resolvedStartTint.color,
          fallbackTexture,
          interactionRadius: resolvedInteractionRadius,
          interactionStrength,
          layerIndex,
          layerThickness: resolvedLayerThickness,
          layersCount: resolvedLayerCount,
          source,
          stiffness,
          waveScale: resolvedWaveScale,
        })
      ),
    [
      alphaTexture,
      fallbackTexture,
      resolvedBaseColor,
      resolvedEndTint.alpha,
      resolvedEndTint.color,
      resolvedInteractionRadius,
      interactionStrength,
      resolvedLayerCount,
      resolvedLayerThickness,
      resolvedStartTint.alpha,
      resolvedStartTint.color,
      resolvedWaveScale,
      source,
      stiffness,
    ]
  );

  useEffect(() => {
    if (!alphaTexture) {
      return;
    }

    alphaTexture.colorSpace = THREE.NoColorSpace;
    alphaTexture.wrapS = THREE.RepeatWrapping;
    alphaTexture.wrapT = THREE.RepeatWrapping;
    alphaTexture.needsUpdate = true;
  }, [alphaTexture]);

  useEffect(
    () => () => {
      fallbackTexture.dispose();
    },
    [fallbackTexture]
  );

  useEffect(
    () => () => {
      materials.forEach((material) => material.dispose());
    },
    [materials]
  );

  useEffect(() => {
    materials.forEach((material, layerIndex) => {
      const { uniforms } = material;

      uniforms.uAlphaEnd.value = resolvedEndTint.alpha;
      uniforms.uAlphaMap.value = alphaTexture || fallbackTexture;
      uniforms.uAlphaStart.value = resolvedStartTint.alpha;
      uniforms.uBaseColor.value.copy(resolvedBaseColor);
      uniforms.uColorEnd.value.copy(resolvedEndTint.color);
      uniforms.uColorStart.value.copy(resolvedStartTint.color);
      uniforms.uInteractorRadius.value = resolvedInteractionRadius;
      uniforms.uInteractorStrength.value = interactionStrength;
      uniforms.uLayerIndex.value = layerIndex;
      uniforms.uLayerThickness.value = resolvedLayerThickness;
      uniforms.uLayersCount.value = resolvedLayerCount;
      uniforms.uSourceMap.value = source.map || fallbackTexture;
      uniforms.uStiffness.value = stiffness;
      uniforms.uUseSourceMap.value = source.map ? 1 : 0;
      uniforms.uWaveScale.value = resolvedWaveScale;
    });
  }, [
    alphaTexture,
    fallbackTexture,
    materials,
    resolvedBaseColor,
    resolvedEndTint.alpha,
    resolvedEndTint.color,
    resolvedInteractionRadius,
    interactionStrength,
    resolvedLayerCount,
    resolvedLayerThickness,
    resolvedStartTint.alpha,
    resolvedStartTint.color,
    resolvedWaveScale,
    source.map,
    stiffness,
  ]);

  const updateMarker = useCallback(() => {
    if (!markerRef.current || !showInteractionSurface) {
      return;
    }

    markerRef.current.visible = true;
    markerRef.current.position.copy(localPointerRef.current);
  }, [showInteractionSurface]);

  const updateInteractor = useCallback(
    (event) => {
      if (!interactive || !rootRef.current) {
        return;
      }

      event.stopPropagation();
      localPointerRef.current.copy(event.point);
      rootRef.current.worldToLocal(localPointerRef.current);

      if (event.face?.normal) {
        localNormalRef.current.copy(event.face.normal).normalize();
      }

      const pointerDelta = new THREE.Vector3().subVectors(
        localPointerRef.current,
        previousPointerRef.current
      );

      if (pointerDelta.lengthSq() > 1e-8) {
        brushDirectionRef.current.copy(pointerDelta.normalize());
      }

      previousPointerRef.current.copy(localPointerRef.current);

      materials.forEach((material) => {
        const nextUniforms = material.uniforms;

        nextUniforms.uInteractorEnabled.value = 1;
        nextUniforms.uInteractorDir.value.copy(brushDirectionRef.current);
        nextUniforms.uInteractorNormal.value.copy(localNormalRef.current);
        nextUniforms.uInteractorPos.value.copy(localPointerRef.current);
      });

      updateMarker();
    },
    [interactive, materials, updateMarker]
  );

  const resetInteractor = useCallback(() => {
    materials.forEach((material) => {
      const nextUniforms = material.uniforms;

      nextUniforms.uInteractorEnabled.value = 0;
      nextUniforms.uInteractorDir.value.set(1, 0, 0);
      nextUniforms.uInteractorNormal.value.set(0, 1, 0);
    });

    if (markerRef.current) {
      markerRef.current.visible = false;
    }
  }, [materials]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.visible = false;
    }
  }, [showInteractionSurface]);

  useFrame((_, delta) => {
    materials.forEach((material) => {
      const nextUniforms = material.uniforms;

      nextUniforms.uTime.value += delta;
    });
  });

  return (
    <FurRootPortal ref={rootRef} source={source} {...groupProps}>
      {materials.map((material, layerIndex) => {
        if (source.isSkinnedMesh && source.mesh) {
          return (
            <BoundSkinnedMesh
              key={material.uuid}
              frustumCulled={false}
              material={material}
              raycast={skipRaycast}
              renderOrder={20 + layerIndex}
              sourceMesh={source.mesh}
            />
          );
        }

        return (
          <mesh
            key={material.uuid}
            frustumCulled={false}
            geometry={source.geometry}
            material={material}
            raycast={skipRaycast}
            renderOrder={20 + layerIndex}
          />
        );
      })}

      {shouldRenderInteractionSurface ? (
        <FurPointerSurface
          onPointerDown={interactive ? updateInteractor : undefined}
          onPointerLeave={interactive ? resetInteractor : undefined}
          onPointerMove={interactive ? updateInteractor : undefined}
          showInteractionSurface={showInteractionSurface}
          source={source}
        />
      ) : null}

      {showInteractionSurface ? (
        <mesh ref={markerRef} renderOrder={200}>
          <sphereGeometry args={[resolvedMarkerRadius, 20, 20]} />
          <meshBasicMaterial
            color="#00ff88"
            depthTest={false}
            depthWrite={false}
            opacity={0.95}
            transparent
            wireframe
          />
        </mesh>
      ) : null}
    </FurRootPortal>
  );
}
