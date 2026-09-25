import { useLayoutEffect } from 'react';

import { useRapier } from '@react-three/rapier';

import { WORLD_FRICTION } from '../presets/poses';
import { GROUP, groups } from '../utils/ragdoll';

// Raw fixed colliders with the same friction the poses were baked against.
export default function useStaticCollider(buildDesc, deps) {
  const { rapier, world } = useRapier();
  useLayoutEffect(() => {
    const collider = world.createCollider(
      buildDesc(rapier)
        .setFriction(WORLD_FRICTION)
        .setCollisionGroups(groups(GROUP.world, 0xffff))
    );
    return () => world.removeCollider(collider, true);
  }, [rapier, world, ...deps]);
}
