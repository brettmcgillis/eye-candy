import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const dummy = new THREE.Object3D();

// Glossy black hunter sphere(s) — clearcoat so they read as predators next
// to the matte fireflies. See FireflySwarm's header comment for why reading
// simRef here (rather than owning the step) is fine.
function Hunters({ config, simRef }) {
  const meshRef = useRef(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        color: config.hunterColor,
        metalness: 0.1,
        roughness: 0.25,
      }),
    []
  );
  material.color.set(config.hunterColor);

  useFrame(() => {
    const mesh = meshRef.current;
    const sim = simRef.current;
    if (!mesh || !sim) return;

    const { hunterCount, hunterPos } = sim;
    for (let h = 0; h < hunterCount; h += 1) {
      const base = h * 3;
      dummy.position.set(
        hunterPos[base],
        hunterPos[base + 1],
        hunterPos[base + 2]
      );
      dummy.scale.setScalar(config.hunterSize);
      dummy.updateMatrix();
      mesh.setMatrixAt(h, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={config.hunterCount}
      ref={meshRef}
      args={[geometry, material, config.hunterCount]}
      frustumCulled={false}
    />
  );
}

export default memo(Hunters);
