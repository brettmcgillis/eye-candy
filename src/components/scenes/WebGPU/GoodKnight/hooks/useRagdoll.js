/* eslint-disable no-param-reassign */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

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
import { createStatue, followStatue, releaseStatue } from '../utils/statue';

export default function useRagdoll(
  rig,
  { damping, enabled, friction, linearDamping, pose }
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
    return () => {
      if (created.statue) world.removeRigidBody(created.statue.body);
      removeRagdoll(world, created);
    };
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

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const frictionRef = useRef(friction);
  frictionRef.current = friction;

  const setStatue = useCallback(
    (on) => {
      if (ragdoll.statue) {
        releaseStatue(world, rapier, ragdoll, ragdoll.statue);
        ragdoll.statue = null;
      }
      if (on)
        ragdoll.statue = createStatue(
          world,
          rapier,
          ragdoll,
          frictionRef.current
        );
    },
    [rapier, ragdoll, world]
  );

  useEffect(() => {
    if (ragdoll && enabled === Boolean(ragdoll.statue)) setStatue(!enabled);
  }, [enabled, ragdoll, setStatue]);

  const place = useCallback(
    (transforms, sleep) => {
      if (!ragdoll) return;
      setStatue(false);
      placeRagdoll(ragdoll, transforms);
      if (sleep) Object.values(ragdoll.bodies).forEach((body) => body.sleep());
      if (!enabledRef.current) setStatue(true);
      setGeneration((g) => g + 1);
    },
    [ragdoll, setStatue]
  );

  const reset = useCallback(() => {
    if (ragdoll) place(poseTransforms(ragdoll, pose), true);
  }, [place, pose, ragdoll]);

  const drop = useCallback(() => {
    if (ragdoll) place(solvePose(ragdoll.rig, pose.drop), false);
  }, [place, pose, ragdoll]);

  const capture = useCallback(
    () => (ragdoll ? captureRagdoll(ragdoll) : null),
    [ragdoll]
  );

  useLayoutEffect(reset, [reset]);

  useBeforePhysicsStep((w) => {
    if (!ragdoll) return;
    if (ragdoll.statue) followStatue(ragdoll, ragdoll.statue);
    else enforceJointLimits(ragdoll, w.timestep);
  });

  return { capture, drop, generation, ragdoll, reset };
}
