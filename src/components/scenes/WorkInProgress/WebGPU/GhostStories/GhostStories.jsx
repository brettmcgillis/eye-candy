import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useState } from 'react';

import { Physics } from '@react-three/rapier';

import AudioToggleOverlay from '../../../../../app/scaffold/overlay/components/AudioToggleOverlay';
import TouchJoystickOverlay from '../../../../../modules/ecctrl/TouchJoystickOverlay';
import FogRig from './components/FogRig';
import Mountains from './components/Mountains';
import Player from './components/Player';
import SkyRig from './components/SkyRig';
import Water from './components/Water';
import World from './components/World';
import useNightSounds from './hooks/useNightSounds';
import useSceneControls from './hooks/useSceneControls';
import { createWorld } from './utils/worldgen';

// A playable night world: the cloth-sim ghost (from GhostBuster) drifts
// through an endless procedurally generated meadow — wind-blown grass that
// parts around it, worn paths threading between what will become abandoned
// settings, pooling height fog, fireflies, a starfield sky and an
// unreachable mountain range. Ecctrl owns character + camera; the world
// streams in chunks around the ghost.
export default function GhostStories() {
  const config = useSceneControls();

  // Shared per-frame player state: written once by Player, read by the
  // world streamer, grass-bend uniform, sky/mountain followers.
  const tracker = useMemo(
    () => ({
      ghostPosition: uniform(new THREE.Vector3(0, -100, 0)),
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(),
    }),
    []
  );

  const world = useMemo(
    () =>
      createWorld({
        hillAmplitude: config.hillAmplitude,
        hillFrequency: config.hillFrequency,
        pathDepth: config.pathDepth,
        pathEnabled: config.pathEnabled,
        pathFrequency: config.pathFrequency,
        pathWidth: config.pathWidth,
        seed: config.seed,
        valleyAmplitude: config.valleyAmplitude,
        valleyFrequency: config.valleyFrequency,
        waterLevel: config.waterLevel,
      }),
    [
      config.hillAmplitude,
      config.hillFrequency,
      config.pathDepth,
      config.pathEnabled,
      config.pathFrequency,
      config.pathWidth,
      config.seed,
      config.valleyAmplitude,
      config.valleyFrequency,
      config.waterLevel,
    ]
  );

  // Give the terrain colliders a beat to exist before gravity does.
  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPausedPhysics(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Ghost-themed joystick materials (EcctrlJoystick renders its own small
  // canvas without lights, so unlit materials only).
  const joystickProps = useMemo(
    () => ({
      joystickBaseProps: {
        material: new THREE.MeshBasicMaterial({
          color: '#1a1a2e',
          opacity: 0.35,
          transparent: true,
        }),
      },
      joystickStickProps: {
        material: new THREE.MeshBasicMaterial({
          color: '#44446a',
          opacity: 0.45,
          transparent: true,
        }),
      },
      joystickHandleProps: {
        material: new THREE.MeshBasicMaterial({
          color: '#f5f0e8',
          opacity: 0.8,
          transparent: true,
        }),
      },
    }),
    []
  );

  useNightSounds({
    ambienceVolume: config.ambienceVolume,
    frogVolume: config.frogVolume,
    tracker,
    windVolume: config.windVolume,
    world,
  });

  return (
    <>
      <TouchJoystickOverlay {...joystickProps} />
      <AudioToggleOverlay />

      <SkyRig config={config} tracker={tracker} />
      <FogRig config={config} />
      <Mountains config={config} tracker={tracker} world={world} />

      <Physics paused={pausedPhysics} timeStep={1 / 60} interpolate>
        <Player config={config} tracker={tracker} world={world} />
        <World config={config} tracker={tracker} world={world} />
        {/* Inside Physics: carries the water-surface collider. */}
        <Water config={config} tracker={tracker} world={world} />
      </Physics>
    </>
  );
}
