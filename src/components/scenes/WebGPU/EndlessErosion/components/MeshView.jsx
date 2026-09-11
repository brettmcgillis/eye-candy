import React, { memo, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import buildMeshMaterial from '../utils/meshMaterial';

// The grid is rotated at the geometry level rather than on the mesh, so local
// position is already the terrain's own XZ and the samplers need no axis
// bookkeeping to agree with the marched view.
function MeshView({ config, field, resolution, uniforms }) {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1, resolution, resolution);
    plane.rotateX(-Math.PI / 2);
    return plane;
  }, [resolution]);

  const material = useMemo(
    () => buildMeshMaterial({ field, uniforms }),
    [field, uniforms]
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  return (
    <>
      <mesh geometry={geometry} material={material} />
      {config.water && (
        <mesh position-y={config.waterHeight} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={config.waterColor}
            metalness={0.6}
            roughness={0.08}
          />
        </mesh>
      )}
      <directionalLight intensity={2.4} position={[-4, 2.6, 0.2]} />
      <ambientLight intensity={0.35} />
    </>
  );
}

export default memo(MeshView);
