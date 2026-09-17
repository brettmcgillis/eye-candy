import React, { memo, useEffect, useMemo } from 'react';

function InstancedField({ createMaterial, slot, uniforms }) {
  const material = useMemo(
    () => createMaterial(uniforms),
    [createMaterial, uniforms]
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      castShadow
      frustumCulled={false}
      geometry={slot.geometry}
      material={material}
      receiveShadow
      ref={slot.attach}
    />
  );
}

export default memo(InstancedField);
