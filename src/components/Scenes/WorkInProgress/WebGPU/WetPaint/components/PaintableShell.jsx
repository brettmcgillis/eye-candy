import React, { memo, useRef } from 'react';

import { usePaintTarget } from '../hooks/usePaintTargets';
import usePaintableSurface from '../hooks/usePaintableSurface';

// Generalizes UV painting to an arbitrary GLTF mesh: renders the SAME
// geometry a second time as a transparent overlay whose map is a paint
// canvas, and registers it as a paint target. Because the raycast hit's uv
// is the mesh's real UV, stamps land wherever the cursor touches the actual
// surface (streetlight pole, etc). Known limits, accepted for playground
// fidelity: a stamp can't wrap across UV seams, and stamp size varies with
// the model's UV texel density. Instanced meshes can't use this (all
// instances share one UV space) — walls/ground keep masked decals instead.
// Must be mounted so it inherits the exact transform of the source mesh
// (same parent, same local transform).
function PaintableShell({
  geometry,
  position,
  resolution = 512,
  rotation,
  scale,
}) {
  const { texture, metalTexture, stamp, clear } = usePaintableSurface({
    width: 1,
    height: 1,
    resolution,
  });
  const meshRef = useRef(null);

  usePaintTarget({ meshRef, stamp, clear, kind: 'paint' });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <meshStandardMaterial
        map={texture}
        metalnessMap={metalTexture}
        metalness={1}
        roughness={0.45}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </mesh>
  );
}

export default memo(PaintableShell);
