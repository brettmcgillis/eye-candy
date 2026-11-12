/* eslint-disable react/no-array-index-key */
import React, { useEffect, useMemo } from 'react';

import * as THREE from 'three';

function Ring({
  innerRadius = 1,
  outerRadius = 2,
  color = 'black',
  metallic = false,
  paintSeed = 0,
  materialTransform = null,
  ...props
}) {
  const metalness = metallic ? 1 : 0;
  const roughness = metallic ? 0.3 : 1;

  const material = useMemo(() => {
    if (!materialTransform) return null;
    const original = new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      side: THREE.DoubleSide,
    });
    const transformed = materialTransform(original, paintSeed);
    original.dispose();
    return transformed;
  }, [color, metalness, roughness, materialTransform, paintSeed]);
  useEffect(() => () => material?.dispose(), [material]);

  return (
    <mesh {...props}>
      <ringGeometry args={[innerRadius, outerRadius, 150]} />
      {material ? (
        <primitive object={material} attach="material" />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

export default function Halo({
  innerRadius,
  rings,
  materialTransform = null,
  ...props
}) {
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
        paintSeed={index * 37.917 + 11}
        materialTransform={materialTransform}
        position={[0, 0, 0]}
      />
    );
  });

  return <group {...props}>{halos}</group>;
}
