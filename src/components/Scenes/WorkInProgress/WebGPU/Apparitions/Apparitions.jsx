import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Environment from './components/Environment';
import ParticleSystem from './components/ParticleSystem';
import useSceneControls from './hooks/useSceneControls';

export default function Apparitions() {
  const { controls, setControls } = useSceneControls();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0.5, -1]}
        fov={60}
        near={0.01}
        far={5}
      />
      <Environment controls={controls} />
      <OrbitControls
        makeDefault
        enableDamping
        enablePan
        autoRotate={controls.autoOrbit}
        autoRotateSpeed={controls.autoOrbitSpeed}
        minDistance={0.45}
        maxDistance={2}
        target={[0, 0.5, 0]}
      />
      <ParticleSystem controls={controls} setControls={setControls} />
    </>
  );
}
