/* eslint-disable no-param-reassign */
import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

const DURATION = 1.4;

export default function useViewFraming({ heroScale, view, worldSize }) {
  const controls = useThree((state) => state.controls);
  const camera = useThree((state) => state.camera);
  const tween = useRef(null);

  useEffect(() => {
    if (!controls) return;

    const lab = view === 'lab';
    const target = new THREE.Vector3(0, lab ? heroScale * 0.45 : 0, 0);
    const distance = lab ? heroScale * 6 : worldSize * 2;
    const direction = camera.position.clone().sub(controls.target).normalize();

    tween.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      t: 0,
      toPosition: target.clone().add(direction.multiplyScalar(distance)),
      toTarget: target,
    };
  }, [camera, controls, heroScale, view, worldSize]);

  useFrame((_, delta) => {
    const active = tween.current;

    if (!active || !controls) return;

    active.t = Math.min(1, active.t + delta / DURATION);

    const k = active.t * active.t * (3 - 2 * active.t);

    camera.position.lerpVectors(active.fromPosition, active.toPosition, k);
    controls.target.lerpVectors(active.fromTarget, active.toTarget, k);
    controls.update();

    if (active.t >= 1) tween.current = null;
  });
}
