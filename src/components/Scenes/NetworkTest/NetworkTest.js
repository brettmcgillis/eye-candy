import { folder, useControls } from 'leva';
import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Bret from 'components/elements/bret/Bret';
import NeuralNetwork from 'components/elements/network/NeuralNetwork';

export default function NetworkTest() {
  const rings = useControls('Neural Rings', {
    Ring: folder(
      {
        innerDiameter: { value: 3, min: 0, max: 30, step: 0.1 },
        outerDiameter: { value: 7, min: 1, max: 60, step: 0.1 },
        height: { value: 0.2, min: 0, max: 10, step: 0.05 },
      },
      { collapsed: true }
    ),

    Particles: folder(
      {
        particleCount: { value: 500, min: 10, max: 1000, step: 10 },
        maxParticleCount: { value: 1000, min: 100, max: 3000, step: 100 },
        pointSize: { value: 2.5, min: 0.5, max: 10, step: 0.1 },
        pointBlending: {
          value: 'normal',
          options: ['normal', 'additive', 'multiply', 'subtractive'],
        },
        pointsToneMapped: false,
        pointsTransparent: true,
        pointsOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: true }
    ),

    Connections: folder(
      {
        minConnections: { value: 1, min: 0, max: 64, step: 1 },
        maxConnections: { value: 8, min: 0, max: 64, step: 1 },
        minDistance: { value: 0.2, min: 0.2, max: 10, step: 0.01 },
        maxDistance: { value: 0.8, min: 0.2, max: 10, step: 0.01 },
        lineWidth: { value: 1, min: 0.1, max: 5, step: 0.1 },
        linesToneMapped: false,
        linesTransparent: true,
        linesOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
        lineBlending: {
          value: 'normal',
          options: ['normal', 'additive', 'multiply', 'subtractive'],
        },
      },
      { collapsed: true }
    ),

    Colors: folder(
      {
        pointColor: '#ff0000',
        lineColor: '#000000',
      },
      { collapsed: true }
    ),

    Time: folder(
      {
        timeScale: { value: 0.4, min: 0, max: 3, step: 0.01 },
        angularSpeed: { value: 0.53, min: -3, max: 3, step: 0.01 },
        radialSpeed: { value: 1, min: 0, max: 5, step: 0.01 },
        verticalSpeed: { value: 1, min: 0, max: 5, step: 0.01 },
        systemRotation: { value: 1, min: -2, max: 2, step: 0.01 },
      },
      { collapsed: true }
    ),
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[-5, 2, 4]} fov={50} />
      <ambientLight intensity={0.9} />
      <color attach="background" args={['#5b5b5b']} />
      <OrbitControls />
      <NeuralNetwork {...rings} />
      <Bret />
    </>
  );
}
