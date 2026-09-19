import React, { useMemo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Beacon from './components/Beacon';
import Corridor from './components/Corridor';
import Flashlight from './components/Flashlight';
import GreatRoom from './components/GreatRoom';
import LivingRoom from './components/LivingRoom';
import Post from './components/Post';
import Shaft from './components/Shaft';
import ShaftFloor from './components/ShaftFloor';
import useDirector from './hooks/useDirector';
import useFlares from './hooks/useFlares';
import useFlashlight from './hooks/useFlashlight';
import useMounted from './hooks/useMounted';
import useSceneControls from './hooks/useSceneControls';
import useSurfaces from './hooks/useSurfaces';
import useWalker from './hooks/useWalker';
import createWorld from './utils/world';

// The House of Leaves, walked: living room, the hallway that should not be
// there, the great room, the grand staircase, the floor, a hallway back, and
// the same living room again. The director drives the walker; the world
// chains the spaces lap by lap; whatever is within reach is drawn.
export default function HouseOfLeaves() {
  const config = useSceneControls();
  const world = useMemo(() => createWorld(config), [config.layoutKey]);
  const flashlight = useFlashlight(config);
  const flares = useFlares();
  const director = useDirector(config);
  const walker = useWalker(config, world, director);
  const surfaces = useSurfaces(config, walker);
  const mounted = useMounted(walker, world, config);

  const livingRoomMounted = (lap) =>
    mounted.some((zone) => zone.kind === 'livingRoom' && zone.lap === lap);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color args={['#000000']} attach="background" />
      <LightingRig lighting={config.lighting} />
      {config.beamEnabled && (
        <Flashlight config={config} flashlight={flashlight} />
      )}
      {mounted.map((zone) => {
        switch (zone.kind) {
          case 'livingRoom':
            return (
              <LivingRoom
                config={config}
                key={zone.id}
                material={surfaces.home}
                walker={walker}
                zone={zone}
              />
            );
          case 'corridor':
            return (
              <React.Fragment key={zone.id}>
                <Corridor
                  config={config}
                  flares={flares}
                  material={surfaces.stone}
                  walker={walker}
                  zone={zone}
                />
                {zone.role === 'return' && !livingRoomMounted(zone.lap + 1) && (
                  <Beacon
                    config={config}
                    flares={flares}
                    walker={walker}
                    zone={zone}
                  />
                )}
              </React.Fragment>
            );
          case 'greatRoom':
            return (
              <GreatRoom
                config={config}
                key={zone.id}
                material={surfaces.stone}
                walker={walker}
                world={world}
                zone={zone}
              />
            );
          case 'shaft':
            return (
              <Shaft
                config={config}
                flares={flares}
                key={zone.id}
                material={surfaces.stone}
                walker={walker}
                wallMaterial={surfaces.stone}
                zone={zone}
              />
            );
          case 'shaftFloor':
            return (
              <ShaftFloor
                config={config}
                key={zone.id}
                material={surfaces.stone}
                walker={walker}
                zone={zone}
              />
            );
          default:
            return null;
        }
      })}
      {config.postEnabled && (
        <Post config={config} flares={flares} flashlight={flashlight} />
      )}
    </>
  );
}
