/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React from 'react';

function Ring({
  innerRadius = 1,
  outerRadius = 2,
  color = 'black',
  metallic = false,
  ...props
}) {
  const metalness = metallic ? 1 : 0;
  const roughness = metallic ? 0.3 : 1;

  return (
    <mesh {...props}>
      <ringGeometry args={[innerRadius, outerRadius, 150]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function Halo({ innerRadius, rings, ...props }) {
  let ir = innerRadius;
  const halos = rings.map((ring, index) => {
    const inner = ir;
    const outer = ir + ring.width;
    ir = outer;
    return (
      <Ring
        key={`ring-${index}`}
        innerRadius={inner}
        outerRadius={outer}
        color={ring.color}
        metallic={ring.metallic}
        position={[0, 0, 0]}
      />
    );
  });

  return <group {...props}>{halos}</group>;
}
