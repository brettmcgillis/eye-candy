import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import {
  colorModeT,
  createGradientColors,
  sampleGradient,
} from '../utils/palette';

const UP = new THREE.Vector3(0, 1, 0);
const dummy = new THREE.Object3D();
const direction = new THREE.Vector3();
const midpoint = new THREE.Vector3();
const mixedColor = new THREE.Color();

// One InstancedMesh<CylinderGeometry> renders every branch in the forest —
// 2D and 3D modes share this component (scene-conventions.md §8) rather
// than forking into two renderers: 2D mode passes a small fixed radius and
// plane-constrained directions (from utils/treeGenerator.js), so branches
// read as thin lines without a different geometry/material path. `unlit`
// switches the material between a flat MeshBasicNodeMaterial (2D — reads as
// a graphic pattern regardless of viewing angle) and a lit
// MeshStandardNodeMaterial (3D — shading sells the volumetric branching).
//
// Matrices/geometry rebuild whenever `branches` changes (Forest.jsx already
// debounces structural regeneration upstream, so this only fires on an
// actual new tree). Color is written in the same pass rather than split
// into a second live-update effect — DigitalRain's VoxelCloudBlocks.jsx
// splits these because its color can change independently of its cells;
// here a palette edit is cheap enough over a few thousand instances to just
// redo colors inline without the extra effect/dependency bookkeeping.
function BranchField({
  branches,
  radialSegments,
  radiusScale,
  unlit,
  colorMode,
  paletteStart,
  paletteMid,
  paletteEnd,
  paletteMidpoint,
}) {
  const meshRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);

  useEffect(() => {
    const count = Math.max(branches.length, 1);
    const geometry = new THREE.CylinderGeometry(
      1,
      1,
      1,
      Math.max(3, radialSegments)
    );
    const material = unlit
      ? new THREE.MeshBasicNodeMaterial()
      : new THREE.MeshStandardNodeMaterial({
          roughness: 0.85,
          metalness: 0.05,
        });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.count = branches.length;
    mesh.castShadow = !unlit;
    mesh.receiveShadow = !unlit;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3),
      3
    );

    const { start, mid, end } = createGradientColors({
      paletteStart,
      paletteMid,
      paletteEnd,
    });

    branches.forEach((branch, i) => {
      direction.subVectors(branch.end, branch.start);
      const length = Math.max(direction.length(), 0.0001);
      direction.normalize();
      midpoint.addVectors(branch.start, branch.end).multiplyScalar(0.5);
      dummy.position.copy(midpoint);
      dummy.quaternion.setFromUnitVectors(UP, direction);
      const radius = branch.radius * radiusScale;
      dummy.scale.set(radius, length, radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const t = colorModeT(colorMode, branch);
      sampleGradient({
        t,
        start,
        mid,
        end,
        midpoint: paletteMidpoint,
        out: mixedColor,
      });
      mesh.setColorAt(i, mixedColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();

    meshRef.current = mesh;
    setRenderObject(mesh);

    return () => {
      geometry.dispose();
      material.dispose();
      meshRef.current = null;
    };
  }, [
    branches,
    radialSegments,
    radiusScale,
    unlit,
    colorMode,
    paletteStart,
    paletteMid,
    paletteEnd,
    paletteMidpoint,
  ]);

  if (!renderObject) return null;
  return <primitive object={renderObject} />;
}

export default memo(BranchField);
