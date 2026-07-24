import * as THREE from 'three/webgpu';

import React, { memo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { ROOM_HALF_DEPTH, ROOM_HEIGHT } from '../utils/sceneUtils';

const DEFAULT_TARGET = new THREE.Vector3(0, ROOM_HEIGHT * 0.7, ROOM_HALF_DEPTH);
const nextTarget = new THREE.Vector3();
const EASE_SPEED = 8;

// A soft key light plus a point light that eases toward the cursor, echoing
// the reference example's "mouse light" — it's what makes the SSGI bounce
// color visibly follow the pointer around the room.
function RoomLighting({ interaction, lightColor, lightIntensity }) {
  const pointLightRef = useRef(null);

  useFrame((_, delta) => {
    const light = pointLightRef.current;
    if (!light) return;

    const state = interaction.stateRef.current;
    nextTarget.set(
      state.pointerActive ? state.pointerX : DEFAULT_TARGET.x,
      state.pointerActive ? state.pointerY : DEFAULT_TARGET.y,
      state.pointerActive ? state.pointerZ : DEFAULT_TARGET.z
    );

    const easeFactor = 1 - Math.exp(-EASE_SPEED * Math.min(delta, 1 / 30));
    light.position.lerp(nextTarget, easeFactor);
  });

  return (
    <>
      <directionalLight
        castShadow
        intensity={0.6}
        position={[3, ROOM_HEIGHT + 2, 4]}
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.15} />
      <pointLight
        ref={pointLightRef}
        castShadow
        color={lightColor}
        decay={2}
        intensity={lightIntensity}
        position={DEFAULT_TARGET.toArray()}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

export default memo(RoomLighting);
