import React from 'react';

import { Physics } from '@react-three/rapier';

import AssetShowcaseGrid from './components/AssetShowcaseGrid';
import SceneEnvironment from './components/SceneEnvironment';

export default function TrashCollector() {
  return (
    <>
      <SceneEnvironment />
      <Physics timeStep={1 / 60} interpolate>
        <AssetShowcaseGrid />
      </Physics>
    </>
  );
}
