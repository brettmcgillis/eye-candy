import React, { Suspense } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Physics } from '@react-three/rapier';

import BoatRig from './components/BoatRig';
import SceneLighting from './components/SceneLighting';
import useIfftOceanRuntime from './hooks/useIfftOceanRuntime';
import useSceneControls from './hooks/useSceneControls';

export default function RowItAloneWebGPU() {
  const config = useSceneControls();
  const { runtimeRef, sampler } = useIfftOceanRuntime(config);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={config.camera.position}
        fov={config.camera.fov}
        near={0.1}
        far={1000000}
      />
      <OrbitControls
        makeDefault
        target={config.camera.target}
        minDistance={config.camera.minDistance}
        maxDistance={config.camera.maxDistance}
        maxPolarAngle={Math.PI * 0.495}
      />

      <color attach="background" args={['#87ceeb']} />

      <SceneLighting lighting={config.lighting} runtimeRef={runtimeRef} />

      <Physics
        gravity={config.physics.gravity}
        interpolate
        paused={!sampler}
        timeStep={config.physics.timeStep}
      >
        <Suspense fallback={null}>
          <BoatRig
            boat={config.boat}
            oars={config.oars}
            physics={config.physics}
            runtimeRef={runtimeRef}
            sampler={sampler}
          />
        </Suspense>
      </Physics>
    </>
  );
}
