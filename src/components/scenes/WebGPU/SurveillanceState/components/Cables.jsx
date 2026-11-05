import React, { memo, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import buildCableGeometry from '../utils/cableGeometry';

function Cables({ cables }) {
  const geometry = useMemo(() => buildCableGeometry(cables), [cables]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        roughness: 0.62,
        metalness: 0,
        vertexColors: true,
      }),
    []
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      castShadow
      geometry={geometry}
      key={geometry.uuid}
      material={material}
      receiveShadow
    />
  );
}

export default memo(Cables);
