import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import { CrtChannelPanels, CrtStageFloor } from './CrtPanelParts';

export default function CrtToolboxScene({ panels }) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 9.5, 12.5]}
        fov={42}
        near={0.1}
        far={100}
      />
      <OrbitControls
        makeDefault
        minDistance={6}
        maxDistance={22}
        target={[0, 0, 0]}
      />

      <color attach="background" args={['#020202']} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 7]} intensity={1.4} />
      <directionalLight position={[-6, 8, -6]} intensity={0.35} />
      <spotLight
        position={[0, 12, 0]}
        angle={0.55}
        intensity={1.6}
        penumbra={0.6}
      />

      <CrtStageFloor color="#070707" size={34} />
      <CrtChannelPanels panels={panels} />
    </>
  );
}
