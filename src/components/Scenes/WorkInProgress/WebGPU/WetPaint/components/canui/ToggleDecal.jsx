import * as THREE from 'three';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { usePaintTarget } from '../../hooks/usePaintTargets';
import { createToggleDecalTexture } from '../../utils/decalTextures';
import { createSectorGeometry } from './sectorGeometry';

// Two-chip toggle label wrapped onto the can (e.g. spray texture
// CLEAN | SPLAT, todo item 51). Click left/right half to pick; the texture
// regenerates to move the highlight.
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
  const activeIndex = Math.max(0, values.indexOf(value));
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
      onChange(values[e.uv.x < 0.5 ? 0 : 1]);
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
