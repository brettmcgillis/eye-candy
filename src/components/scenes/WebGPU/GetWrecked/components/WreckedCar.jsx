import React, { memo, useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

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

  // Clone (so the glitch attributes we bake never touch the shared, cached
  // GLTF geometry other consumers of this model might reuse) and expand to
  // non-indexed: Slice Suite/Block Deconstruct/Voxel Snap move vertices in
  // per-cell groups, and a shared vertex can only move to one place, so an
  // indexed mesh always keeps neighboring cells stitched together no matter
  // how far apart their groups move. Non-indexed gives every triangle its
  // own unique corners, so triangles in different groups can actually pull
  // apart. It also gives Torn Open's wireframe-edge reveal a reliable
  // per-corner id via vertexIndex % 3 (see buildBarycentricNode in
  // glitchMaterial.js) with no extra vertex buffer needed.
  const { geometry, scale } = useMemo(() => {
    const cloned = nodes.Box001_caprice_low_Material_u1_v1_0.geometry
      .clone()
      .toNonIndexed();
    cloned.computeBoundingBox();
    const size = new THREE.Vector3().subVectors(
      cloned.boundingBox.max,
      cloned.boundingBox.min
    );
    return { geometry: cloned, scale: TARGET_LENGTH / size.x };
  }, [nodes]);

  const { uniforms, material } = useMemo(() => {
    const u = createGlitchUniforms();
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

    uniforms.tearStrength.value = config.glitchScrollTearEnabled
      ? config.glitchScrollTearStrength
      : 0;
    uniforms.tearRange.value = config.glitchScrollTearRange;
    uniforms.tearPosition.value = config.glitchScrollTearPosition;

    uniforms.rowJitterStrength.value = config.glitchRowJitterEnabled
      ? config.glitchRowJitterStrength
      : 0;
    uniforms.rowJitterBands.value = config.glitchRowJitterBands;
    uniforms.rowJitterAxis.value = resolveAxisIndex(config.glitchRowJitterAxis);

    uniforms.degradeDensity.value = config.glitchDegradeEnabled
      ? config.glitchDegradeDensity
      : 0;
    uniforms.degradeBlockCount.value = config.glitchDegradeBlockCount;
    uniforms.tornDensity.value = config.glitchTornEnabled
      ? config.glitchTornDensity
      : 0;
    uniforms.tornCellFrequency.value = config.glitchTornCellFrequency;
    uniforms.tornWireframeWidth.value = config.glitchTornWireframeWidth;

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

    uniforms.innerStretchDensity.value = config.glitchInnerStretchEnabled
      ? config.glitchInnerStretchDensity
      : 0;
    uniforms.innerStretchStretch.value = config.glitchInnerStretchStretch;
    uniforms.innerStretchCellFrequency.value =
      config.glitchInnerStretchCellFrequency;

    uniforms.warpFieldAmount.value = config.glitchWarpFieldEnabled
      ? config.glitchWarpFieldAmount
      : 0;
    uniforms.warpFieldFrequency.value = config.glitchWarpFieldFrequency;
    uniforms.warpFieldSpeed.value = config.glitchWarpFieldSpeed;
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
