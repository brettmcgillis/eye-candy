import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import TvStage from './components/TvStage';
import useTvScene from './hooks/useTvScene';
import {
  RAISED_BY_TV_BACKGROUND,
  RAISED_BY_TV_CAMERA,
} from './utils/raisedByTvSceneConfig';

export default function RaisedByTV() {
  const { channels } = useTvScene();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={RAISED_BY_TV_CAMERA.position}
        near={RAISED_BY_TV_CAMERA.near}
        far={RAISED_BY_TV_CAMERA.far}
      />
      <OrbitControls
        makeDefault
        minDistance={RAISED_BY_TV_CAMERA.minDistance}
        maxDistance={RAISED_BY_TV_CAMERA.maxDistance}
      />

      <color attach="background" args={[RAISED_BY_TV_BACKGROUND]} />

      <TvStage channels={channels} />
    </>
  );
}
