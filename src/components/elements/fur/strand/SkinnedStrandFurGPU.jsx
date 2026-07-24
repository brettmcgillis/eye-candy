import {
  Fn,
  add,
  attribute,
  buffer,
  cameraProjectionMatrix,
  clamp,
  cos,
  cross,
  dot,
  float,
  length,
  mix,
  modelViewMatrix,
  positionLocal,
  pow,
  sin,
  smoothstep,
  texture as textureSample,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import FurPointerSurface from '../FurPointerSurface';
import FurRootPortal from '../FurRootPortal';
import { createSolidColorTexture, normalizeWaveDirection } from '../furUtils';

function getSkinnedPosition(
  boneMatrices,
  position,
  bindMatrix,
  bindMatrixInverse,
  skinIndex,
  skinWeight
) {
  const skinVertex = bindMatrix.mul(position);
  const skinned = add(
    boneMatrices.element(skinIndex.x).mul(skinWeight.x).mul(skinVertex),
    boneMatrices.element(skinIndex.y).mul(skinWeight.y).mul(skinVertex),
    boneMatrices.element(skinIndex.z).mul(skinWeight.z).mul(skinVertex),
    boneMatrices.element(skinIndex.w).mul(skinWeight.w).mul(skinVertex)
  );

  return bindMatrixInverse.mul(skinned).xyz;
}

function getSkinnedNormal(
  boneMatrices,
  normal,
  bindMatrix,
  bindMatrixInverse,
  skinIndex,
  skinWeight
) {
  const skinMatrix = add(
    skinWeight.x.mul(boneMatrices.element(skinIndex.x)),
    skinWeight.y.mul(boneMatrices.element(skinIndex.y)),
    skinWeight.z.mul(boneMatrices.element(skinIndex.z)),
    skinWeight.w.mul(boneMatrices.element(skinIndex.w))
  );

  return bindMatrixInverse
    .mul(skinMatrix)
    .mul(bindMatrix)
    .transformDirection(normal).xyz;
}

const DEFAULT_ALPHA_TEXTURE_PATH = '/textures/fur/uneven-alpha.png';

export default function SkinnedStrandFurGPU({
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
  const uniforms = useMemo(
    () => ({
      baseColor: uniform(resolvedBaseColor.clone()),
      bladeHeight: uniform(resolvedBladeHeight),
      curvature: uniform(curvature),
      interactorEnabled: uniform(0),
      interactorPos: uniform(new THREE.Vector3(1000, 1000, 1000)),
      interactorRadius: uniform(resolvedInteractionRadius),
      interactorStrength: uniform(interactionStrength),
      noiseAmplitude: uniform(resolvedNoiseAmplitude),
      noiseFrequency: uniform(noiseFrequency),
      time: uniform(0),
      tipColor: uniform(resolvedTipColor.clone()),
      tipMix: uniform(tipMix),
      useExplicitTipColor: uniform(useExplicitTipColor ? 1 : 0),
      waveAmplitude: uniform(resolvedWaveAmplitude),
      waveDirection: uniform(resolvedWaveDirection.clone()),
      waveLength: uniform(waveLength),
      waveSpeed: uniform(waveSpeed),
      windStrength: uniform(windStrength),
    }),
    []
  );
  const material = useMemo(() => {
    const nextMaterial = new THREE.MeshBasicNodeMaterial({
      alphaTest: 0.01,
      side: THREE.DoubleSide,
    });
    const rootPositionAttribute = attribute('aRootPosition', 'vec3');
    const rootNormalAttribute = attribute('aRootNormal', 'vec3').normalize();
    const scaleAttribute = attribute('aScale', 'float');
    const phaseAttribute = attribute('aPhase', 'float');
    const quaternionAttribute = attribute('aQuat', 'vec4');
    const rootUvAttribute = attribute('aRootUv', 'vec2');
    const skinIndex = attribute('skinIndex', 'uvec4');
    const skinWeight = attribute('skinWeight', 'vec4');
    const bindMatrix = uniform(source.mesh.bindMatrix, 'mat4');
    const bindMatrixInverse = uniform(source.mesh.bindMatrixInverse, 'mat4');
    const boneMatrices = buffer(
      source.mesh.skeleton.boneMatrices,
      'mat4',
      source.mesh.skeleton.bones.length
    );

    const quatRotate = Fn(([quaternion, vector]) => {
      const firstCross = cross(quaternion.xyz, vector);
      return vector.add(
        cross(quaternion.xyz, firstCross.add(vector.mul(quaternion.w))).mul(2.0)
      );
    });
    const progress = clamp(positionLocal.y, 0.0, 1.0);
    const waveDirectionNode = uniforms.waveDirection.div(
      length(uniforms.waveDirection).max(float(0.0001))
    );
    const shade = sin(
      rootPositionAttribute.x
        .mul(uniforms.noiseFrequency.max(float(0.0001)))
        .add(
          rootPositionAttribute.z.mul(
            uniforms.noiseFrequency.max(float(0.0001))
          )
        )
        .add(progress.mul(4.0))
        .add(uniforms.time.mul(0.1))
    )
      .mul(0.5)
      .add(0.5);
    const furMaskNode = smoothstep(
      float(0.08),
      float(0.65),
      textureSample(
        new THREE.TextureNode(alphaTexture || fallbackTexture),
        uv()
      ).r
    );
    const currentStrandPosition = Fn(() => {
      const strand = vec3(
        positionLocal.x,
        positionLocal.y.mul(uniforms.bladeHeight).mul(scaleAttribute),
        positionLocal.z
      ).toVar();
      const timeValue = uniforms.time.add(phaseAttribute);
      const sway = sin(timeValue.mul(1.3).add(rootPositionAttribute.x.mul(0.2)))
        .add(cos(timeValue.mul(0.7).add(rootPositionAttribute.z.mul(0.15))))
        .mul(uniforms.windStrength)
        .mul(progress.mul(progress));
      const wave = sin(
        dot(rootPositionAttribute.xz, waveDirectionNode)
          .div(uniforms.waveLength.max(float(0.0001)))
          .mul(6.2831852)
          .sub(uniforms.time.mul(uniforms.waveSpeed))
      )
        .mul(uniforms.waveAmplitude)
        .mul(progress);
      const bindStrandPosition = rootPositionAttribute
        .add(
          quatRotate(
            quaternionAttribute,
            strand
              .add(
                vec3(uniforms.curvature.mul(progress).mul(progress), 0.0, 0.0)
              )
              .add(vec3(sway.mul(0.4), 0.0, sway.mul(0.15)))
              .add(
                vec3(
                  waveDirectionNode.x.mul(wave),
                  0.0,
                  waveDirectionNode.y.mul(wave)
                )
              )
              .add(
                vec3(
                  shade.sub(0.5).mul(uniforms.noiseAmplitude).mul(progress),
                  0.0,
                  shade
                    .sub(0.5)
                    .mul(uniforms.noiseAmplitude)
                    .mul(progress)
                    .mul(0.6)
                )
              )
          )
        )
        .toVar();
      const skinnedRootPosition = getSkinnedPosition(
        boneMatrices,
        rootPositionAttribute,
        bindMatrix,
        bindMatrixInverse,
        skinIndex,
        skinWeight
      ).toVar();
      const skinnedSurfaceNormal = getSkinnedNormal(
        boneMatrices,
        rootNormalAttribute,
        bindMatrix,
        bindMatrixInverse,
        skinIndex,
        skinWeight
      )
        .normalize()
        .toVar();
      const skinnedStrandPosition = getSkinnedPosition(
        boneMatrices,
        bindStrandPosition,
        bindMatrix,
        bindMatrixInverse,
        skinIndex,
        skinWeight
      ).toVar();
      const tangentDelta = skinnedRootPosition
        .sub(uniforms.interactorPos)
        .sub(
          skinnedSurfaceNormal.mul(
            dot(
              skinnedRootPosition.sub(uniforms.interactorPos),
              skinnedSurfaceNormal
            )
          )
        )
        .toVar();
      const tangentDistance = length(tangentDelta);
      const interaction = clamp(
        float(1.0)
          .sub(smoothstep(0.0, uniforms.interactorRadius, tangentDistance))
          .mul(uniforms.interactorStrength)
          .mul(uniforms.interactorEnabled),
        0.0,
        1.0
      );
      const interactionDirection = tangentDelta.div(
        tangentDistance.max(float(0.00001))
      );

      return mix(
        skinnedStrandPosition.add(
          interactionDirection
            .mul(interaction)
            .mul(uniforms.bladeHeight)
            .mul(0.9)
            .mul(progress)
        ),
        skinnedRootPosition,
        interaction.mul(0.25).mul(progress)
      );
    })();

    let sourceColorNode = uniforms.baseColor;

    if (source.map) {
      sourceColorNode = uniforms.baseColor.mul(
        textureSample(new THREE.TextureNode(source.map), rootUvAttribute).rgb
      );
    }

    const tipColorNode = mix(
      sourceColorNode,
      uniforms.tipColor,
      uniforms.tipMix.mul(uniforms.useExplicitTipColor)
    );

    nextMaterial.vertexNode = cameraProjectionMatrix
      .mul(modelViewMatrix)
      .mul(vec4(currentStrandPosition, 1.0));
    nextMaterial.colorNode = mix(
      sourceColorNode,
      tipColorNode,
      pow(progress, 1.2)
    )
      .mul(mix(float(0.75), float(1.25), shade))
      .mul(mix(float(0.82), float(1.0), furMaskNode))
      .add(smoothstep(0.7, 1.0, progress).mul(0.12));
    nextMaterial.opacityNode = furMaskNode;

    return nextMaterial;
  }, [alphaTexture, fallbackTexture, source.map, source.mesh, uniforms]);

  useEffect(
    () => () => {
      fallbackTexture.dispose();
      material.dispose();
    },
    [fallbackTexture, material]
  );

  useEffect(() => {
    uniforms.baseColor.value.copy(resolvedBaseColor);
    uniforms.bladeHeight.value = resolvedBladeHeight;
    uniforms.curvature.value = curvature;
    uniforms.interactorRadius.value = resolvedInteractionRadius;
    uniforms.interactorStrength.value = interactionStrength;
    uniforms.noiseAmplitude.value = resolvedNoiseAmplitude;
    uniforms.noiseFrequency.value = noiseFrequency;
    uniforms.tipColor.value.copy(resolvedTipColor);
    uniforms.tipMix.value = tipMix;
    uniforms.useExplicitTipColor.value = useExplicitTipColor ? 1 : 0;
    uniforms.waveAmplitude.value = resolvedWaveAmplitude;
    uniforms.waveDirection.value.copy(resolvedWaveDirection);
    uniforms.waveLength.value = waveLength;
    uniforms.waveSpeed.value = waveSpeed;
    uniforms.windStrength.value = windStrength;
  }, [
    curvature,
    interactionStrength,
    noiseFrequency,
    resolvedBaseColor,
    resolvedBladeHeight,
    resolvedInteractionRadius,
    resolvedNoiseAmplitude,
    resolvedTipColor,
    resolvedWaveAmplitude,
    resolvedWaveDirection,
    tipMix,
    uniforms,
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
      uniforms.interactorEnabled.value = 1;
      uniforms.interactorPos.value.copy(localPointerRef.current);
    },
    [interactive, uniforms]
  );

  const resetInteractor = useCallback(() => {
    uniforms.interactorEnabled.value = 0;
  }, [uniforms]);

  useFrame((_, delta) => {
    uniforms.time.value += delta;
    source.mesh?.skeleton?.update();
  });

  if (!geometry || !source.mesh) {
    return null;
  }

  return (
    <FurRootPortal ref={rootRef} source={source} {...groupProps}>
      <mesh frustumCulled={false} geometry={geometry} material={material} />

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
