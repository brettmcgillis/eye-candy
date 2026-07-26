import React, { useRef } from 'react';

import { Physics } from '@react-three/rapier';

import { CameraRig } from '../../../../../modules/cameraRig';
import { LightingRig } from '../../../../../modules/lightingRig';
import ButtonOverlay from './components/ButtonOverlay';
import FactoryBuilding from './components/FactoryBuilding';
import GrassField from './components/GrassField';
import ProceduralWindows from './components/ProceduralWindows';
import RockProjectiles from './components/RockProjectiles';
import SceneEnvironment from './components/SceneEnvironment';
import Terrain from './components/Terrain';
import useCollisionAudio from './hooks/useCollisionAudio';
import useSceneControls from './hooks/useSceneControls';
import useWindowRuntime from './hooks/useWindowRuntime';

// Orbit limits (min/max distance, polar/azimuth angle) live in the Camera
// > Orbit Leva folder, seeded from presets/presets.js — they pin the view low
// and to one face of the building: no going over the top, no dropping below
// the horizon into the ground, no swinging around the back.
const ORBIT_CONTROLS_PROPS = {
  enablePan: false,
};

export default function WindowBreaker() {
  const {
    camera,
    lighting,
    environment,
    terrain,
    grass,
    building,
    windows,
    rocks,
    debug,
  } = useSceneControls();
  const terrainMeshRef = useRef(null);
  const wallMeshesRef = useRef([]);
  const paneMeshesRef = useRef({});
  // World positions of rocks currently at rest in the grass; RockProjectiles
  // fills it, GrassField reads it to bend blades out of the way.
  const disturbersRef = useRef([]);
  const runtime = useWindowRuntime();
  const playImpact = useCollisionAudio();

  return (
    <>
      <SceneEnvironment environment={environment} />
      <CameraRig camera={camera} orbitControlsProps={ORBIT_CONTROLS_PROPS} />
      <LightingRig lighting={lighting} />

      <Physics
        debug={debug.showRapierDebug}
        gravity={[0, -rocks.gravity, 0]}
        interpolate
        timeStep={1 / 60}
      >
        <Terrain terrain={terrain} colliderRef={terrainMeshRef} />

        <FactoryBuilding building={building} wallMeshesRef={wallMeshesRef}>
          <ProceduralWindows
            windows={windows}
            runtime={runtime}
            paneMeshesRef={paneMeshesRef}
          />
        </FactoryBuilding>

        <RockProjectiles
          rocks={rocks}
          runtime={runtime}
          paneMeshesRef={paneMeshesRef}
          wallMeshesRef={wallMeshesRef}
          disturbersRef={disturbersRef}
          playImpact={playImpact}
        />
      </Physics>

      <GrassField
        terrain={terrain}
        grass={grass}
        disturbersRef={disturbersRef}
      />

      <ButtonOverlay />
    </>
  );
}
