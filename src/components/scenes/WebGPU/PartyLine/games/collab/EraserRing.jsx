import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { RingGeometry } from 'three';

const SEGMENTS = 64;
const BORDER_PX = 1.5;
const Z = 19;

function EraserRing({ active, boardSize, localCursorRef, rectRef, width }) {
  const ref = useRef(null);
  const radius = ((width / 1000) * boardSize) / 2;
  const geometry = useMemo(
    () =>
      new RingGeometry(
        Math.max(0, radius - BORDER_PX / 2),
        radius + BORDER_PX / 2,
        SEGMENTS
      ),
    [radius]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const ring = ref.current;
    if (!ring) return;
    const local = localCursorRef.current;
    ring.visible = active && local.visible;
    if (!ring.visible) return;
    const [x, y] = rectRef.current.toWorld(local.u, local.v);
    ring.position.set(x, y, Z);
  });

  return (
    <mesh geometry={geometry} ref={ref} visible={false}>
      <meshBasicMaterial color="#000000" toneMapped={false} />
    </mesh>
  );
}

export default memo(EraserRing);
