import React, { memo, useMemo } from 'react';

import * as THREE from 'three';

import { GRID } from '../utils/domain';

function DomainBounds({ color }) {
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(GRID, GRID, GRID)),
    []
  );

  return (
    <lineSegments geometry={geometry} position={[GRID / 2, GRID / 2, GRID / 2]}>
      <lineBasicMaterial color={color} transparent opacity={0.25} />
    </lineSegments>
  );
}

export default memo(DomainBounds);
