import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import IfftOcean from './components/IfftOcean';
import useSceneControls from './hooks/useSceneControls';

export default function RowItAloneWebGPU() {
  const config = useSceneControls();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={config.camera.position}
        fov={config.camera.fov}
        near={0.1}
        far={1000000}
      />
      <OrbitControls
        makeDefault
        target={config.camera.target}
        minDistance={config.camera.minDistance}
        maxDistance={config.camera.maxDistance}
        maxPolarAngle={Math.PI * 0.495}
      />

      <color attach="background" args={['#87ceeb']} />
      <IfftOcean config={config} />
    </>
  );
}
