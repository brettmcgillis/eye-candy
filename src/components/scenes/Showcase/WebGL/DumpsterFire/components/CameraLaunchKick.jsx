import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

// Runs before drei's OrbitControls update (priority -1) so we can peel off the
// previous frame's kick offset before the controls read the camera.
const RESTORE_PRIORITY = -2;
// Runs at the default priority; this component is mounted after the camera rig
// so its apply pass lands after the orbit/spline writers for the frame.
const APPLY_PRIORITY = 0;

const RECOIL_BACK = 0.22;
const JITTER = 0.06;

/**
 * Adds a short, decaying camera "kick" on each trash launch. The offset is
 * applied after every camera writer has run and stripped again before the next
 * frame's OrbitControls update, so it never corrupts the orbit/spline state.
 */
export default function CameraLaunchKick({
  enabled = true,
  strength = 1,
  duration = 0.18,
}) {
  const camera = useThree((state) => state.camera);
  const lastThrow = useTrashBlasterStore((state) => state.lastThrow);
  const enabledRef = useRef(enabled);
  const strengthRef = useRef(strength);
  const durationRef = useRef(duration);
  const traumaRef = useRef(0);
  const appliedRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const lastThrowIdRef = useRef(0);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    strengthRef.current = strength;
  }, [strength]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!lastThrow || lastThrow.id === lastThrowIdRef.current) {
      return;
    }

    lastThrowIdRef.current = lastThrow.id;

    if (!enabledRef.current) {
      return;
    }

    traumaRef.current = 1;
  }, [lastThrow]);

  useFrame(() => {
    const applied = appliedRef.current;

    if (applied.lengthSq() > 0) {
      camera.position.sub(applied);
      applied.set(0, 0, 0);
    }
  }, RESTORE_PRIORITY);

  useFrame((_, delta) => {
    if (traumaRef.current <= 0) {
      return;
    }

    const durationSeconds =
      durationRef.current > 0 ? durationRef.current : 1e-4;

    traumaRef.current = Math.max(
      0,
      traumaRef.current - delta / durationSeconds
    );

    const amplitude =
      traumaRef.current * traumaRef.current * strengthRef.current;

    if (amplitude <= 0) {
      return;
    }

    camera.getWorldDirection(directionRef.current);

    const offset = appliedRef.current;

    offset.copy(directionRef.current).multiplyScalar(-RECOIL_BACK * amplitude);
    offset.x += (Math.random() - 0.5) * JITTER * amplitude;
    offset.y += (Math.random() - 0.5) * JITTER * amplitude;
    camera.position.add(offset);
  }, APPLY_PRIORITY);

  return null;
}
