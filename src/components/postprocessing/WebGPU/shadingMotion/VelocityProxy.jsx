import React, { memo, useEffect, useMemo, useRef } from 'react';

import { createPortal, useFrame } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createVelocityMaterial } from '@modules/tsl';

const worldPosition = new THREE.Vector3();

// Children are the target's geometry; velocity is its projected center's UV delta.
function VelocityProxy({ target, velocityScene, children }) {
  const proxyRef = useRef(null);
  const previousNdc = useRef(null);
  const velocity = useMemo(() => uniform(new THREE.Vector2()), []);
  const material = useMemo(() => createVelocityMaterial(velocity), [velocity]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const mesh = target.current;
    const proxy = proxyRef.current;
    if (!mesh || !proxy) return;

    mesh.updateWorldMatrix(true, false);
    mesh.getWorldPosition(worldPosition).project(state.camera);
    if (previousNdc.current) {
      velocity.value.set(
        (worldPosition.x - previousNdc.current.x) * 0.5,
        (worldPosition.y - previousNdc.current.y) * -0.5
      );
    } else {
      previousNdc.current = new THREE.Vector2();
      velocity.value.set(0, 0);
    }
    previousNdc.current.set(worldPosition.x, worldPosition.y);

    proxy.matrixAutoUpdate = false;
    proxy.matrix.copy(mesh.matrixWorld);
    proxy.matrixWorld.copy(mesh.matrixWorld);
  }, -1);

  return createPortal(
    <mesh ref={proxyRef} material={material}>
      {children}
    </mesh>,
    velocityScene
  );
}

export default memo(VelocityProxy);
