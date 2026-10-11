import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  PLATE_MARGIN,
  WORLD_SCALE,
  waveOrigin,
} from '@modules/subdivisionRelief';

import createCellGeometry, { slidesIn, writeCells } from './cellBuffers';
import createCellMaterial from './cellMaterial';

const MIN_CAPACITY = 1024;

function createMotionUniforms() {
  return {
    base: uniform(0),
    depth: uniform(0),
    depthBias: uniform(1),
    gap: uniform(0),
    maxDepth: uniform(1),
    mix: uniform(0),
    noiseAmount: uniform(0),
    noisePhase: uniform(0),
    noiseScale: uniform(1),
    roughness: uniform(0.5),
    waveAmount: uniform(0),
    waveLength: uniform(1),
    waveOrigin: uniform(new THREE.Vector2()),
    wavePhase: uniform(0),
  };
}

// The relief as one imperative object, drawn by the scene, the headless CLIs
// and Darkroom alike: `apply(config)` sets the look, `setPiece(piece)` writes
// a piece's cells (again whenever a height key changes), `setGrow` and
// `setMotion` drive the grow loop and the noise/wave motion. The panel lies in
// the xy plane with heights along +z.
export default function createReliefRig() {
  const grow = uniform(0);
  const motion = createMotionUniforms();
  const group = new THREE.Group();

  const plateMaterial = new THREE.MeshStandardMaterial();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), plateMaterial);
  plate.position.z = -0.002;
  plate.receiveShadow = true;

  let slide = false;
  let material = createCellMaterial({ grow, motion, slide });
  let geometry = createCellGeometry(MIN_CAPACITY, 'quad');
  const cells = new THREE.Mesh(geometry, material);
  cells.castShadow = true;
  cells.receiveShadow = true;
  cells.frustumCulled = false;
  group.add(plate, cells);

  let config = null;
  let piece = null;

  function placeWave() {
    if (piece && config)
      motion.waveOrigin.value.set(...waveOrigin(piece, config));
  }

  // Grown by doubling and never shrunk, so a webcam piece rewrites buffers
  // instead of allocating them. The old geometry is freed before the next
  // frame draws, or three leaks the buffers its render object still holds.
  function ensureGeometry(count, lattice) {
    let { capacity } = geometry.userData;
    while (capacity < count) capacity *= 2;
    if (
      lattice === geometry.userData.lattice &&
      capacity === geometry.userData.capacity
    ) {
      return;
    }
    const old = geometry;
    geometry = createCellGeometry(capacity, lattice);
    cells.geometry = geometry;
    old.dispose();
  }

  return {
    group,

    apply(next) {
      config = next;
      if (slidesIn(next) !== slide) {
        slide = slidesIn(next);
        const old = material;
        material = createCellMaterial({ grow, motion, slide });
        cells.material = material;
        old.dispose();
      }
      plateMaterial.color.set(next.plateColor);
      plateMaterial.roughness = next.roughness;
      motion.base.value = next.baseHeight;
      motion.depth.value = next.motionDepth;
      motion.depthBias.value = next.depthBias;
      motion.gap.value = next.cellGap;
      motion.noiseAmount.value = next.motionNoiseAmount;
      motion.noiseScale.value = next.motionNoiseScale;
      motion.roughness.value = next.roughness;
      motion.waveAmount.value = next.motionWaveAmount;
      motion.waveLength.value = next.motionWaveLength;
      placeWave();
    },

    // What buildReliefPiece returned, laid out with the last applied config.
    setPiece(next) {
      piece = next;
      ensureGeometry(piece.nodes.length, config.lattice);
      writeCells(geometry, piece, config);
      motion.maxDepth.value = piece.maxDepth;
      plate.scale.set(
        piece.canvas.width * WORLD_SCALE * PLATE_MARGIN,
        piece.canvas.height * WORLD_SCALE * PLATE_MARGIN,
        1
      );
      placeWave();
    },

    // In levels: 0 is the root grid, maxDepth + 1 the fully split piece.
    setGrow(value) {
      grow.value = value;
    },

    setMotion({ mix, noisePhase, wavePhase }) {
      motion.mix.value = mix;
      motion.noisePhase.value = noisePhase;
      motion.wavePhase.value = wavePhase;
    },

    dispose() {
      geometry.dispose();
      material.dispose();
      plate.geometry.dispose();
      plateMaterial.dispose();
    },
  };
}
