import { memo, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import { createBoom, stepBoom } from '../utils/chaseBoom';
import { fieldParams } from '../utils/frame';

function ChaseCamera({ agent, config, worldRef }) {
  const configRef = useRef(config);
  configRef.current = config;

  const camera = useThree((state) => state.camera);
  const boom = useMemo(createBoom, []);
  const lookRef = useRef(null);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((frame, delta) => {
    const c = configRef.current;
    const world = worldRef.current;
    const dt = Math.min(delta, 1 / 30);

    stepBoom(boom, agent.position, world.heading, c, fieldParams(c), dt);

    camera.position
      .copy(world.position)
      .addScaledVector(boom.dir, boom.length * c.worldScale);

    look
      .copy(world.position)
      .addScaledVector(world.heading, c.lookAhead * c.worldScale);
    if (!lookRef.current) lookRef.current = look.clone();
    lookRef.current.lerp(look, 1 - Math.exp(-4 * dt));
    camera.lookAt(lookRef.current);

    if (camera.fov !== c.followFov) {
      camera.fov = c.followFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

export default memo(ChaseCamera);
