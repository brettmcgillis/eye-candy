import { Html } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  RigidBody,
} from '@react-three/rapier';

export default function RigidObjects() {
  return (
    <>
      <RigidBody position={[15, 1, 2]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15.1, 0, 2]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 0, 0]} colliders={false}>
        <Html center position={[0, 1, 0]}><span style={{ color: 'black', fontSize: '12px', whiteSpace: 'nowrap' }}>mass: 1</span></Html>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 0, -2]} colliders={false}>
        <Html center position={[0, 1.5, 0]}><span style={{ color: 'black', fontSize: '12px', whiteSpace: 'nowrap' }}>mass: 3.375</span></Html>
        <CuboidCollider args={[1.5 / 2, 1.5 / 2, 1.5 / 2]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 0, -5]} colliders={false}>
        <Html center position={[0, 2, 0]}><span style={{ color: 'black', fontSize: '12px', whiteSpace: 'nowrap' }}>mass: 8</span></Html>
        <CuboidCollider args={[1, 1, 1]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
      <RigidBody colliders={false} position={[15, 5, -10]}>
        <Html center position={[0, 1.5, 0]}><span style={{ color: 'black', fontSize: '12px', whiteSpace: 'nowrap' }}>mass: 1.24</span></Html>
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
