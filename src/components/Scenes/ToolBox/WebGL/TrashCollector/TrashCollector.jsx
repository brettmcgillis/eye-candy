import React from 'react';

import { Physics } from '@react-three/rapier';

import AssetShowcaseGrid from './AssetShowcaseGrid';
import SceneEnvironment from './SceneEnvironment';

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
