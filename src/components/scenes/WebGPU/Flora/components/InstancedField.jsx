import React, { memo, useEffect, useMemo } from 'react';

function InstancedField({ buffers, createGeometry, createMaterial, uniforms }) {
  const geometry = useMemo(
    () => createGeometry(buffers),
    [buffers, createGeometry]
  );
  const material = useMemo(
    () => createMaterial(uniforms),
    [createMaterial, uniforms]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  if (!buffers.count) {
    return null;
  }

  return (
    <mesh
      castShadow
      frustumCulled={false}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
}

export default memo(InstancedField);
