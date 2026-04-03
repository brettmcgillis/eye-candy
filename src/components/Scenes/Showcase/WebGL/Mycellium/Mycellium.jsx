import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import MycelliumCloud from './components/MycelliumCloud';
import useMycelliumControls from './hooks/useMycelliumControls';
import useSceneControls from './hooks/useSceneControls';
import { CLOUD_A_DEFAULTS, CLOUD_B_DEFAULTS } from './utils/defaults';

export default function Mycellium() {
  const scene = useSceneControls();
  const [cloudA, setCloudA] = useMycelliumControls('Cloud A', CLOUD_A_DEFAULTS);
  const [cloudB, setCloudB] = useMycelliumControls('Cloud B', CLOUD_B_DEFAULTS);

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
      <MycelliumCloud config={cloudA} setConfig={setCloudA} />
      <MycelliumCloud config={cloudB} setConfig={setCloudB} />
    </>
  );
}
