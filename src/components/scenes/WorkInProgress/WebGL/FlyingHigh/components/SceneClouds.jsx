import * as THREE from 'three';

import React from 'react';

import { Cloud, Clouds } from '@react-three/drei';

export default function SceneClouds({ clouds }) {
  return (
    <Clouds material={THREE.MeshBasicMaterial}>
      {clouds.map((c, i) => (
        <Cloud
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          position={c.position}
          scale={c.scale}
          speed={c.speed}
          opacity={c.opacity}
          width={c.width}
          depth={c.depth}
          segments={c.segments}
          color={c.color}
        />
      ))}
    </Clouds>
  );
}
