import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';
import {
  applyGlitchAttributes,
  buildGlitchAttributes,
  resolveAxisIndex,
  resolveNamedOrigin,
} from '../utils/glitchGeometry';
import {
  createGlitchUniforms,
  createWreckedCarMaterial,
} from '../utils/glitchMaterial';

useGLTF.preload(modelFile('destroyed_car.glb'));

const TARGET_LENGTH = 3.4; // world units, normalized car length along local X

function WreckedCar({ config }) {
  const { nodes, materials } = useGLTF(modelFile('destroyed_car.glb'));

  // Clone so the glitch attributes we bake never touch the shared, cached
  // GLTF geometry other consumers of this model might reuse.
  const { geometry, scale } = useMemo(() => {
    const cloned = nodes.Box001_caprice_low_Material_u1_v1_0.geometry.clone();
    cloned.computeBoundingBox();
    const size = new THREE.Vector3().subVectors(
      cloned.boundingBox.max,
      cloned.boundingBox.min
    );
    return { geometry: cloned, scale: TARGET_LENGTH / size.x };
  }, [nodes]);

  const { uniforms, material } = useMemo(() => {
    const u = createGlitchUniforms();
    // Scroll Tear normalizes against the car's actual local-space height so
    // Leva's 0-1 Tear Position always means "bottom of car" to "top of car".
    u.tearHeightMin.value = geometry.boundingBox.min.y;
    u.tearHeightMax.value = geometry.boundingBox.max.y;
    // Block Deconstruct / Slice Suite / Voxel Snap's axis-wipe sweep
    // normalizes against the car's full local-space bounds (see
    // buildAxisSweep in glitchMaterial.js).
    u.boundsMin.value.copy(geometry.boundingBox.min);
    u.boundsMax.value.copy(geometry.boundingBox.max);
    return {
      uniforms: u,
      material: createWreckedCarMaterial(
        materials.caprice_low_Material_u1_v1,
        u
      ),
    };
  }, [geometry, materials]);

  // Only the controls that change the permutation itself belong in this key
  // — live blend/magnitude/density tuning is handled entirely by uniforms in
  // the useFrame sync below, no CPU recompute needed (docs/scene-conventions.md
  // §10's "never churn on unrelated edits" rule, applied to the glitch bake).
  const attributeKey = useMemo(
    () =>
      JSON.stringify([
        config.glitchCutPasteEnabled,
        config.glitchCutPasteBlockSize,
        config.glitchCutPasteShift,
        config.glitchHopscotchEnabled,
        config.glitchHopscotchOrigin,
        config.glitchHopscotchStride,
        config.glitchUvEnabled,
        config.glitchUvBlockSize,
        config.glitchUvShift,
        config.glitchReglitchTick,
      ]),
    [
      config.glitchCutPasteEnabled,
      config.glitchCutPasteBlockSize,
      config.glitchCutPasteShift,
      config.glitchHopscotchEnabled,
      config.glitchHopscotchOrigin,
      config.glitchHopscotchStride,
      config.glitchUvEnabled,
      config.glitchUvBlockSize,
      config.glitchUvShift,
      config.glitchReglitchTick,
    ]
  );

  useEffect(() => {
    const origin = resolveNamedOrigin(geometry, config.glitchHopscotchOrigin);
    const attributes = buildGlitchAttributes(geometry, {
      seed: config.glitchReglitchTick,
      cutPaste: {
        enabled: config.glitchCutPasteEnabled,
        blockSize: config.glitchCutPasteBlockSize,
        shift: config.glitchCutPasteShift,
      },
      hopscotch: {
        enabled: config.glitchHopscotchEnabled,
        origin,
        stride: config.glitchHopscotchStride,
      },
      uvGlitch: {
        enabled: config.glitchUvEnabled,
        blockSize: config.glitchUvBlockSize,
        shift: config.glitchUvShift,
      },
    });
    applyGlitchAttributes(geometry, attributes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, attributeKey]);

  // Each technique's "Enabled" toggle gates its uniform to 0 outright;
  // otherwise Density passes through as "what fraction of vertices" —
  // flipping Enabled always shows *something*, and Density tunes how much.
  useFrame(() => {
    uniforms.cutPasteDensity.value = config.glitchCutPasteEnabled
      ? config.glitchCutPasteDensity
      : 0;
    uniforms.hopscotchDensity.value = config.glitchHopscotchEnabled
      ? config.glitchHopscotchDensity
      : 0;
    uniforms.uvBlend.value = config.glitchUvEnabled ? config.glitchUvBlend : 0;
    uniforms.magnitude.value = config.glitchMagnitude;
    uniforms.signFlipChance.value = config.glitchSignFlipChance;
    uniforms.density.value = config.glitchFindReplaceEnabled
      ? config.glitchDensity
      : 0;
    material.wireframe = config.glitchWireframe;

    const materialCorrupted = config.glitchMaterialEnabled;
    material.roughness = materialCorrupted
      ? material.userData.baseRoughness * config.glitchRoughnessMultiplier
      : material.userData.baseRoughness;
    material.metalness = materialCorrupted
      ? material.userData.baseMetalness * config.glitchMetalnessMultiplier
      : material.userData.baseMetalness;
    material.emissive.set(
      materialCorrupted ? config.glitchEmissiveColor : '#000000'
    );
    material.emissiveIntensity = materialCorrupted
      ? config.glitchEmissiveIntensity
      : 0;
    uniforms.normalInvert.value = materialCorrupted
      ? config.glitchNormalInvert
      : 0;

    const scrollTearActive = config.glitchScrollTearEnabled;
    uniforms.tearStrength.value = scrollTearActive
      ? config.glitchScrollTearStrength
      : 0;
    uniforms.tearRange.value = config.glitchScrollTearRange;
    uniforms.tearRowJitterStrength.value = scrollTearActive
      ? config.glitchScrollTearRowJitter
      : 0;
    uniforms.tearPosition.value = config.glitchScrollTearAutoScroll
      ? ((performance.now() / 1000) * config.glitchScrollTearSpeed) % 1
      : config.glitchScrollTearPosition;

    uniforms.degradeDensity.value = config.glitchDegradeEnabled
      ? config.glitchDegradeDensity
      : 0;
    uniforms.degradeBlockCount.value = config.glitchDegradeBlockCount;
    uniforms.tornDensity.value = config.glitchTornEnabled
      ? config.glitchTornDensity
      : 0;
    uniforms.tornCellFrequency.value = config.glitchTornCellFrequency;

    uniforms.blockDeconstructAmount.value = config.glitchBlockDeconstructEnabled
      ? config.glitchBlockDeconstructAmount
      : 0;
    uniforms.blockDeconstructTransition.value =
      config.glitchBlockDeconstructTransition;
    uniforms.blockDeconstructBandwidth.value =
      config.glitchBlockDeconstructBandwidth;
    uniforms.blockDeconstructAxis.value = resolveAxisIndex(
      config.glitchBlockDeconstructAxis
    );
    uniforms.blockDeconstructChaos.value = config.glitchBlockDeconstructChaos;
    uniforms.blockDeconstructSize.value = config.glitchBlockDeconstructSize;
    uniforms.blockDeconstructCellAlpha.value =
      config.glitchBlockDeconstructCellAlpha;

    uniforms.sliceSuiteAmount.value = config.glitchSliceSuiteEnabled
      ? config.glitchSliceSuiteAmount
      : 0;
    uniforms.sliceSuiteTransition.value = config.glitchSliceSuiteTransition;
    uniforms.sliceSuiteBandwidth.value = config.glitchSliceSuiteBandwidth;
    uniforms.sliceSuiteAxis.value = resolveAxisIndex(
      config.glitchSliceSuiteAxis
    );
    uniforms.sliceSuiteCount.value = config.glitchSliceSuiteCount;
    uniforms.sliceSuitePushApart.value = config.glitchSliceSuitePushApart;
    uniforms.sliceSuiteTwistMax.value = config.glitchSliceSuiteTwistMax;
    uniforms.sliceSuiteTwistSnap.value = config.glitchSliceSuiteTwistSnap;
    uniforms.sliceSuiteJitterMax.value = config.glitchSliceSuiteJitterMax;
    uniforms.sliceSuiteSliceAlpha.value = config.glitchSliceSuiteSliceAlpha;

    uniforms.voxelSnapAmount.value = config.glitchVoxelSnapEnabled
      ? config.glitchVoxelSnapAmount
      : 0;
    uniforms.voxelSnapTransition.value = config.glitchVoxelSnapTransition;
    uniforms.voxelSnapBandwidth.value = config.glitchVoxelSnapBandwidth;
    uniforms.voxelSnapAxis.value = resolveAxisIndex(config.glitchVoxelSnapAxis);
    uniforms.voxelSnapChaos.value = config.glitchVoxelSnapChaos;
    uniforms.voxelSnapSize.value = config.glitchVoxelSnapSize;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={scale}
      position={[0, -geometry.boundingBox.min.y * scale, 0]}
      castShadow
      receiveShadow
    />
  );
}

export default memo(WreckedCar);
