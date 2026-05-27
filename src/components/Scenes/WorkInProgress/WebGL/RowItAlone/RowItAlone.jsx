import React, { Suspense } from 'react';

import { Physics } from '@react-three/rapier';

import BoatRig from './components/BoatRig';
import CursorCollider from './components/CursorCollider';
import OceanSurface from './components/OceanSurface';
import SceneEnvironment from './components/SceneEnvironment';
import useOceanRuntime from './hooks/useOceanRuntime';
import useSceneControls from './hooks/useSceneControls';

export default function RowItAlone() {
  const config = useSceneControls();
  const oceanRuntime = useOceanRuntime({
    interaction: config.interaction,
    ocean: config.ocean,
  });

  return (
    <>
      <SceneEnvironment
        fog={config.fog}
        scene={config.scene}
        sky={config.sky}
      />
      <Physics gravity={config.physics.gravity} interpolate timeStep={config.physics.timeStep}>
        <OceanSurface
          ocean={config.ocean}
          runtime={oceanRuntime}
          sun={{
            azimuth: config.sky.azimuth,
            color: config.scene.sunColor,
            elevation: config.sky.elevation,
            intensity: config.scene.sunIntensity,
          }}
        />
        <CursorCollider interaction={config.interaction} runtime={oceanRuntime} />
        <Suspense fallback={null}>
          <BoatRig
            boat={config.boat}
            oars={config.oars}
            physics={config.physics}
            runtime={oceanRuntime}
          />
        </Suspense>
      </Physics>
    </>
  );
}
