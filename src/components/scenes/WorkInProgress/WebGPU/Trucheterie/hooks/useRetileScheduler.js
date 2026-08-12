import * as THREE from 'three/webgpu';

import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { computeTileTransform, sampleTriggerDelay } from '../utils/retileState';

// Drives the ambient retile animation: each tile has its own idle→animating
// state machine (see utils/retileState.js), advanced on the CPU every frame
// and written into the InstancedMesh's matrix + `instanceMotif` attribute —
// same "CPU useFrame loop writes a typed array + needsUpdate" pattern as
// BurningCash/ClothBills.jsx's instanceBurn, not a WebGPU compute kernel.
export default function useRetileScheduler({
  animMode,
  animSpeed,
  animStagger,
  cellSize,
  grid,
  meshRef,
  pickMotif,
  retileEnabled,
  retileRate,
  straightTileChance,
  weaveEnabled,
}) {
  const stateRef = useRef(null);
  const dummyRef = useRef(null);
  if (!dummyRef.current) dummyRef.current = new THREE.Object3D();
  const elapsedRef = useRef(0);

  const paramsRef = useRef(null);
  paramsRef.current = {
    animMode,
    animSpeed,
    animStagger,
    cellSize,
    pickMotif,
    retileEnabled,
    retileRate,
    straightTileChance,
    weaveEnabled,
  };

  useEffect(() => {
    const { count, motifIds } = grid;
    const { retileRate: rate, animStagger: stagger } = paramsRef.current;

    const phase = new Float32Array(count);
    const animating = new Uint8Array(count);
    const swapped = new Uint8Array(count);
    const nextMotif = new Float32Array(count);
    const duration = new Float32Array(count);
    const triggerAt = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      nextMotif[i] = motifIds[i];
      triggerAt[i] = sampleTriggerDelay(count, rate, stagger);
    }

    stateRef.current = {
      animating,
      count,
      duration,
      motifIds,
      nextMotif,
      phase,
      swapped,
      triggerAt,
    };
    elapsedRef.current = 0;
  }, [grid]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const state = stateRef.current;
    if (!mesh || !state) return;

    const motifAttr = mesh.geometry.getAttribute('instanceMotif');
    if (!motifAttr) return;
    const phaseAttr = mesh.geometry.getAttribute('instanceAnimPhase');

    const params = paramsRef.current;
    const dummy = dummyRef.current;
    const {
      animating,
      count,
      duration,
      motifIds,
      nextMotif,
      phase,
      swapped,
      triggerAt,
    } = state;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    let matrixDirty = false;
    let motifDirty = false;
    let phaseDirty = false;

    for (let i = 0; i < count; i += 1) {
      // Disabling retile only stops NEW triggers — a tile already mid-flip
      // finishes its animation instead of freezing at an odd rotation.
      const shouldRun =
        animating[i] === 1 || (params.retileEnabled && elapsed >= triggerAt[i]);
      if (shouldRun) {
        if (!animating[i]) {
          animating[i] = 1;
          swapped[i] = 0;
          phase[i] = 0;
          nextMotif[i] = params.pickMotif(
            params.straightTileChance,
            params.weaveEnabled
          );
          duration[i] = params.animSpeed * THREE.MathUtils.randFloat(0.8, 1.2);
        }

        phase[i] += delta / Math.max(duration[i], 0.05);

        if (!swapped[i] && phase[i] >= 0.5) {
          motifIds[i] = nextMotif[i];
          motifAttr.array[i] = nextMotif[i];
          swapped[i] = 1;
          motifDirty = true;
        }

        const clampedPhase = Math.min(phase[i], 1);
        const { rotY, rotZ, scale } = computeTileTransform(
          params.animMode,
          clampedPhase
        );

        dummy.position.set(
          grid.positions[i * 3 + 0],
          grid.positions[i * 3 + 1],
          grid.positions[i * 3 + 2]
        );
        dummy.rotation.set(0, rotY, rotZ);
        dummy.scale.setScalar(params.cellSize * scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        matrixDirty = true;

        if (phaseAttr) {
          phaseAttr.array[i] = clampedPhase;
          phaseDirty = true;
        }

        if (phase[i] >= 1) {
          animating[i] = 0;
          phase[i] = 0;
          triggerAt[i] =
            elapsed +
            sampleTriggerDelay(count, params.retileRate, params.animStagger);
        }
      }
    }

    if (matrixDirty) mesh.instanceMatrix.needsUpdate = true;
    if (motifDirty) motifAttr.needsUpdate = true;
    if (phaseDirty) phaseAttr.needsUpdate = true;
  });
}
