import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three';

import { usePaintTarget } from '../../hooks/usePaintTargets';
import {
  createWheelDecalTexture,
  hueSatFromWheelUv,
  wheelUvFromHueSat,
} from '../../utils/decalTextures';
import { hsvToRgb, rgbToHsv } from '../../utils/sceneUtils';
import { createSectorGeometry, sectorPointFromUv } from './sectorGeometry';

// The full color wheel printed as a curved label on the can (todo item 41).
// The wheel image curves with the surface, but its pick math lives in the
// label's own uv space, so clicks map exactly to the printed gradient. The
// white dot mirrors the current color (including when the R/G/B sliders
// move it), positioned on the curved surface via the same uv mapping.
function WheelDecal({ arc, height, onChange, positionY, radius, rgb }) {
  const meshRef = useRef(null);
  const draggingRef = useRef(false);

  usePaintTarget({ meshRef, kind: 'ui' });

  const geometry = useMemo(
    () => createSectorGeometry({ arc, height, radius }),
    [arc, height, radius]
  );
  const texture = useMemo(() => createWheelDecalTexture(), []);
  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture]
  );

  const applyUv = useCallback(
    (uv) => {
      if (!uv) return;
      const picked = hueSatFromWheelUv(uv);
      if (!picked) return;
      onChange(hsvToRgb(picked.hue, picked.saturation, 1));
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      draggingRef.current = true;
      applyUv(e.uv);
    },
    [applyUv]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!draggingRef.current) return;
      e.stopPropagation();
      applyUv(e.uv);
    },
    [applyUv]
  );

  const handlePointerUp = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.target.releasePointerCapture(e.pointerId);
  }, []);

  const indicatorPosition = useMemo(() => {
    const { h, s } = rgbToHsv(rgb.r, rgb.g, rgb.b);
    return sectorPointFromUv({
      arc,
      height,
      lift: height * 0.02,
      radius,
      uv: wheelUvFromHueSat(h, s),
    });
  }, [arc, height, radius, rgb.b, rgb.g, rgb.r]);

  return (
    <group position={[0, positionY, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={indicatorPosition}>
        <sphereGeometry args={[height * 0.035, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default memo(WheelDecal);
