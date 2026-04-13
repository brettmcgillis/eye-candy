import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Arrow from './components/Arrow';
import GrassPatch from './components/GrassPatch';
import Rabbit from './components/Rabbit';
import Ribbon from './components/Ribbon';
import useSceneControls from './hooks/useSceneControls';

// Arrow configs — several arrows protruding from the rabbit's hind/back area
// Matching the painting: arrows angle outward-right from the body, slightly fanned
const ARROWS = [
  {
    key: 'arrow-1',
    position: [0.05, 0.12, -0.02],
    rotation: [0.2, 0, -0.9],
    hasRibbon: false,
  },
  {
    key: 'arrow-2',
    position: [0.08, 0.15, 0.01],
    rotation: [0.1, 0.15, -0.75],
    hasRibbon: true, // this arrow carries the red ribbon
  },
  {
    key: 'arrow-3',
    position: [0.03, 0.1, -0.04],
    rotation: [-0.15, -0.1, -1.05],
    hasRibbon: false,
  },
  {
    key: 'arrow-4',
    position: [0.1, 0.08, 0.03],
    rotation: [0.3, 0.2, -0.6],
    hasRibbon: false,
  },
];

// Grass patches placed around the rabbit's feet — where it appears to nibble
const GRASS_PATCHES = [
  {
    key: 'grass-1',
    position: [-0.15, -0.18, 0.1],
    radius: 0.15,
    bladeCount: 120,
    cloverCount: 3,
    seed: 11,
  },
  {
    key: 'grass-2',
    position: [0.1, -0.18, 0.15],
    radius: 0.12,
    bladeCount: 90,
    cloverCount: 2,
    seed: 42,
  },
  {
    key: 'grass-3',
    position: [-0.05, -0.18, -0.12],
    radius: 0.1,
    bladeCount: 80,
    cloverCount: 2,
    seed: 73,
  },
];

// Ribbon attachment point relative to its arrow — sits near the fletching end
const RIBBON_ARROW = ARROWS.find((a) => a.hasRibbon);

export default function StayHunted() {
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
      <Rabbit position={[-0.1, -0.18, 0]} scale={0.3} />

      {/* Arrows protruding from the rabbit */}
      {ARROWS.map((arrow) => (
        <Arrow
          key={arrow.key}
          position={arrow.position}
          rotation={arrow.rotation}
        />
      ))}

      {/* Red ribbon on the designated arrow */}
      {RIBBON_ARROW && (
        <Ribbon
          attachPosition={[
            RIBBON_ARROW.position[0] + 0.35,
            RIBBON_ARROW.position[1] + 0.3,
            RIBBON_ARROW.position[2],
          ]}
          wind={wind}
          stiffness={stiffness}
          dampening={dampening}
        />
      )}

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
