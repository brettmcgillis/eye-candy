import React from 'react';

import ClothMesh from '../../../../../elements/webgpu/cloth/ClothMesh';

export default function Ribbon({
  attachPosition = [0, 0, 0],
  wind = 1.5,
  stiffness = 0.25,
  dampening = 0.98,
}) {
  return (
    <ClothMesh
      width={0.04}
      height={0.6}
      segmentsX={3}
      segmentsY={20}
      pinEdge="top"
      origin={attachPosition}
      gravity={0.00003}
      windFrequency={1.5}
      windAmplitude={0.00015}
      stepsPerSecond={360}
      wind={wind}
      windDirX={0}
      windDirZ={-1}
      stiffness={stiffness}
      dampening={dampening}
      sphereRadius={0.05}
      initialMaterial={{
        color: '#c43c3c',
        transparent: true,
        opacity: 0.9,
        sheen: 0.8,
        sheenRoughness: 0.4,
        sheenColor: '#ff8888',
        roughness: 0.5,
      }}
    />
  );
}
