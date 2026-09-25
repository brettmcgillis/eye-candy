/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo, useState } from 'react';

import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';

import { Matrix4 } from 'three';

import { bodyMatrix } from '../utils/boneDriver';
import Impalements, { CAPACITY } from '../utils/impalements';
import { placeSwords } from '../utils/swordPlacement';

const SLOT_STEP = 8;
const hidden = new Matrix4().makeScale(0, 0, 0);
const m = new Matrix4();
const pullBack = new Matrix4();
const counts = [];

function ImpaledSwords({
  blades,
  generation,
  impalementsRef,
  placement,
  ragdoll,
  rig,
  swordColliders,
  torsoTargets,
}) {
  const { rapier, world } = useRapier();

  const impalements = useMemo(
    () => new Impalements(world, rapier, ragdoll, blades),
    [blades, ragdoll, rapier, world]
  );

  useEffect(() => {
    impalementsRef.current = impalements;
    return () => {
      impalements.dispose();
      impalementsRef.current = null;
    };
  }, [impalements, impalementsRef]);

  useEffect(() => {
    impalements.place(placeSwords(torsoTargets, blades, placement), rig);
  }, [blades, impalements, placement, rig, torsoTargets]);

  useEffect(
    () => impalements.setColliders(swordColliders),
    [impalements, swordColliders]
  );

  useEffect(() => impalements.clearStabs(), [generation, impalements]);

  const meshes = useMemo(() => blades.map(() => ({ current: null })), [blades]);
  const [sizes, setSizes] = useState(() => blades.map(() => SLOT_STEP));

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    counts.length = 0;
    blades.forEach(() => counts.push(0));
    impalements.records.forEach((record) => {
      const mesh = meshes[record.variant].current;
      const slot = counts[record.variant];
      counts[record.variant] += 1;
      if (!mesh || slot >= mesh.count) return;
      bodyMatrix(ragdoll.bodies[record.segment], m).multiply(record.local);
      const offset = Impalements.thrustOffset(record, now);
      if (offset) m.multiply(pullBack.makeTranslation(0, -offset, 0));
      mesh.setMatrixAt(slot, m);
    });
    meshes.forEach(({ current }, i) => {
      if (!current) return;
      for (let slot = counts[i]; slot < current.count; slot += 1)
        current.setMatrixAt(slot, hidden);
      current.instanceMatrix.needsUpdate = true;
    });
    if (counts.some((count, i) => count > sizes[i]))
      setSizes(
        sizes.map((size, i) =>
          Math.min(
            CAPACITY,
            Math.max(size, Math.ceil(counts[i] / SLOT_STEP) * SLOT_STEP)
          )
        )
      );
  });

  // WebGPU sizes an instanced mesh's matrix buffer from `count` when the
  // shader first builds, so count never shrinks below the allocation: spare
  // slots are collapsed instead, and a full variant remounts one step larger.
  return blades.map((blade, i) => (
    <instancedMesh
      key={`${blade.name}-${sizes[i]}`}
      ref={meshes[i]}
      args={[blade.geometry, blade.material, sizes[i]]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  ));
}

export default memo(ImpaledSwords);
