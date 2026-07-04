import React from 'react';

import { Physics } from '@react-three/rapier';

import CameraRig from '../../../../rigging/CameraRig';
import CranePool from './components/CranePool';
import GIPostProcessing from './components/GIPostProcessing';
import PointerPusher from './components/PointerPusher';
import Room from './components/Room';
import RoomLighting from './components/RoomLighting';
import useInteractionState from './hooks/useInteractionState';
import useSceneControls from './hooks/useSceneControls';

// SSGI ball-pool riff: a flock of instanced, physics-driven paper cranes
// tumbling in a uniform-color diorama room, lit by a cursor-following point
// light and composited through a WebGPU SSGI + TRAA post pipeline so the
// bounced paper color visibly spreads across the walls.
export default function WhiteLies() {
  const config = useSceneControls();
  const interaction = useInteractionState();

  return (
    <>
      <CameraRig camera={config.camera} />

      <RoomLighting
        interaction={interaction}
        lightColor={config.lightColor}
        lightIntensity={config.lightIntensity}
      />

      <Physics timeStep={1 / 60}>
        <Room color={config.wallColor} roughness={config.wallRoughness} />

        <CranePool
          // drei's instanced-mesh buffer is allocated once at mount, sized
          // off the initial count — remount on count/scale change instead of
          // updating in place, or the buffer silently stays the old size.
          key={`${config.craneCount}-${config.craneScale}`}
          craneCount={config.craneCount}
          craneScale={config.craneScale}
          interaction={interaction}
          physics={{
            angularDamping: config.craneAngularDamping,
            friction: config.craneFriction,
            linearDamping: config.craneLinearDamping,
            mass: config.craneMass,
            pushRadius: config.pushRadius,
            pushStrength: config.pushStrength,
            restitution: config.craneRestitution,
          }}
        />

        <PointerPusher interaction={interaction} />
      </Physics>

      {config.ssgiEnabled && (
        <GIPostProcessing
          aoIntensity={config.aoIntensity}
          exposure={config.exposure}
          giIntensity={config.giIntensity}
          radius={config.radius}
          sliceCount={config.sliceCount}
          stepCount={config.stepCount}
          traaEnabled={config.traaEnabled}
        />
      )}
    </>
  );
}
