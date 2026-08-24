import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three';

import { usePaintTarget } from '../../hooks/usePaintTargets';
import {
  createSliderDecalTexture,
  sliderUvFromValue,
  sliderValueFromUv,
} from '../../utils/decalTextures';
import { createSectorGeometry, sectorPointFromUv } from './sectorGeometry';

// One label-style settings slider wrapped onto the can (todo items 41/51).
// Input maps the sector's raycast uv straight to a 0..1 value. DoubleSide on
// the material keeps raycast hits registering even at glancing angles near
// the label's curved edges.
function SliderDecal({
  arc,
  height,
  label,
  onChange,
  positionY,
  radius,
  trackStops,
  value,
}) {
  const meshRef = useRef(null);
  const draggingRef = useRef(false);

  usePaintTarget({ meshRef, kind: 'ui' });

  const geometry = useMemo(
    () => createSectorGeometry({ arc, height, radius }),
    [arc, height, radius]
  );
  const texture = useMemo(
    () => createSliderDecalTexture({ label, trackStops }),
    [label, trackStops]
  );
  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture]
  );

  const applyUv = useCallback(
    (uv) => {
      if (uv) onChange(sliderValueFromUv(uv));
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

  const knobPosition = sectorPointFromUv({
    arc,
    height,
    lift: height * 0.06,
    radius,
    uv: { x: sliderUvFromValue(value), y: 0.37 },
  });

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
      <mesh position={knobPosition}>
        <sphereGeometry args={[height * 0.16, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default memo(SliderDecal);
