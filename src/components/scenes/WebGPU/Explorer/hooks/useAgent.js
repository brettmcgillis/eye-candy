import { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import { createAgent, stepAgent } from '../utils/agent';
import { agentParams, toWorld } from '../utils/frame';

const MAX_STEP = 1 / 30;

// React runs a parent's layout effects after its children's, so this hook's
// useFrame always subscribes last — every consumer reads the same one-frame-old
// world position, which is what keeps the light, the sphere and the camera
// agreeing with each other. Do not give any of them a non-zero priority to
// "fix" the ordering: that switches off R3F's automatic render entirely.
export default function useAgent(config) {
  const configRef = useRef(config);
  configRef.current = config;

  // Moving a spawn slider restarts the flight from the new point, which is
  // the only way to get the sphere out of a pocket it has settled into.
  const spawn = useMemo(
    () => new THREE.Vector3(config.spawnX, config.spawnY, config.spawnZ),
    [config.spawnX, config.spawnY, config.spawnZ]
  );
  const agent = useMemo(() => createAgent(spawn), [spawn]);
  const worldRef = useRef({
    heading: new THREE.Vector3(0, 0, 1),
    position: new THREE.Vector3(),
    speed: 0,
  });
  const pivot = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const c = configRef.current;
    pivot.set(c.pivotX, c.pivotY, c.pivotZ);

    if (c.agentRunning) {
      stepAgent(agent, Math.min(delta, MAX_STEP) * c.timeScale, agentParams(c));
    }

    const world = worldRef.current;
    toWorld(agent.position, pivot, c.worldScale, world.position);
    world.heading.copy(agent.heading);
    world.speed = agent.speed * c.worldScale;
  });

  return { agent, worldRef };
}
