import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import useSceneControls from './hooks/useSceneControls';

export default function Ghosts() {
  const controls = useSceneControls();

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />
      <color attach="background" args={[controls.bgColor]} />
      <OrbitControls />
    </>
  );
}
