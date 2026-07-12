import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const dummy = new THREE.Object3D();
const scratchColor = new THREE.Color();

// Reads simRef.current — mutated by Swarm's step(), which mounts (and so
// subscribes its useFrame) after this component per React's bottom-up
// layout-effect order, meaning this always renders one frame behind the
// simulation. Same tradeoff as AttractorDebug's debugRef: invisible at
// frame rate, far simpler than fighting useFrame subscription order.
//
// Material color is left white — instanceColor alone carries the matte
// grey→glow lerp, so there's no material to keep in sync with the Leva
// color pickers on every render.
function FireflySwarm({ config, simRef }) {
  const meshRef = useRef(null);
  const bodyColorRef = useRef(new THREE.Color(config.bodyColor));
  const glowColorRef = useRef(new THREE.Color(config.glowColor));
  bodyColorRef.current.set(config.bodyColor);
  glowColorRef.current.set(config.glowColor);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 }),
    []
  );

  useFrame(() => {
    const mesh = meshRef.current;
    const sim = simRef.current;
    if (!mesh || !sim) return;

    const { flockCount, flockFlash, flockPos } = sim;
    const bodyColor = bodyColorRef.current;
    const glowColor = glowColorRef.current;

    for (let i = 0; i < flockCount; i += 1) {
      const base = i * 3;
      const flash = flockFlash[i];

      dummy.position.set(
        flockPos[base],
        flockPos[base + 1],
        flockPos[base + 2]
      );
      dummy.scale.setScalar(
        config.bodySize * (1 + flash * config.glowSizeBoost)
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      scratchColor.copy(bodyColor).lerp(glowColor, flash);
      mesh.setColorAt(i, scratchColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={config.fireflyCount}
      ref={meshRef}
      args={[geometry, material, config.fireflyCount]}
      frustumCulled={false}
    />
  );
}

export default memo(FireflySwarm);
