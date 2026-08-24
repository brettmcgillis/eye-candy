import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import {
  abs,
  cameraProjectionMatrix,
  clamp,
  cos,
  dot,
  float,
  length,
  mix,
  modelViewMatrix,
  normalLocal,
  positionLocal,
  pow,
  sin,
  smoothstep,
  step,
  texture as textureSample,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import BoundSkinnedMesh from '../BoundSkinnedMesh';
import FurPointerSurface from '../FurPointerSurface';
import FurRootPortal from '../FurRootPortal';
import { clampShellCount, createSolidColorTexture } from '../furUtils';

const DEFAULT_START_TINT = [0.6, 0.6, 0.6, 1.0];
const DEFAULT_END_TINT = [1.0, 1.0, 1.0, 0.0];
const DEFAULT_ALPHA_TEXTURE_PATH = '/textures/fur/uneven-alpha.png';
const PI2 = 6.2831852;
const RANDOM_COEFF_1 = 0.1376;
const RANDOM_COEFF_2 = 0.3726;
const RANDOM_COEFF_3 = 0.2546;

function skipRaycast() {
  return null;
}

function resolveLayerTint(tint, fallback) {
  const source = Array.isArray(tint) ? tint : fallback;

  return {
    alpha: source[3] ?? fallback[3],
    color: new THREE.Color(source[0], source[1], source[2]),
  };
}

function createShellMaterial({
  alphaEnd,
  alphaMap,
  alphaStart,
  baseColor,
  colorEnd,
  colorStart,
  layerIndex,
  layerThickness,
  layersCount,
  sourceMap,
  interactionRadius,
  interactionStrength,
  stiffness,
  useSourceMap,
  waveScale,
}) {
  const uniforms = {
    alphaEnd: uniform(alphaEnd),
    alphaStart: uniform(alphaStart),
    baseColor: uniform(baseColor.clone()),
    colorEnd: uniform(colorEnd.clone()),
    colorStart: uniform(colorStart.clone()),
    interactorEnabled: uniform(0),
    interactorDir: uniform(new THREE.Vector3(1, 0, 0)),
    interactorNormal: uniform(new THREE.Vector3(0, 1, 0)),
    interactorPos: uniform(new THREE.Vector3(1000, 1000, 1000)),
    interactorRadius: uniform(interactionRadius),
    interactorStrength: uniform(interactionStrength),
    layerIndex: uniform(layerIndex),
    layerThickness: uniform(layerThickness),
    layersCount: uniform(layersCount),
    stiffness: uniform(stiffness),
    time: uniform(0),
    useSourceMap: uniform(useSourceMap ? 1 : 0),
    waveScale: uniform(waveScale),
  };
  const material = new THREE.MeshBasicNodeMaterial({
    alphaTest: 0.001,
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const layerCoeff = uniforms.layerIndex.div(
    uniforms.layersCount.max(float(1))
  );
  const furOffset = uniforms.layerIndex.add(1).mul(uniforms.layerThickness);
  const waveScaleFinal = uniforms.waveScale.mul(
    pow(layerCoeff.max(float(0.0001)), uniforms.stiffness)
  );
  const timePi2 = uniforms.time.mul(PI2);
  const basePosition = positionLocal.toVar();
  const shellNormal = normalLocal.normalize().toVar();
  const interactionNormal = uniforms.interactorNormal.normalize();
  const furPosition = vec3(
    basePosition.x
      .add(shellNormal.x.mul(furOffset))
      .add(
        sin(
          timePi2.add(
            basePosition.x
              .add(basePosition.y)
              .add(basePosition.z)
              .mul(RANDOM_COEFF_1)
          )
        ).mul(waveScaleFinal)
      ),
    basePosition.y
      .add(shellNormal.y.mul(furOffset))
      .add(
        cos(
          timePi2.add(
            basePosition.x
              .sub(basePosition.y)
              .add(basePosition.z)
              .mul(RANDOM_COEFF_2)
          )
        ).mul(waveScaleFinal)
      ),
    basePosition.z
      .add(shellNormal.z.mul(furOffset))
      .add(
        sin(
          timePi2.add(
            basePosition.x
              .add(basePosition.y)
              .sub(basePosition.z)
              .mul(RANDOM_COEFF_3)
          )
        ).mul(waveScaleFinal)
      )
  );
  const interactionDelta = furPosition.sub(uniforms.interactorPos).toVar();
  const shellDepth = dot(interactionDelta, interactionNormal).toVar();
  const tangentDelta = interactionDelta
    .sub(interactionNormal.mul(shellDepth))
    .toVar();
  const tangentDistance = length(tangentDelta);
  const tangentDirection = tangentDelta.div(
    tangentDistance.max(float(0.00001))
  );
  const brushDelta = uniforms.interactorDir
    .sub(interactionNormal.mul(dot(uniforms.interactorDir, interactionNormal)))
    .toVar();
  const brushDeltaLength = length(brushDelta);
  const brushDirection = mix(
    tangentDirection,
    brushDelta.div(brushDeltaLength.max(float(0.00001))),
    step(float(0.0001), brushDeltaLength)
  );
  const depthTolerance = uniforms.layerThickness
    .mul(2.0)
    .max(uniforms.interactorRadius.mul(0.08));
  const surfaceMask = float(1.0).sub(
    smoothstep(
      depthTolerance,
      depthTolerance.mul(2.5),
      abs(shellDepth.sub(furOffset))
    )
  );
  const compressionWeight = mix(float(1.0), float(0.45), layerCoeff);
  const bendWeight = mix(float(0.35), float(1.0), layerCoeff);
  const interaction = float(1.0)
    .sub(smoothstep(0.0, uniforms.interactorRadius, tangentDistance))
    .mul(surfaceMask)
    .mul(uniforms.interactorStrength)
    .mul(uniforms.interactorEnabled);
  const flatten = clamp(interaction.mul(compressionWeight).mul(0.32), 0.0, 0.6);
  const interactivePosition = mix(
    furPosition.add(brushDirection.mul(interaction).mul(bendWeight).mul(0.85)),
    basePosition,
    flatten
  ).sub(shellNormal.mul(interaction).mul(compressionWeight).mul(0.08));
  let sourceColorNode = uniforms.baseColor;

  if (sourceMap) {
    sourceColorNode = mix(
      uniforms.baseColor,
      uniforms.baseColor.mul(
        textureSample(new THREE.TextureNode(sourceMap), uv()).rgb
      ),
      uniforms.useSourceMap
    );
  }

  material.vertexNode = cameraProjectionMatrix
    .mul(modelViewMatrix)
    .mul(vec4(interactivePosition, 1.0));
  const layerColorNode = sourceColorNode.mul(
    mix(uniforms.colorStart, uniforms.colorEnd, layerCoeff)
  );
  material.colorNode = layerColorNode;
  material.opacityNode = textureSample(
    new THREE.TextureNode(alphaMap),
    uv()
  ).r.mul(mix(uniforms.alphaStart, uniforms.alphaEnd, layerCoeff));

  return { material, uniforms };
}

export default function ShellFurGPU({
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
  const layersData = useMemo(
    () =>
      Array.from({ length: resolvedLayerCount }, (_, layerIndex) =>
        createShellMaterial({
          alphaEnd: resolvedEndTint.alpha,
          alphaMap: alphaTexture || fallbackTexture,
          alphaStart: resolvedStartTint.alpha,
          baseColor: resolvedBaseColor,
          colorEnd: resolvedEndTint.color,
          colorStart: resolvedStartTint.color,
          interactionRadius: resolvedInteractionRadius,
          interactionStrength,
          layerIndex,
          layerThickness: resolvedLayerThickness,
          layersCount: resolvedLayerCount,
          sourceMap: source.map || fallbackTexture,
          stiffness,
          useSourceMap: Boolean(source.map),
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
      source.map,
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
      layersData.forEach(({ material }) => material.dispose());
    },
    [layersData]
  );

  useEffect(() => {
    layersData.forEach((layer, layerIndex) => {
      const { uniforms } = layer;

      uniforms.alphaEnd.value = resolvedEndTint.alpha;
      uniforms.alphaStart.value = resolvedStartTint.alpha;
      uniforms.baseColor.value.copy(resolvedBaseColor);
      uniforms.colorEnd.value.copy(resolvedEndTint.color);
      uniforms.colorStart.value.copy(resolvedStartTint.color);
      uniforms.interactorRadius.value = resolvedInteractionRadius;
      uniforms.interactorStrength.value = interactionStrength;
      uniforms.layerIndex.value = layerIndex;
      uniforms.layerThickness.value = resolvedLayerThickness;
      uniforms.layersCount.value = resolvedLayerCount;
      uniforms.stiffness.value = stiffness;
      uniforms.useSourceMap.value = source.map ? 1 : 0;
      uniforms.waveScale.value = resolvedWaveScale;
    });
  }, [
    layersData,
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

      layersData.forEach(({ uniforms }) => {
        const nextUniforms = uniforms;

        nextUniforms.interactorEnabled.value = 1;
        nextUniforms.interactorDir.value.copy(brushDirectionRef.current);
        nextUniforms.interactorNormal.value.copy(localNormalRef.current);
        nextUniforms.interactorPos.value.copy(localPointerRef.current);
      });

      updateMarker();
    },
    [interactive, layersData, updateMarker]
  );

  const resetInteractor = useCallback(() => {
    layersData.forEach(({ uniforms }) => {
      const nextUniforms = uniforms;

      nextUniforms.interactorEnabled.value = 0;
      nextUniforms.interactorDir.value.set(1, 0, 0);
      nextUniforms.interactorNormal.value.set(0, 1, 0);
    });

    if (markerRef.current) {
      markerRef.current.visible = false;
    }
  }, [layersData]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.visible = false;
    }
  }, [showInteractionSurface]);

  useFrame((_, delta) => {
    layersData.forEach((layer) => {
      const nextUniforms = layer.uniforms;

      nextUniforms.time.value += delta;
    });
  });

  return (
    <FurRootPortal ref={rootRef} source={source} {...groupProps}>
      {layersData.map(({ material }, layerIndex) => {
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
