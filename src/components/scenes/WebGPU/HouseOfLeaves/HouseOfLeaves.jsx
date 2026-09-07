import React from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Corridor from './components/Corridor';
import Flashlight from './components/Flashlight';
import GreatRoom from './components/GreatRoom';
import Shaft from './components/Shaft';
import ShaftFloor from './components/ShaftFloor';
import VolumetricFog from './components/VolumetricFog';
import useFlares from './hooks/useFlares';
import useFlashlight from './hooks/useFlashlight';
import useSceneControls from './hooks/useSceneControls';
import useSurfaces from './hooks/useSurfaces';
import useWalker from './hooks/useWalker';

// The walkable House of Leaves: living room, the five and a half minute
// hallway, the great room, the grand staircase, and back.
//
// Currently the streaming spine and the darkness — an unbounded corridor and
// an unbounded descent, walked rather than driven, lit only by a carried lamp
// that reaches nowhere near the far wall. Everything either side of them is
// still to come; see plans/houseOfLeaves/house-of-leaves-scene.md.
export default function HouseOfLeaves() {
  const config = useSceneControls();
  const flashlight = useFlashlight(config);
  const flares = useFlares();
  // The walker owns the rebase and the rise reference the surfaces are pinned
  // to, so it has to resolve before they are built.
  const walker = useWalker(config);
  const surfaces = useSurfaces(config, walker);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color args={['#000000']} attach="background" />
      <LightingRig lighting={config.lighting} />
      {config.beamEnabled && (
        <Flashlight config={config} flashlight={flashlight} />
      )}
      {/* Which space is drawn follows the walker, not the control: once the
          journey is chaining, the zone it is standing in is the authority. */}
      {(walker.zoneId === 'corridor' || walker.zoneId === 'returnCorridor') && (
        <Corridor
          config={config}
          flares={flares}
          material={surfaces.stone}
          walker={walker}
        />
      )}
      {walker.zoneId === 'greatRoom' && (
        <GreatRoom config={config} material={surfaces.stone} walker={walker} />
      )}
      {walker.zoneId === 'shaft' && (
        <Shaft
          config={config}
          flares={flares}
          material={surfaces.stone}
          wallMaterial={surfaces.wall}
          walker={walker}
        />
      )}
      {walker.zoneId === 'shaftFloor' && (
        <ShaftFloor config={config} material={surfaces.stone} walker={walker} />
      )}
      {/* Mounting this takes over rendering, so it must unmount rather than
          idle when the volumetric is switched off. */}
      {config.fogEnabled && (
        <VolumetricFog
          config={config}
          flares={flares}
          flashlight={flashlight}
        />
      )}
    </>
  );
}
