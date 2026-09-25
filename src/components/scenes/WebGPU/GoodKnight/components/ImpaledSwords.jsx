/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';

import { Matrix4 } from 'three';

import { bodyMatrix } from '../utils/boneDriver';
import Impalements, { CAPACITY } from '../utils/impalements';
import { placeSwords } from '../utils/swordPlacement';

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

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    counts.length = 0;
    blades.forEach(() => counts.push(0));
    impalements.records.forEach((record) => {
      const mesh = meshes[record.variant].current;
      if (!mesh) return;
      bodyMatrix(ragdoll.bodies[record.segment], m).multiply(record.local);
      const offset = Impalements.thrustOffset(record, now);
      if (offset) m.multiply(pullBack.makeTranslation(0, -offset, 0));
      mesh.setMatrixAt(counts[record.variant], m);
      counts[record.variant] += 1;
    });
    meshes.forEach(({ current }, i) => {
      if (!current) return;
      current.count = counts[i];
      current.instanceMatrix.needsUpdate = true;
    });
  });

  return blades.map((blade, i) => (
    <instancedMesh
      key={blade.name}
      ref={meshes[i]}
      args={[blade.geometry, blade.material, CAPACITY]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  ));
}

export default memo(ImpaledSwords);
