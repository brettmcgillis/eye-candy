import React from 'react';

import { OrbitControls } from '@react-three/drei';

import AbandonedSetting from './components/AbandonedSetting';

export default function Abandoned() {
  return (
    <>
      <ambientLight intensity={0.01} />
      <OrbitControls />
      <AbandonedSetting />
    </>
  );
}
