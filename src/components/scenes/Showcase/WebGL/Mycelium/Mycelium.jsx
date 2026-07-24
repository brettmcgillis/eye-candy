import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import MyceliumCloud from './components/MyceliumCloud';
import useSceneControls from './hooks/useSceneControls';

export default function Mycelium() {
  const { scene, cloudA, setCloudA, cloudB, setCloudB } = useSceneControls();

  return (
    <>
      <color attach="background" args={[scene.background]} />
      <fog attach="fog" args={[scene.background, 0.015]} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={45} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        autoRotate={scene.autoRotate}
        autoRotateSpeed={scene.autoRotateSpeed}
      />
      <MyceliumCloud config={cloudA} setConfig={setCloudA} />
      <MyceliumCloud config={cloudB} setConfig={setCloudB} />
    </>
  );
}
