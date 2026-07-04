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
  const { texture, metalTexture, stamp, clear } = usePaintableSurface({
    dripEnabled,
    width,
    height,
  });
  const meshRef = useRef(null);

  // worldWidth lets PaintRig convert brush size (a fraction of this decal's
  // width) into meters for the cross-surface spray footprint (todo item 66).
  usePaintTarget({ meshRef, stamp, clear, kind: 'paint', worldWidth: width });

  // Standard (lit) material rather than the old unlit basic one: paint now
  // reacts to the sun/streetlight, and the synced metalnessMap makes the
  // metallic finish actually glint instead of just sparkle-texturing.
  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        metalnessMap={metalTexture}
        metalness={1}
        roughness={0.45}
        alphaMap={alphaMap}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </mesh>
  );
}

export default memo(PaintDecal);
