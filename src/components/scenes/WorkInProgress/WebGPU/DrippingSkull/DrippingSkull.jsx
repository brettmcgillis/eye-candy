import React from 'react';

import { Environment } from '@react-three/drei';

import { CameraRig } from '../../../../../modules/cameraRig';
import Lighting from './components/Lighting';
import LiquidSkull from './components/LiquidSkull';
import useSceneControls from './hooks/useSceneControls';

const FLOOR_Y = -2;

export default function DrippingSkull() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />

      <color attach="background" args={[config.bgColor]} />
      <fog attach="fog" args={[config.bgColor, 5, 16]} />

      {/* Glossy liquid lives and dies by what it reflects */}
      <Environment preset="city" environmentIntensity={config.envIntensity} />

      <Lighting
        ambientIntensity={config.ambientIntensity}
        keyColor={config.keyColor}
        keyIntensity={config.keyIntensity}
        rimColor={config.rimColor}
        rimIntensity={config.rimIntensity}
      />

      <LiquidSkull config={config} floorY={FLOOR_Y} />

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 0]}>
        <circleGeometry args={[8, 96]} />
        <meshStandardMaterial
          color="#0f1015"
          metalness={0.15}
          roughness={0.9}
        />
      </mesh>
    </>
  );
}
