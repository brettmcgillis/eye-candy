import React from 'react';

import { RigidBody } from '@react-three/rapier';

const FLOOR_HALF_SIZE = 150;
const WALL_HEIGHT = 25;
const WALL_THICKNESS = 2;
const BOUNDARY_DISTANCE = FLOOR_HALF_SIZE - WALL_THICKNESS / 2;
const WALL_LENGTH = FLOOR_HALF_SIZE * 2;

export default function Boundaries({ gridSectionColor }) {
  const wallColor = gridSectionColor || '#d9d9d9';

  return (
    <group>
      <RigidBody type="fixed">
        <mesh
          receiveShadow
          position={[0, WALL_HEIGHT / 2 - 1.01, -BOUNDARY_DISTANCE]}
        >
          <boxGeometry args={[WALL_LENGTH, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh
          receiveShadow
          position={[0, WALL_HEIGHT / 2 - 1.01, BOUNDARY_DISTANCE]}
        >
          <boxGeometry args={[WALL_LENGTH, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh
          receiveShadow
          position={[-BOUNDARY_DISTANCE, WALL_HEIGHT / 2 - 1.01, 0]}
        >
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, WALL_LENGTH]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh
          receiveShadow
          position={[BOUNDARY_DISTANCE, WALL_HEIGHT / 2 - 1.01, 0]}
        >
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, WALL_LENGTH]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </RigidBody>
    </group>
  );
}
