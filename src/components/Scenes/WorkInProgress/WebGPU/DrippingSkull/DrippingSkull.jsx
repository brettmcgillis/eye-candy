import React from 'react';

import CameraRig from '../../../../rigging/CameraRig';
import Lighting from './components/Lighting';
import Surface from './components/Surface';
import useSceneControls from './hooks/useSceneControls';

export default function DrippingSkull() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />

      <color attach="background" args={[config.bgColor]} />
      <fog attach="fog" args={[config.bgColor, 5, 16]} />

      <Lighting
        ambientIntensity={config.ambientIntensity}
        keyColor={config.keyColor}
        keyIntensity={config.keyIntensity}
        rimColor={config.rimColor}
        rimIntensity={config.rimIntensity}
      />

      <Surface config={config} />

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -3.5, 0]}>
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
