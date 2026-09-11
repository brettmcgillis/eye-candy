import React, { memo, useEffect, useMemo, useRef } from 'react';

import {
  attachLayerBuffers,
  createLayerBuffers,
  writeLayer,
} from '../utils/instances';

const MIN_CAPACITY = 64;

function nextCapacity(current, needed) {
  let capacity = Math.max(current, MIN_CAPACITY);

  while (capacity < needed) {
    capacity *= 2;
  }

  return capacity;
}

function InstancedLayer({
  buildMaterial,
  geometry,
  hasTint = false,
  instances,
}) {
  const meshRef = useRef(null);
  const capacityRef = useRef(0);

  // Headroom so a rolling rebuild that lands more cells in a district than
  // the first bake did reuses the same buffers instead of remounting.
  capacityRef.current = nextCapacity(
    capacityRef.current,
    Math.ceil(instances.length * 1.5)
  );

  const capacity = capacityRef.current;
  const buffers = useMemo(
    () => createLayerBuffers(capacity, hasTint),
    [capacity, hasTint]
  );
  const material = useMemo(
    () => buildMaterial(buffers),
    [buffers, buildMaterial]
  );

  useEffect(() => {
    attachLayerBuffers(geometry, buffers);
  }, [buffers, geometry]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    if (meshRef.current) {
      writeLayer(meshRef.current, buffers, instances);
    }
  }, [buffers, instances]);

  if (!instances.length) {
    return null;
  }

  return (
    <instancedMesh
      key={capacity}
      args={[geometry, material, capacity]}
      frustumCulled={false}
      ref={meshRef}
    />
  );
}

export default memo(InstancedLayer);
