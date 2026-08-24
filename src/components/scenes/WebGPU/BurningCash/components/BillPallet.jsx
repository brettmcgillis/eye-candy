/* eslint-disable no-plusplus */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

// The stack element renders its mesh with rotation [-PI/2, 0, 0]; bake that
// into the geometry orientation so instances sit flat on the floor.
const STACK_ROTATION = new THREE.Matrix4().makeRotationX(-Math.PI / 2);

function mulberry32(seed) {
  /* eslint-disable no-bitwise */
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /* eslint-enable no-bitwise */
}

// The GLB is authored at roughly millimeter scale (~264 units long). Normalize
// so a stack's long edge is a sane world-unit size by default.
export const STACK_LENGTH = 0.3;

// World-space dimensions [x, y, z] of one bill stack lying flat on the floor,
// normalized to `length` along its long edge, plus the mesh scale factor that
// achieves it.
export function useStackDims(length = STACK_LENGTH) {
  const { nodes } = useGLTF(modelFile('HundredDollarBillStack.glb'));
  return useMemo(() => {
    const geo = nodes.Object_2.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const size = geo.boundingBox.getSize(new THREE.Vector3());
    size.applyMatrix4(STACK_ROTATION);
    const raw = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)];
    const scale = length / raw[0];
    return { dims: raw.map((v) => v * scale), scale };
  }, [nodes, length]);
}

export function computePalletBox(
  { cols, rows, layers, gap, x, z },
  dims,
  pad = 1.04
) {
  const sx = dims[0] * (1 + gap);
  const sy = dims[1];
  const sz = dims[2] * (1 + gap);
  const height = layers * sy;
  return {
    center: [x, height / 2 + 0.02, z],
    size: [cols * sx * pad, height, rows * sz * pad],
  };
}

function BillPallet({
  cols = 4,
  rows = 4,
  layers = 5,
  gap = 0.06,
  jitter = 0.35,
  missingFraction = 0.25,
  x = 0,
  z = 0,
  seed = 11,
  stackLength = STACK_LENGTH,
  stackScale = 1,
}) {
  const { nodes, materials } = useGLTF(modelFile('HundredDollarBillStack.glb'));
  const { dims, scale: meshScale } = useStackDims(stackLength * stackScale);
  const meshRef = useRef();

  const matrices = useMemo(() => {
    const rand = mulberry32(seed);
    const [dx, dy, dz] = dims;
    const sx = dx * (1 + gap);
    const sy = dy;
    const sz = dz * (1 + gap);
    const out = [];
    const dummy = new THREE.Object3D();
    for (let layer = 0; layer < layers; layer++) {
      const isTop = layer === layers - 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (isTop && rand() < missingFraction) {
            continue; // eslint-disable-line no-continue
          }
          const jx = (rand() - 0.5) * jitter * sx * 0.35;
          const jz = (rand() - 0.5) * jitter * sz * 0.35;
          const px = (i - (cols - 1) / 2) * sx + jx;
          dummy.position.set(
            x + px,
            0.02 + sy / 2 + layer * sy,
            z + (j - (rows - 1) / 2) * sz + jz
          );
          dummy.rotation.set(
            -Math.PI / 2,
            0,
            (rand() - 0.5) * jitter * 0.25 // yaw jitter (pre-rotation z axis)
          );
          dummy.scale.setScalar(meshScale);
          dummy.updateMatrix();
          out.push(dummy.matrix.clone());
        }
      }
    }
    return out;
  }, [
    dims,
    meshScale,
    cols,
    rows,
    layers,
    gap,
    jitter,
    missingFraction,
    x,
    z,
    seed,
  ]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.count = matrices.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[nodes.Object_2.geometry, materials.dollar, matrices.length]}
      castShadow
      receiveShadow
    />
  );
}

export default memo(BillPallet);

useGLTF.preload(modelFile('HundredDollarBillStack.glb'));
