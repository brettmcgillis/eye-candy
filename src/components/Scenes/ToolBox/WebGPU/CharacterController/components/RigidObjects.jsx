import React from 'react';

import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  RigidBody,
} from '@react-three/rapier';

import Label3D from './Label3D';

export default function RigidObjects() {
  return (
    <>
      <RigidBody position={[15, 1, 2]} mass={0.5}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15.1, 0, 2]} mass={0.5}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 0, 0]} colliders={false} mass={1}>
        <Label3D
          text="Mass: 1"
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={2}
        />
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 0, -2]} colliders={false} mass={3.375}>
        <Label3D
          text="Mass: 3.375"
          position={[0, 1.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={2}
        />
        <CuboidCollider args={[1.5 / 2, 1.5 / 2, 1.5 / 2]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 0, -5]} colliders={false} mass={8}>
        <Label3D
          text="Mass: 8"
          position={[0, 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={2}
        />
        <CuboidCollider args={[1, 1, 1]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody colliders={false} position={[15, 5, -10]} mass={1.24}>
        <Label3D
          text="Mass: 1.24"
          position={[0, 1.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={2}
        />
        <CylinderCollider args={[0.03, 2.5]} position={[0, 0.25, 0]} />
        <BallCollider args={[0.25]} />
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 0.2, 0.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
    </>
  );
}
