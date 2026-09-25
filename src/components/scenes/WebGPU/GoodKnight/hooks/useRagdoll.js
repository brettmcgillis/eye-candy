import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { useBeforePhysicsStep, useRapier } from '@react-three/rapier';

import {
  captureRagdoll,
  createRagdoll,
  enforceJointLimits,
  placeRagdoll,
  poseTransforms,
  removeRagdoll,
} from '../utils/ragdoll';
import { solvePose } from '../utils/skeleton';

export default function useRagdoll(
  rig,
  { damping, friction, linearDamping, pose }
) {
  const { rapier, world } = useRapier();
  const [ragdoll, setRagdoll] = useState(null);
  const [generation, setGeneration] = useState(0);

  useLayoutEffect(() => {
    const created = createRagdoll(world, rapier, rig, {
      damping,
      friction,
      linearDamping,
    });
    setRagdoll(created);
    return () => removeRagdoll(world, created);
  }, [rapier, rig, world]);

  useEffect(() => {
    if (!ragdoll) return;
    Object.values(ragdoll.bodies).forEach((body) => {
      body.setAngularDamping(damping);
      body.setLinearDamping(linearDamping);
      for (let i = 0; i < body.numColliders(); i += 1)
        body.collider(i).setFriction(friction);
    });
  }, [damping, friction, linearDamping, ragdoll]);

  const reset = useCallback(() => {
    if (!ragdoll) return;
    placeRagdoll(ragdoll, poseTransforms(ragdoll, pose));
    Object.values(ragdoll.bodies).forEach((body) => body.sleep());
    setGeneration((g) => g + 1);
  }, [pose, ragdoll]);

  const drop = useCallback(() => {
    if (!ragdoll) return;
    placeRagdoll(ragdoll, solvePose(ragdoll.rig, pose.drop));
    setGeneration((g) => g + 1);
  }, [pose, ragdoll]);

  const capture = useCallback(
    () => (ragdoll ? captureRagdoll(ragdoll) : null),
    [ragdoll]
  );

  useLayoutEffect(reset, [reset]);

  useBeforePhysicsStep((w) => {
    if (ragdoll) enforceJointLimits(ragdoll, w.timestep);
  });

  return { capture, drop, generation, ragdoll, reset };
}
