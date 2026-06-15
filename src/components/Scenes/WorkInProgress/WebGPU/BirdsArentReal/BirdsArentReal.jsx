import React from 'react';

import { Environment } from '@react-three/drei';

import BusStop from '../../../../elements/Busstop/Busstop';
import ManholeCover from '../../../../elements/ManholeCover/ManholeCover';
import Nest from '../../../../elements/Nest/Nest';
import ParkTrashCan from '../../../../elements/ParkTrashCan/ParkTrashCan';
import Sidewalks from '../../../../elements/Sidewalks/Sidewalks';
import CigaretteButts from '../../../../elements/cigaretteButts/CigaretteButts';
import { Litter, Litter2 } from '../../../../elements/litter/Litter';
import { NewsPaper2 } from '../../../../elements/newsPapers/NewsPapers';
import Bloom from '../../../../postprocessing/webGPU/bloom/Bloom';
import CameraRig from '../../../../rigging/CameraRig';
import FakeBird from './components/FakeBird';
import WetGround from './components/WetGround';
import useSceneControls from './hooks/useSceneControls';

const v3 = (o) => [o.x, o.y, o.z];

export default function BirdsArentReal() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />

      {/* When the city backdrop is on, Environment owns scene.background; otherwise
          fall back to a flat sky color. (A <color> here would clobber the skybox.) */}
      {!config.envBackground && (
        <color attach="background" args={[config.skyColor]} />
      )}
      <fog
        attach="fog"
        args={[config.fogColor, config.fogNear, config.fogFar]}
      />

      {/* City lighting + reflections (and, optionally, the city skybox). */}
      <Environment
        preset="city"
        environmentIntensity={config.envIntensity}
        background={config.envBackground}
      />

      <ambientLight
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />
      <directionalLight
        position={[8, 14, 6]}
        intensity={config.sunIntensity}
        color={config.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      <WetGround
        asphaltColor={config.asphaltColor}
        puddleColor={config.puddleColor}
        puddleScale={config.puddleScale}
        puddleAmount={config.puddleAmount}
        texScale={config.texScale}
        reflectStrength={config.reflectStrength}
        reflectTint={config.reflectTint}
        rippleScale={6}
        rippleStrength={0}
        rippleSpeed={0}
        roughDry={config.roughDry}
        roughWet={config.roughWet}
      />

      {config.showStreet && (
        <>
          {/* Assembled sidewalk block (4 curb slabs + edges + corners/ramps). */}
          <Sidewalks position={[0, 0, 0]} scale={config.curbScale} />
          {/* Bus stop shelter on top of the curb slab. */}
          <BusStop
            position={v3(config.busStopPos)}
            rotation={[0, config.busStopRotY, 0]}
            scale={config.busStopScale}
          />
          {/* Park trash can beside the bus stop. */}
          <ParkTrashCan
            position={v3(config.trashPos)}
            rotation={[0, config.trashRotY, 0]}
            scale={config.trashScale}
          />
          {/* Manhole cover on the asphalt in front of the curb. */}
          <ManholeCover
            position={v3(config.manholePos)}
            rotation={[0, config.manholeRotY, 0]}
            scale={config.manholeScale}
          />
          {/* Pigeon nest (sticks + 2 eggs) inside the bus shelter. */}
          <Nest
            position={v3(config.nestPos)}
            rotation={[0, config.nestRotY, 0]}
            scale={config.nestScale}
            eggScale={config.nestEggScale}
            egg1Pos={config.nestEgg1Pos}
            egg1Rot={config.nestEgg1Rot}
            egg2Pos={config.nestEgg2Pos}
            egg2Rot={config.nestEgg2Rot}
          />
          {/* Street litter scattered on the asphalt. */}
          <NewsPaper2
            position={v3(config.newspaper2Pos)}
            rotation={[0, config.newspaper2RotY, 0]}
            scale={config.newspaper2Scale}
          />
          <CigaretteButts
            position={v3(config.cigButtsPos)}
            rotation={[0, config.cigButtsRotY, 0]}
            scale={config.cigButtsScale}
          />
          <Litter
            position={v3(config.litter1Pos)}
            rotation={[0, config.litter1RotY, 0]}
            scale={config.litter1Scale}
          />
          <Litter2
            position={v3(config.litter2Pos)}
            rotation={[0, config.litter2RotY, 0]}
            scale={config.litter2Scale}
          />
        </>
      )}

      {config.birds.map((b) => (
        <FakeBird
          key={b.key}
          species={config.birdType}
          behavior={config.behavior}
          animate={b.animate ?? config.animate}
          position={b.position}
          rotation={b.rotation}
          phase={b.phase}
          sweepRange={b.still ? 0 : config.sweepRange}
          sweepSpeed={b.still ? 0 : config.sweepSpeed}
          ledBlink={config.ledBlink}
          camScale={config.camScale}
          camRot={config.camRot}
          camOffset={config.camOffset}
          ledOffset={config.ledOffset}
        />
      ))}

      {config.bloomEnabled && (
        <Bloom
          threshold={config.bloomThreshold}
          strength={config.bloomStrength}
          radius={config.bloomRadius}
        />
      )}
    </>
  );
}
