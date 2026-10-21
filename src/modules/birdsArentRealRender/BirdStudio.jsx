import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import CursorTracker from '@elements/FakeBird/CursorTracker';
import FakeBird from '@elements/FakeBird/FakeBird';
import { flockBounds, layoutFlock } from '@modules/birdsArentReal';
import { Backdrop, ShadowFloor, StudioEnvironment } from '@modules/renderStage';
import Bloom from '@postprocessing/WebGPU/bloom/Bloom';

const DEG = Math.PI / 180;

function KeyLight({ bounds, config }) {
  const azimuth = config.lightAzimuth * DEG;
  const elevation = config.lightElevation * DEG;
  const reach = bounds.radius * 1.4 + 0.5;
  const distance = reach * 3;
  const [cx, cy, cz] = bounds.center;
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(cx, 0, cz);
  return (
    <>
      <primitive object={target} />
      <directionalLight
        castShadow
        intensity={config.keyIntensity}
        position={[
          cx + Math.cos(elevation) * Math.sin(azimuth) * distance,
          cy + Math.sin(elevation) * distance,
          cz + Math.cos(elevation) * Math.cos(azimuth) * distance,
        ]}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-reach}
        shadow-camera-far={distance * 2}
        shadow-camera-left={-reach}
        shadow-camera-near={0.1}
        shadow-camera-right={reach}
        shadow-camera-top={reach}
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.01}
        target={target}
      />
    </>
  );
}

// Every lens in the flock reads one world point. With `gaze: camera` it is
// the camera itself, written ahead of the birds' own frame callbacks so the
// heads aim at this frame's camera, not the last one's.
function CameraGaze({ targetRef }) {
  useFrame((state) => {
    targetRef.current.copy(state.camera.position);
  }, -1);
  return null;
}

// FakeBirds on a blank backdrop under GhostBuster's studio and a key light
// that casts onto a shadow-catching floor: what BirdsArentRealCLI renders
// headlessly and its Live tab renders in the page. `config` is a
// generation (location, flock, bird, pose); `flockRef` reaches the group
// whose children are the birds, for capture; `stareAtCursor` turns every
// lens toward the pointer (the scene's Cursor Follow).
export default function BirdStudio({
  config,
  flockRef,
  stareAtCursor = false,
}) {
  const birds = useMemo(
    () => layoutFlock(config),
    [
      config.arrangement,
      config.birdCount,
      config.facing,
      config.flockSeed,
      config.headingJitter,
      config.scatter,
      config.spacing,
    ]
  );
  const bounds = useMemo(() => flockBounds(birds), [birds]);
  const targetRef = useRef(new THREE.Vector3());
  const staring = stareAtCursor || config.gaze === 'camera';
  const sweepRange = config.gaze === 'sweep' ? config.sweepRange : 0;

  return (
    <>
      <Backdrop
        color={
          config.backdrop === 'transparent' ? null : config.backgroundColor
        }
      />
      <StudioEnvironment intensity={config.envIntensity} />
      <ambientLight intensity={config.ambientIntensity} />
      <KeyLight bounds={bounds} config={config} />
      {config.floor === 'shadow' ? (
        <ShadowFloor
          opacity={config.shadowOpacity}
          size={bounds.radius * 8 + 10}
        />
      ) : null}

      {stareAtCursor ? (
        <CursorTracker enabled focus={bounds.center} targetRef={targetRef} />
      ) : null}
      {!stareAtCursor && staring ? <CameraGaze targetRef={targetRef} /> : null}

      <group ref={flockRef}>
        {birds.map((bird) => (
          <group
            key={bird.key}
            position={bird.position}
            rotation-y={bird.rotationY}
          >
            <FakeBird
              aimAtCursor={staring}
              animate={config.animate}
              behavior="idle"
              camScale={config.headScale}
              cursorTargetRef={targetRef}
              ledBlink={config.ledBlink}
              phase={bird.phase}
              species={config.species}
              sweepRange={sweepRange}
              sweepSpeed={config.sweepSpeed}
            />
          </group>
        ))}
      </group>

      {config.bloom ? (
        <Bloom
          strength={config.bloomStrength}
          threshold={config.bloomThreshold}
        />
      ) : null}
    </>
  );
}
