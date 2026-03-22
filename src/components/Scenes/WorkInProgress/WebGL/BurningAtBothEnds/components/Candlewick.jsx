import * as THREE from 'three';

import React, { useMemo } from 'react';

const wickProfile = new THREE.Shape();
wickProfile.absarc(0, 0, 0.0625, 0, Math.PI * 2);

export default function Candlewick({ position = [0, 0, 0], inverted = false }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, -0.0625),
      new THREE.Vector3(0.25, 0.5, 0.125),
    ]);

    const geo = new THREE.ExtrudeGeometry(wickProfile, {
      steps: 8,
      bevelEnabled: false,
      extrudePath: curve,
    });

    // vertex colors: yellow base → black mid → brown tip
    const { count } = geo.attributes.position;
    const colors = new Float32Array(count * 3);
    const black = new THREE.Color('black');
    const brown = new THREE.Color(0x994411);
    const yellow = new THREE.Color(0xffff44);

    for (let i = 0; i < count; i += 1) {
      const y = geo.attributes.position.getY(i);
      let c = black;
      if (y < 0.15) c = yellow;
      else if (y >= 0.4) c = brown;
      c.toArray(colors, i * 3);
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <mesh geometry={geometry}>
        <meshBasicMaterial vertexColors />
      </mesh>
    </group>
  );
}
