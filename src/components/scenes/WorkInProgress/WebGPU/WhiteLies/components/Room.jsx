import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

import {
  ROOM_DEPTH,
  ROOM_HALF_DEPTH,
  ROOM_HALF_HEIGHT,
  ROOM_HALF_WIDTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  WALL_THICKNESS,
} from '../utils/sceneUtils';

// Every visible wall shares one material instance (uniform color) so the
// room reads as a single diorama box and WebGPU only compiles one wall
// shader. The front face has a collider but no mesh, leaving the box open
// toward the camera.
function useWallMaterial({ color, roughness }) {
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        metalness: 0,
      }),
    []
  );

  useEffect(() => {
    material.color.set(color);
    material.roughness = roughness;
  }, [material, color, roughness]);

  useEffect(() => () => material.dispose(), [material]);

  return material;
}

function Room({ color = '#e8e4da', roughness = 0.75 }) {
  const wallMaterial = useWallMaterial({ color, roughness });
  const t = WALL_THICKNESS;

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" friction={0.9} restitution={0.05}>
        <mesh receiveShadow material={wallMaterial} position={[0, -t / 2, 0]}>
          <boxGeometry args={[ROOM_WIDTH, t, ROOM_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* Ceiling */}
      <RigidBody type="fixed" friction={0.9} restitution={0.05}>
        <mesh
          receiveShadow
          material={wallMaterial}
          position={[0, ROOM_HEIGHT + t / 2, 0]}
        >
          <boxGeometry args={[ROOM_WIDTH, t, ROOM_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* Back wall */}
      <RigidBody type="fixed" friction={0.9} restitution={0.05}>
        <mesh
          receiveShadow
          material={wallMaterial}
          position={[0, ROOM_HALF_HEIGHT, -ROOM_HALF_DEPTH - t / 2]}
        >
          <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, t]} />
        </mesh>
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" friction={0.9} restitution={0.05}>
        <mesh
          receiveShadow
          material={wallMaterial}
          position={[-ROOM_HALF_WIDTH - t / 2, ROOM_HALF_HEIGHT, 0]}
        >
          <boxGeometry args={[t, ROOM_HEIGHT, ROOM_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" friction={0.9} restitution={0.05}>
        <mesh
          receiveShadow
          material={wallMaterial}
          position={[ROOM_HALF_WIDTH + t / 2, ROOM_HALF_HEIGHT, 0]}
        >
          <boxGeometry args={[t, ROOM_HEIGHT, ROOM_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* Front — invisible collider only, so the camera can see inside.
          No mesh here, so an explicit CuboidCollider is used instead of the
          usual mesh-derived auto-collider: RigidBody's auto-collider walks
          only *visible* children (traverseVisible), so an invisible mesh
          would silently produce no collider at all and leave the front of
          the box wide open. */}
      <RigidBody type="fixed" colliders={false} friction={0.9}>
        <CuboidCollider
          args={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, t / 2]}
          position={[0, ROOM_HALF_HEIGHT, ROOM_HALF_DEPTH + t / 2]}
        />
      </RigidBody>
    </group>
  );
}

export default memo(Room);
