import React from 'react';

import { Environment } from '@react-three/drei';

import BusStop from '../../../../elements/Busstop/Busstop';
import Curb from '../../../../elements/Curb/Curb';
import ManholeCover from '../../../../elements/ManholeCover/ManholeCover';
import ParkTrashCan from '../../../../elements/ParkTrashCan/ParkTrashCan';
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
          {/* Curb / sidewalk slab at the origin. */}
          <Curb position={[0, 0, 0]} scale={config.curbScale} />
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
        </>
      )}

      {config.birds.map((b) => (
        <FakeBird
          key={b.key}
          species={config.birdType}
          behavior={config.behavior}
          animate={config.animate}
          position={b.position}
          rotation={[0, b.rotationY, 0]}
          phase={b.phase}
          sweepRange={config.sweepRange}
          sweepSpeed={config.sweepSpeed}
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
