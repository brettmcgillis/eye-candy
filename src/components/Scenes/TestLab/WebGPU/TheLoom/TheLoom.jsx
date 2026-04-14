import { folder, useControls } from 'leva';

import React, { useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import ClothMesh from '../../../../elements/webgpu/cloth/ClothMesh';

export default function TheLoom() {
  const clothRef = useRef();

  const shape = useControls('Cloth', {
    Shape: folder(
      {
        width: { value: 1.0, min: 0.1, max: 5, step: 0.1 },
        height: { value: 0.7, min: 0.1, max: 5, step: 0.1 },
        segmentsX: { value: 30, min: 4, max: 80, step: 1 },
        segmentsY: { value: 21, min: 4, max: 80, step: 1 },
        pinEdge: { value: 'left', options: ['left', 'top'] },
      },
      { collapsed: true }
    ),
  });

  const simulation = useControls('Cloth', {
    Simulation: folder(
      {
        wind: { value: 1.0, min: 0, max: 5, step: 0.01 },
        windDirX: { value: 1, min: -1, max: 1, step: 0.01 },
        windDirZ: { value: 0, min: -1, max: 1, step: 0.01 },
        stiffness: { value: 0.2, min: 0, max: 1, step: 0.01 },
        dampening: { value: 0.99, min: 0.9, max: 1, step: 0.001 },
        gravity: { value: 0.00005, min: 0, max: 0.001, step: 0.00001 },
        stepsPerSecond: { value: 360, min: 60, max: 720, step: 10 },
        maxVelocity: { value: 0.01, min: 0.001, max: 0.1, step: 0.001 },
        paused: false,
      },
      { collapsed: true }
    ),
  });

  const sphere = useControls('Cloth', {
    Sphere: folder(
      {
        sphereEnabled: { value: true, label: 'Enabled' },
        sphereRadius: { value: 0.12, min: 0.01, max: 0.5, step: 0.01 },
        sphereWireframe: { value: true, label: 'Wireframe' },
        sphereColor: { value: '#ff0000', label: 'Color' },
      },
      { collapsed: true }
    ),
  });

  const tatter = useControls('Cloth', {
    Tatter: folder(
      {
        tatterSeed: { value: 42, min: 0, max: 999, step: 1 },
        tatterScale: { value: 3, min: 0.1, max: 20, step: 0.1 },
        tatterEdge: { value: 0, min: 0, max: 1, step: 0.01 },
        tatterHoles: { value: 0, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: true }
    ),
  });

  const material = useControls('Cloth', {
    Material: folder(
      {
        color: { value: '#8866aa' },
        roughness: { value: 0.6, min: 0, max: 1, step: 0.01 },
        metalness: { value: 0.0, min: 0, max: 1, step: 0.01 },
        opacity: { value: 1, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: true }
    ),
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={50} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1} />
      <color attach="background" args={['#1a1a2e']} />
      <OrbitControls />
      <ClothMesh
        ref={clothRef}
        width={shape.width}
        height={shape.height}
        segmentsX={shape.segmentsX}
        segmentsY={shape.segmentsY}
        pinEdge={shape.pinEdge}
        gravity={simulation.gravity}
        stepsPerSecond={simulation.stepsPerSecond}
        maxVelocity={simulation.maxVelocity}
        wind={simulation.wind}
        windDirX={simulation.windDirX}
        windDirZ={simulation.windDirZ}
        stiffness={simulation.stiffness}
        dampening={simulation.dampening}
        paused={simulation.paused}
        sphereEnabled={sphere.sphereEnabled}
        sphereRadius={sphere.sphereRadius}
        sphereWireframe={sphere.sphereWireframe}
        sphereColor={sphere.sphereColor}
        tatterSeed={tatter.tatterSeed}
        tatterScale={tatter.tatterScale}
        tatterEdge={tatter.tatterEdge}
        tatterHoles={tatter.tatterHoles}
        materialProps={material}
      />
    </>
  );
}
