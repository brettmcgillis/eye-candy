import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const dummy = new THREE.Object3D();

// Static obstacle spheres the flock steers around (boids-js
// BoidsController.computeObstacles — Floids has no equivalent, it's just a
// spherical habitat). Positions never change after spawn, but syncing them
// in useFrame (instead of a useEffect keyed on the sim rebuild) sidesteps
// any dependency-tracking subtlety for a cost too small to matter at these
// counts.
function Obstacles({ config, simRef }) {
  const meshRef = useRef(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: config.obstacleColor,
        roughness: 0.9,
      }),
    []
  );
  material.color.set(config.obstacleColor);

  useFrame(() => {
    const mesh = meshRef.current;
    const sim = simRef.current;
    if (!mesh || !sim) return;

    const { obstacleCount, obstaclePos, obstacleRadius } = sim;
    for (let i = 0; i < obstacleCount; i += 1) {
      const base = i * 3;
      dummy.position.set(
        obstaclePos[base],
        obstaclePos[base + 1],
        obstaclePos[base + 2]
      );
      dummy.scale.setScalar(obstacleRadius[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (config.obstacleCount <= 0) return null;

  return (
    <instancedMesh
      key={config.obstacleCount}
      ref={meshRef}
      args={[geometry, material, config.obstacleCount]}
      frustumCulled={false}
    />
  );
}

export default memo(Obstacles);
