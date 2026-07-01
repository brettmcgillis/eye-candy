import React, { memo, useRef } from 'react';

import { usePaintTarget } from '../hooks/usePaintTargets';
import usePaintableSurface from '../hooks/usePaintableSurface';

// A flat, paintable plane laid over a surface (wall face, sidewalk top,
// asphalt). Standard PlaneGeometry carries a clean 0..1 UV, so PaintRig's
// raycast uv maps straight onto the canvas. Registers itself with the
// paint-target registry; PaintRig drives all stamping. `alphaMap` (optional)
// is the brick-gap mask so paint never shows through mortar joints — see
// WallSegment.jsx.
function PaintDecal({
  alphaMap,
  dripEnabled = true,
  height,
  position,
  rotation,
  width,
}) {
  const { texture, stamp, clear } = usePaintableSurface({
    dripEnabled,
    width,
    height,
  });
  const meshRef = useRef(null);

  usePaintTarget({ meshRef, stamp, clear, kind: 'paint' });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        alphaMap={alphaMap}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
        toneMapped={false}
      />
    </mesh>
  );
}

export default memo(PaintDecal);
