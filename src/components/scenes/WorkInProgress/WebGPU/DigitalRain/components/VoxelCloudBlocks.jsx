import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import blurVoxelField from '../utils/blurField';
import cellRevealHash from '../utils/cellReveal';
import buildCloudVoxelField from '../utils/cloudInflator';
import extractVoxelCells from '../utils/voxelCells';

const REBUILD_DEBOUNCE_MS = 300;
const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();

// Renders the exact same Perlin-inflated density field VoxelCloud surfaces
// via marching cubes (utils/cloudInflator.js) as one cube per occupied cell
// instead of a smooth surface — an "obviously voxels" look for comparing
// against, or (via the `revealAmount` prop) glitching cell-by-cell into, the
// contiguous cloud. Cell coordinates are mapped to local space the same way
// marchingCubes.js does ((index - halfSize) / halfSize) so both variants
// line up exactly under VoxelCloud's shared position/scale transform. See
// DigitalRain.jsx and todo.md.
function pickStructural(config) {
  return {
    resolution: config.voxelCloudResolution,
    seed: config.voxelCloudSeed,
    inflationPasses: config.voxelCloudInflationPasses,
    // Shared with VoxelCloud's own isolation threshold AND blur (not a
    // separate, blocks-only cutoff/raw field) so both variants enclose the
    // exact same volume — see todo.md. Reveal-related knobs (noiseScale,
    // revealAmount) are NOT here: they never change which cells qualify,
    // only which already-qualifying cells are currently visible, so they're
    // applied live in the per-instance effect below instead of rebuilding
    // the field.
    isolation: config.voxelCloudIsolation,
    blurIntensity: config.voxelCloudBlurIntensity,
  };
}

function VoxelCloudBlocks({ config, revealAmount = 1 }) {
  const meshRef = useRef(null);
  const cellsRef = useRef(null);
  const gridSizeRef = useRef(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.voxelCloudResolution,
    config.voxelCloudSeed,
    config.voxelCloudInflationPasses,
    config.voxelCloudIsolation,
    config.voxelCloudBlurIntensity,
  ]);

  // Structural rebuild: regenerate the field + occupied-cell list and
  // reallocate the InstancedMesh at the new count.
  useEffect(() => {
    const { resolution, seed, inflationPasses, isolation, blurIntensity } =
      structural;

    const field = buildCloudVoxelField({
      size: resolution,
      seed,
      inflationPasses,
    });
    // Same blur pass extractCloudMesh applies before its own isolation
    // threshold (utils/marchingCubes.js) — without it this thresholds a
    // different (raw) field than the smooth mesh surfaces, and the two
    // variants no longer enclose the same volume.
    blurVoxelField(field, resolution, blurIntensity);
    const cells = extractVoxelCells({
      field,
      size: resolution,
      threshold: isolation,
    });
    const count = Math.max(cells.length / 4, 1);

    const material = new THREE.MeshStandardNodeMaterial({
      roughness: 0.9,
      metalness: 0.05,
    });
    const mesh = new THREE.InstancedMesh(BOX_GEOMETRY, material, count);
    mesh.count = cells.length / 4;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3),
      3
    );

    cellsRef.current = cells;
    gridSizeRef.current = resolution;
    meshRef.current = mesh;
    setRenderObject(mesh);

    return () => {
      material.dispose();
      cellsRef.current = null;
      gridSizeRef.current = null;
      meshRef.current = null;
    };
  }, [structural]);

  // Per-instance transform/color/reveal — cheap enough to redo straight from
  // the cached cell list without regenerating the field or re-extracting
  // cells. The reveal hash (utils/cellReveal.js) is computed live here (not
  // baked in at structural-rebuild time) so tuning seed/noiseScale/reveal-
  // amount never rebuilds the underlying voxel field, only which
  // already-qualifying cells are currently visible.
  useEffect(() => {
    const mesh = meshRef.current;
    const cells = cellsRef.current;
    const size = gridSizeRef.current;
    if (!mesh || !cells || mesh.count === 0) {
      return;
    }

    const halfSize = size / 2;
    const cubeScale = (2 / size) * config.voxelBlocksScale;
    const denseColor = new THREE.Color(config.voxelBlocksDenseColor);
    const sparseColor = new THREE.Color(config.voxelBlocksSparseColor);
    const mixed = new THREE.Color();

    for (let i = 0; i < mesh.count; i += 1) {
      const x = cells[i * 4 + 0];
      const y = cells[i * 4 + 1];
      const z = cells[i * 4 + 2];
      const density = cells[i * 4 + 3];
      const reveal = cellRevealHash(
        x,
        y,
        z,
        config.voxelCloudSeed,
        config.voxelCloudTransitionNoiseScale
      );

      dummy.position.set(
        (x - halfSize) / halfSize,
        (y - halfSize) / halfSize,
        (z - halfSize) / halfSize
      );
      // Not-yet-revealed cells collapse to a zero-scale (invisible) cube
      // rather than being excluded from the instance count — cheap to
      // toggle per-tweak without reallocating the InstancedMesh.
      dummy.scale.setScalar(reveal <= revealAmount ? cubeScale : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mixed
        .copy(sparseColor)
        .lerp(denseColor, THREE.MathUtils.clamp(density, 0, 1));
      mesh.setColorAt(i, mixed);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }, [
    renderObject,
    revealAmount,
    config.voxelCloudSeed,
    config.voxelCloudTransitionNoiseScale,
    config.voxelBlocksScale,
    config.voxelBlocksDenseColor,
    config.voxelBlocksSparseColor,
  ]);

  // Outer transform — shared with VoxelCloud so both variants line up.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    mesh.position.set(
      config.voxelCloudPosition.x,
      config.voxelCloudPosition.y,
      config.voxelCloudPosition.z
    );
    mesh.scale.set(
      config.voxelCloudWidth / 2,
      config.voxelCloudHeight / 2,
      config.voxelCloudDepth / 2
    );
  }, [
    renderObject,
    config.voxelCloudPosition,
    config.voxelCloudWidth,
    config.voxelCloudHeight,
    config.voxelCloudDepth,
  ]);

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelCloudBlocks);
