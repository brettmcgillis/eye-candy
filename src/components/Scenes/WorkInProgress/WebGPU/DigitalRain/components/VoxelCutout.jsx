import {
  Fn,
  float,
  instanceIndex,
  instancedArray,
  mix,
  positionGeometry,
  select,
  uint,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

import cloudDensity from '../utils/density';

const REBUILD_DEBOUNCE_MS = 300;
const CUBE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

// One section of CloudVolume's own density field, revealed as discrete
// cubes — "voxelizing" the cloud rather than approximating a separate one.
// Grid dimensions are structural (they size the storage buffer + instanced
// mesh, so changing them rebuilds); the cutout's placement, spacing, and the
// shared cloud noise field are all dynamic — any of them changing just
// re-dispatches the same compute kernel with fresh uniform values.
function pickStructural(config) {
  return {
    gridX: config.voxelGridX,
    gridY: config.voxelGridY,
    gridZ: config.voxelGridZ,
  };
}

function VoxelCutout({ field, config }) {
  const { gl } = useThree();
  const kernelRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);

  const [structural, setStructural] = useState(() => pickStructural(config));
  useEffect(() => {
    const id = setTimeout(() => {
      const next = pickStructural(config);
      setStructural((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [config.voxelGridX, config.voxelGridY, config.voxelGridZ]);

  useEffect(() => {
    const { gridX, gridY, gridZ } = structural;
    const cellCount = Math.max(1, gridX * gridY * gridZ);
    const densityBuf = instancedArray(cellCount, 'float');

    const dyn = {
      cutoutCenter: uniform(new THREE.Vector3()),
      cellSpacing: uniform(1),
      cellScale: uniform(0.9),
      threshold: uniform(0.35),
      denseColor: uniform(new THREE.Color('#dfe8ff')),
      sparseColor: uniform(new THREE.Color('#4a5480')),
    };

    const gx = uint(gridX);
    const gy = uint(gridY);
    const halfX = (gridX - 1) * 0.5;
    const halfY = (gridY - 1) * 0.5;
    const halfZ = (gridZ - 1) * 0.5;

    function cellLocal(index) {
      const x = index.mod(gx);
      const y = index.div(gx).mod(gy);
      const z = index.div(gx.mul(gy));
      return vec3(
        x.toFloat().sub(halfX),
        y.toFloat().sub(halfY),
        z.toFloat().sub(halfZ)
      );
    }

    const computeDensity = Fn(() => {
      const worldPos = dyn.cutoutCenter.add(
        cellLocal(instanceIndex).mul(dyn.cellSpacing)
      );
      densityBuf
        .element(instanceIndex)
        .assign(cloudDensity({ worldPos, field }));
    })().compute(cellCount);

    const cellPosition = dyn.cutoutCenter.add(
      cellLocal(instanceIndex).mul(dyn.cellSpacing)
    );
    const density = densityBuf.element(instanceIndex);
    const scale = select(
      density.greaterThan(dyn.threshold),
      dyn.cellScale,
      float(0)
    );

    const material = new THREE.MeshStandardNodeMaterial({
      roughness: 0.85,
      metalness: 0.05,
    });
    material.positionNode = positionGeometry.mul(scale).add(cellPosition);
    material.colorNode = mix(
      dyn.sparseColor,
      dyn.denseColor,
      density.saturate()
    );

    const mesh = new THREE.InstancedMesh(CUBE_GEOMETRY, material, cellCount);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    kernelRef.current = { computeDensity, ...dyn };
    setRenderObject(mesh);

    return () => {
      material.dispose();
      kernelRef.current = null;
    };
  }, [structural, field]);

  useEffect(() => {
    const kernel = kernelRef.current;
    if (!kernel) {
      return;
    }
    kernel.cutoutCenter.value.set(
      config.voxelCutoutCenter.x,
      config.voxelCutoutCenter.y,
      config.voxelCutoutCenter.z
    );
    kernel.cellSpacing.value = config.voxelCellSpacing;
    kernel.cellScale.value = config.voxelCellScale;
    kernel.threshold.value = config.voxelThreshold;
    kernel.denseColor.value.set(config.voxelDenseColor);
    kernel.sparseColor.value.set(config.voxelSparseColor);
    gl.compute(kernel.computeDensity);
  }, [
    gl,
    config.voxelCutoutCenter,
    config.voxelCellSpacing,
    config.voxelCellScale,
    config.voxelThreshold,
    config.voxelDenseColor,
    config.voxelSparseColor,
    // The cutout excises from the cloud's own field — re-sample whenever the
    // cloud's shape/noise controls change too, not just voxel-local ones.
    config.cloudPosition,
    config.cloudWidth,
    config.cloudHeight,
    config.cloudDepth,
    config.cloudTileScale,
    config.cloudNoiseFreq,
    config.cloudPerlinOctaves,
    config.cloudScrollSpeed,
    config.cloudSeed,
  ]);

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelCutout);
