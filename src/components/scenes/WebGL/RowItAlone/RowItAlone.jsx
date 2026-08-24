import React, { Suspense } from 'react';

import { Physics, useBeforePhysicsStep, useRapier } from '@react-three/rapier';

import BoatRig from './components/BoatRig';
import CursorCollider from './components/CursorCollider';
import OceanSurface from './components/OceanSurface';
import SceneEnvironment from './components/SceneEnvironment';
import useBoatMaskRenderPass from './hooks/useBoatMaskRenderPass';
import useOceanRuntime from './hooks/useOceanRuntime';
import useSceneControls from './hooks/useSceneControls';

function OceanRuntimePhysicsDriver({ runtime, timeStep }) {
  const { world } = useRapier();

  useBeforePhysicsStep(() => {
    if (typeof window !== 'undefined') {
      window.rowItAloneWorldGravity = world.gravity;
      window.rowItAloneWorldStats = {
        colliders: world.colliders.len(),
        rigidBodies: world.bodies.len(),
      };
    }

    runtime.advance(timeStep);
  });

  return null;
}

export default function RowItAlone() {
  const config = useSceneControls();
  const oceanRuntime = useOceanRuntime({
    interaction: config.interaction,
    ocean: config.ocean,
    stepMode: 'physics',
  });
  const boatMaskPass = useBoatMaskRenderPass({ runtime: oceanRuntime });

  return (
    <>
      <SceneEnvironment
        fog={config.fog}
        scene={config.scene}
        sky={config.sky}
      />
      <Physics
        gravity={config.physics.gravity}
        interpolate
        timeStep={config.physics.timeStep}
      >
        <OceanRuntimePhysicsDriver
          runtime={oceanRuntime}
          timeStep={config.physics.timeStep}
        />
        <OceanSurface
          maskDebug={config.boat.maskDebug}
          maskPass={boatMaskPass}
          ocean={config.ocean}
          runtime={oceanRuntime}
          sun={{
            azimuth: config.sky.azimuth,
            color: config.scene.sunColor,
            elevation: config.sky.elevation,
            intensity: config.scene.sunIntensity,
          }}
        />
        {!config.boat.hullOnlyProbe ? (
          <CursorCollider
            interaction={config.interaction}
            runtime={oceanRuntime}
          />
        ) : null}
        <Suspense fallback={null}>
          <BoatRig
            boat={config.boat}
            maskPass={boatMaskPass}
            oars={config.oars}
            physics={config.physics}
            runtime={oceanRuntime}
          />
        </Suspense>
      </Physics>
    </>
  );
}
