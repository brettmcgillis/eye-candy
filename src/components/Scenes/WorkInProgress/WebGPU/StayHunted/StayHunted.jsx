import React, { useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import ArrowAnchor from './components/ArrowAnchor';
import GrassPatch from './components/GrassPatch';
import Rabbit from './components/Rabbit';
import useSceneControls from './hooks/useSceneControls';

// Arrow anchors are authored in rabbit bone-local space so they stay embedded
// in the hindquarters throughout the eat-to-upright animation cycle.
const ARROWS = [
  {
    key: 'arrow-1',
    boneName: 'Pelvis_02',
    hasRibbon: false,
    localNormal: [0.44, -0.05, 0.9],
    localPosition: [-2.6, 2.25, -0.95],
  },
  {
    key: 'arrow-2',
    boneName: 'Pelvis_02',
    hasRibbon: true,
    localNormal: [0.18, 0.06, 0.98],
    localPosition: [-0.95, 2.85, -0.25],
  },
  {
    key: 'arrow-3',
    boneName: 'Pelvis_02',
    hasRibbon: false,
    localNormal: [-0.5, -0.08, 0.86],
    localPosition: [2.4, 2.05, -1.1],
  },
  {
    key: 'arrow-4',
    boneName: 'Pelvis_02',
    hasRibbon: false,
    localNormal: [-0.28, -0.18, 0.94],
    localPosition: [1.05, 1.65, -1.95],
  },
];

// Grass patches placed around the rabbit's feet — where it appears to nibble
const GRASS_PATCHES = [
  {
    key: 'grass-1',
    position: [-0.24, -0.18, 0.12],
    radius: 0.15,
    bladeCount: 120,
    cloverCount: 3,
    seed: 11,
  },
  {
    key: 'grass-2',
    position: [0.02, -0.18, 0.17],
    radius: 0.12,
    bladeCount: 90,
    cloverCount: 2,
    seed: 42,
  },
  {
    key: 'grass-3',
    position: [-0.12, -0.18, -0.16],
    radius: 0.1,
    bladeCount: 80,
    cloverCount: 2,
    seed: 73,
  },
  {
    key: 'grass-4',
    position: [0.08, -0.18, -0.05],
    radius: 0.11,
    bladeCount: 88,
    cloverCount: 2,
    seed: 101,
  },
  {
    key: 'grass-5',
    position: [-0.31, -0.18, -0.01],
    radius: 0.13,
    bladeCount: 96,
    cloverCount: 3,
    seed: 205,
  },
  {
    key: 'grass-6',
    position: [-0.04, -0.18, 0.28],
    radius: 0.12,
    bladeCount: 92,
    cloverCount: 2,
    seed: 319,
  },
];

export default function StayHunted() {
  const rabbitRef = useRef();
  const { wind, stiffness, dampening } = useSceneControls();

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 1.8]} fov={35} />
      <OrbitControls
        target={[0, 0.05, 0]}
        minDistance={0.8}
        maxDistance={4}
        enableDamping
      />

      {/* Soft warm lighting — ink wash painting feel */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={0.7} />
      <directionalLight position={[-2, 2, -1]} intensity={0.2} />

      {/* Warm parchment background */}
      <color attach="background" args={['#f5f0e0']} />

      {/* Rabbit — centered, sitting, slightly left */}
      <Rabbit ref={rabbitRef} position={[-0.1, -0.18, 0]} scale={0.01} />

      {/* Arrows stay pinned to the animated hind pose instead of scene space. */}
      {ARROWS.map((arrow) => (
        <ArrowAnchor
          key={arrow.key}
          boneName={arrow.boneName}
          embedDepth={0.01}
          hasRibbon={arrow.hasRibbon}
          localNormal={arrow.localNormal}
          localPosition={arrow.localPosition}
          rabbitRef={rabbitRef}
          ribbonDampening={dampening}
          ribbonStiffness={stiffness}
          ribbonWind={wind}
          scale={0.18}
        />
      ))}

      {/* Grass patches with red clover */}
      {GRASS_PATCHES.map((patch) => (
        <GrassPatch
          key={patch.key}
          position={patch.position}
          radius={patch.radius}
          bladeCount={patch.bladeCount}
          cloverCount={patch.cloverCount}
          seed={patch.seed}
        />
      ))}
    </>
  );
}
