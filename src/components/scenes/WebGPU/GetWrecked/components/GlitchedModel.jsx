import React, { memo, useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

import {
  applyGlitchAttributes,
  buildGlitchAttributes,
  resolveNamedOrigin,
} from '../utils/glitchGeometry';
import {
  createGlitchUniforms,
  createWreckedCarMaterial,
} from '../utils/glitchMaterial';
import syncGlitchUniforms from '../utils/syncGlitchUniforms';

function GlitchedModel({
  config,
  file,
  targetLength,
  glitchActive,
  position,
  rotationY,
}) {
  const { scene: gltfScene } = useGLTF(modelFile(file));

  // First mesh rather than a named node lookup: the glitch pipeline is
  // geometry-agnostic by design, and hard-coding node/material names would tie
  // it back to one model. See utils/vehicles.js on the single-mesh requirement.
  const source = useMemo(() => {
    gltfScene.updateMatrixWorld(true);
    let found = null;
    gltfScene.traverse((object) => {
      if (!found && object.isMesh) found = object;
    });
    return found;
  }, [gltfScene]);

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
    // Bake the GLTF node transform in rather than re-applying it on the
    // rendered mesh: these models are authored in different up-axes, and the
    // glitch bounds/axis dials all read local space, so every vehicle has to
    // arrive already upright and axis-consistent.
    const cloned = source.geometry.clone().toNonIndexed();
    cloned.applyMatrix4(source.matrixWorld);
    cloned.computeBoundingBox();
    const size = new THREE.Vector3().subVectors(
      cloned.boundingBox.max,
      cloned.boundingBox.min
    );
    return {
      geometry: cloned,
      scale: targetLength / Math.max(size.x, size.z),
    };
  }, [source, targetLength]);

  const { uniforms, material } = useMemo(() => {
    const u = createGlitchUniforms();
    // Block Deconstruct / Slice Suite / Voxel Snap's axis-wipe sweep
    // normalizes against this model's own local-space bounds (see
    // buildAxisSweep in glitchMaterial.js).
    u.boundsMin.value.copy(geometry.boundingBox.min);
    u.boundsMax.value.copy(geometry.boundingBox.max);
    return {
      uniforms: u,
      material: createWreckedCarMaterial(source.material, u),
    };
  }, [geometry, source]);

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
    applyGlitchAttributes(
      geometry,
      buildGlitchAttributes(geometry, {
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
      })
    );
  }, [geometry, attributeKey]);

  useFrame(() => {
    syncGlitchUniforms(uniforms, material, config, glitchActive);
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={scale}
      position={[
        position.x,
        position.y - geometry.boundingBox.min.y * scale,
        position.z,
      ]}
      rotation={[0, THREE.MathUtils.degToRad(rotationY), 0]}
      castShadow
      receiveShadow
    />
  );
}

export default memo(GlitchedModel);
