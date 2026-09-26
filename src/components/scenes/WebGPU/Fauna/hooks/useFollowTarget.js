import { useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import { SNAPSHOT_STRIDE } from '@modules/fauna';

export default function useFollowTarget(store, frames, selectedId, inspected) {
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const slot = inspected?.id === selectedId ? inspected.slot : -1;
    const snapshot = frames.current.current;

    if (
      slot < 0 ||
      !snapshot ||
      snapshot[slot * SNAPSHOT_STRIDE + 7] !== selectedId
    ) {
      return;
    }

    const pose = store.pose.image.data;

    target.set(pose[slot * 4], pose[slot * 4 + 1], pose[slot * 4 + 2]);
  });

  return target;
}
