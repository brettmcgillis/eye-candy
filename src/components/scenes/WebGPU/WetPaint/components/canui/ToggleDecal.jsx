import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three';

import { usePaintTarget } from '../../hooks/usePaintTargets';
import {
  createToggleDecalTexture,
  toggleIndexFromUv,
} from '../../utils/decalTextures';
import { createSectorGeometry } from './sectorGeometry';

// Chip-row toggle label wrapped onto the can (e.g. the brush picker rows,
// todo items 51/71). Click a chip to pick; the texture regenerates to move
// the highlight.
function ToggleDecal({
  arc,
  height,
  labels,
  onChange,
  positionY,
  radius,
  value,
  values,
}) {
  const meshRef = useRef(null);

  usePaintTarget({ meshRef, kind: 'ui' });

  const geometry = useMemo(
    () => createSectorGeometry({ arc, height, radius }),
    [arc, height, radius]
  );
  // -1 (value lives on another row, e.g. the split brush picker) simply
  // highlights nothing.
  const activeIndex = values.indexOf(value);
  const texture = useMemo(
    () => createToggleDecalTexture({ options: labels, activeIndex }),
    [labels, activeIndex]
  );
  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture]
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      if (!e.uv) return;
      onChange(values[toggleIndexFromUv(e.uv, values.length)]);
    },
    [onChange, values]
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, positionY, 0]}
      onPointerDown={handlePointerDown}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

export default memo(ToggleDecal);
