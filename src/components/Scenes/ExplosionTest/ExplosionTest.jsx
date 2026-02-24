import * as THREE from 'three';

import React, { useRef } from 'react';

import { CameraControls, MeshTransmissionMaterial } from '@react-three/drei';

import ExplodableGroup from './ExplodableGroup';
import useExplosionTestControls from './useExplosionTestControls';

export default function ExplosionTest() {
  const latestResolvedSettingsRef = useRef({});
  const controls = useExplosionTestControls(latestResolvedSettingsRef);
  latestResolvedSettingsRef.current = controls;

  return (
    <>
      <CameraControls />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 6]} intensity={1.35} color="#ffffff" />
      <pointLight position={[0, 6, -10]} intensity={1} color="#ffffff" />

      <color attach="background" args={[controls.backgroundColor]} />

      <ExplodableGroup
        position={[
          controls.topExplodeX,
          controls.topExplodeY,
          controls.topExplodeZ,
        ]}
        explodeStrength={controls.explodeStrength}
        pointerRadius={controls.pointerRadius}
        falloff={controls.falloff}
        shakeAmount={controls.shakeAmount}
        shakeSpeed={controls.shakeSpeed}
        returnSpeed={controls.returnSpeed}
        motionBoost={controls.motionBoost}
        damping={controls.damping}
        showPointerRadiusDebug={controls.showPointerRadiusDebug}
      >
        <mesh position={[-2.4, 0, 0]}>
          <sphereGeometry args={[0.75, 64, 64]} />
          <meshStandardMaterial
            color={controls.secondColor}
            roughness={controls.secondRoughness}
            metalness={controls.secondMetalness}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0.2, 0.35, 0.1]}>
          <boxGeometry args={[1.25, 1.25, 1.25, 12, 12, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.78}
            metalness={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[2.4, 0, 0]} rotation={[-0.5, 0.4, 0]}>
          <planeGeometry args={[2.2, 1.6, 24, 18]} />
          <meshStandardMaterial
            color="#f4f4f4"
            roughness={0.72}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      </ExplodableGroup>

      <group position={[controls.glassX, controls.glassY, controls.glassZ]}>
        <mesh position={[-2.4, 0, 0]} scale={0.87}>
          <sphereGeometry args={[0.75, 64, 64]} />
          <MeshTransmissionMaterial
            color="#5ab6ff"
            transmission={0.98}
            thickness={0.42}
            roughness={0}
            ior={1.25}
            chromaticAberration={0.025}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0.2, 0.35, 0.1]} scale={0.87}>
          <boxGeometry args={[1.25, 1.25, 1.25, 12, 12, 12]} />
          <MeshTransmissionMaterial
            color="#ff8a8a"
            transmission={0.96}
            thickness={0.34}
            roughness={0}
            ior={1.22}
            chromaticAberration={0.022}
          />
        </mesh>
        <mesh position={[2.4, 0, -0.09]} rotation={[-0.5, 0.4, 0]} scale={0.9}>
          <planeGeometry args={[2.2, 1.6, 24, 18]} />
          <MeshTransmissionMaterial
            color="#8cf5c8"
            transmission={0.94}
            thickness={0.28}
            roughness={0}
            ior={1.2}
            chromaticAberration={0.02}
          />
        </mesh>
      </group>

      <ExplodableGroup
        position={[
          controls.lowerExplodeX,
          controls.lowerExplodeY,
          controls.lowerExplodeZ,
        ]}
        explodeStrength={controls.explodeStrength}
        pointerRadius={controls.pointerRadius}
        falloff={controls.falloff}
        shakeAmount={controls.shakeAmount}
        shakeSpeed={controls.shakeSpeed}
        returnSpeed={controls.returnSpeed}
        motionBoost={controls.motionBoost}
        damping={controls.damping}
        showPointerRadiusDebug={controls.showPointerRadiusDebug}
      >
        <mesh position={[-2.4, 0, 0]}>
          <sphereGeometry args={[0.75, 64, 64]} />
          <meshStandardMaterial
            color="#f6fdff"
            roughness={0.42}
            metalness={0.14}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0.2, 0.35, 0.1]}>
          <boxGeometry args={[1.25, 1.25, 1.25, 12, 12, 12]} />
          <meshStandardMaterial
            color="#fff2f2"
            roughness={0.38}
            metalness={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[2.4, 0, 0]} rotation={[-0.5, 0.4, 0]}>
          <planeGeometry args={[2.2, 1.6, 24, 18]} />
          <meshStandardMaterial
            color="#eefcf5"
            roughness={0.4}
            metalness={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </ExplodableGroup>
    </>
  );
}
