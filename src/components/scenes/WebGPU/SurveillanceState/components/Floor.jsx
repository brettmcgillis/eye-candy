import React, { memo, useEffect, useMemo } from 'react';

import {
  mix,
  mx_noise_float as mxNoise,
  positionWorld,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

function Floor({ floorColor }) {
  const tint = useMemo(() => uniform(new THREE.Color(floorColor)), []);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.92 });
    const { xz } = positionWorld;
    const stain = mxNoise(xz.mul(1.3)).mul(0.5).add(0.5);
    const grit = mxNoise(xz.mul(38)).mul(0.5).add(0.5);
    m.colorNode = tint.mul(mix(0.7, 1.15, stain)).mul(mix(0.9, 1.05, grit));
    m.roughnessNode = mix(0.75, 0.97, stain);
    return m;
  }, [tint]);

  useEffect(() => {
    tint.value.set(floorColor);
  }, [floorColor, tint]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[160, 160]} />
    </mesh>
  );
}

export default memo(Floor);
