import React, { useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '@utils/appUtils';

import LowPolyFire from '../lowPolyFire/lowpolyFire';

const WHEEL_RADIUS = 0.9;
const FIRE_BASE_SCALE = 0.7;
const FIRE_BASE_ROTATION_Z = Math.PI;
const FIRE_SPIN_SPEED = 8;

export default function RcCar({
  steerAngleRef = null,
  forwardSpeedRef = null,
  sprintingRef = null,
  reversingRef = null,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile('/rc_toy_story.glb'));
  const frontLeftWheelRef = useRef(null);
  const frontRightWheelRef = useRef(null);
  const frontLeftWheelMeshRef = useRef(null);
  const frontRightWheelMeshRef = useRef(null);
  const rearLeftWheelRef = useRef(null);
  const rearRightWheelRef = useRef(null);
  const wheelSpinRef = useRef(0);
  const leftFireRef = useRef(null);
  const rightFireRef = useRef(null);
  const fireIntensityRef = useRef(0);
  const reverseLightMaterialRef = useRef(null);
  const reverseLightIntensityRef = useRef(0);

  useFrame((state, delta) => {
    const forwardSpeed = forwardSpeedRef?.current ?? 0;
    if (forwardSpeedRef) {
      wheelSpinRef.current -= (forwardSpeed / WHEEL_RADIUS) * delta;
    }

    const visualSteerAngle = steerAngleRef?.current ?? 0;
    if (frontLeftWheelRef.current) {
      frontLeftWheelRef.current.rotation.z = visualSteerAngle;
    }
    if (frontRightWheelRef.current) {
      frontRightWheelRef.current.rotation.z = visualSteerAngle;
    }

    const wheelSpin = wheelSpinRef.current;
    if (frontLeftWheelMeshRef.current) {
      frontLeftWheelMeshRef.current.rotation.x = wheelSpin;
    }
    if (frontRightWheelMeshRef.current) {
      frontRightWheelMeshRef.current.rotation.x = wheelSpin;
    }
    if (rearLeftWheelRef.current) {
      rearLeftWheelRef.current.rotation.x = wheelSpin;
    }
    if (rearRightWheelRef.current) {
      rearRightWheelRef.current.rotation.x = wheelSpin;
    }

    const speedFactor = Math.min(Math.abs(forwardSpeed) / 12, 1);
    const fireTarget = sprintingRef?.current ? speedFactor : 0;
    fireIntensityRef.current +=
      (fireTarget - fireIntensityRef.current) * Math.min(delta * 10, 1);

    const fireIntensity = fireIntensityRef.current;
    const flicker =
      0.92 +
      Math.sin(state.clock.elapsedTime * 28) * 0.08 +
      Math.sin(state.clock.elapsedTime * 47 + 0.7) * 0.05;
    const fireWidthScale = FIRE_BASE_SCALE * (0.65 + fireIntensity * 0.8);
    const fireLengthScale =
      FIRE_BASE_SCALE * (0.85 + fireIntensity * 1.8) * flicker;

    [leftFireRef.current, rightFireRef.current].forEach((fireGroup) => {
      const fireNode = fireGroup;
      if (!fireNode) return;

      fireNode.visible = fireIntensity > 0.02;
      if (!fireNode.visible) return;

      const spinDirection = fireNode === leftFireRef.current ? 1 : -1;
      const fireSpin =
        state.clock.elapsedTime *
        FIRE_SPIN_SPEED *
        fireIntensity *
        spinDirection;

      fireNode.rotation.y = fireSpin;
      fireNode.rotation.z = FIRE_BASE_ROTATION_Z;
      fireNode.scale.set(fireWidthScale, fireLengthScale, fireWidthScale);
    });

    const reverseLightTarget = reversingRef?.current ? 1 : 0;
    reverseLightIntensityRef.current +=
      (reverseLightTarget - reverseLightIntensityRef.current) *
      Math.min(delta * 12, 1);

    const reverseLightIntensity = reverseLightIntensityRef.current;
    if (reverseLightMaterialRef.current) {
      reverseLightMaterialRef.current.emissiveIntensity =
        reverseLightIntensity * 3.2;
    }
  });

  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.257}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.BODY_0.geometry}
          material={materials['000000000']}
        />
        <group ref={frontLeftWheelRef} position={[-3.15, 3.25, 0.45]}>
          <mesh
            ref={frontLeftWheelMeshRef}
            castShadow
            receiveShadow
            geometry={nodes.WHEEL_3_0.geometry}
            material={materials['000000000']}
          />
        </group>
        <group ref={frontRightWheelRef} position={[3.15, 3.25, 0.45]}>
          <mesh
            ref={frontRightWheelMeshRef}
            castShadow
            receiveShadow
            geometry={nodes.WHEEL_3_0_1.geometry}
            material={materials['000000000']}
          />
        </group>
        <mesh
          ref={rearLeftWheelRef}
          castShadow
          receiveShadow
          geometry={nodes.WHEEL_3_0_2.geometry}
          material={materials['000000000']}
          position={[-3.25, -4.95, 0.45]}
        />
        <mesh
          ref={rearRightWheelRef}
          castShadow
          receiveShadow
          geometry={nodes.WHEEL_3_0_3.geometry}
          material={materials['000000000']}
          position={[3.25, -4.95, 0.45]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.AERIAL_0.geometry}
          material={materials['000000000']}
          position={[2.4, -1.9, 7.35]}
          rotation={[-Math.PI, 0, -Math.PI]}
          scale={[1, 1, 17.5]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.AERIAL_T_0.geometry}
          material={materials['000000000']}
          position={[2.4, -1.9, 9.1]}
          rotation={[-Math.PI, 0, -Math.PI]}
          scale={[1, 1, 17.5]}
        />
        <group
          ref={leftFireRef}
          position={[-1.35, -6.25, 1.05]}
          rotation={[0, 0, FIRE_BASE_ROTATION_Z]}
          visible={false}
        >
          <LowPolyFire scale={FIRE_BASE_SCALE} />
        </group>
        <group
          ref={rightFireRef}
          position={[1.35, -6.25, 1.05]}
          rotation={[0, 0, FIRE_BASE_ROTATION_Z]}
          visible={false}
        >
          <LowPolyFire scale={FIRE_BASE_SCALE} />
        </group>
        <group position={[0, -6.18, 1.12]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.36, 0.16]} />
            <meshStandardMaterial
              ref={reverseLightMaterialRef}
              color="#641515"
              emissive="#ff3b3b"
              emissiveIntensity={0}
              metalness={0.15}
              roughness={0.25}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/rc_toy_story.glb'));
