import * as THREE from 'three';

import React from 'react';

import BoundSkinnedMesh from './BoundSkinnedMesh';

export default function FurPointerSurface({
  onPointerDown,
  onPointerLeave,
  onPointerMove,
  showInteractionSurface = false,
  source,
}) {
  const useDebugWireframe = showInteractionSurface;
  const materialProps = {
    color: useDebugWireframe ? '#39ff96' : '#ffffff',
    depthTest: !useDebugWireframe,
    depthWrite: false,
    opacity: useDebugWireframe ? 0.95 : 0,
    polygonOffset: false,
    polygonOffsetFactor: 0,
    polygonOffsetUnits: 0,
    side: THREE.DoubleSide,
    transparent: true,
    wireframe: useDebugWireframe,
  };

  if (source.isSkinnedMesh && source.mesh) {
    return (
      <BoundSkinnedMesh
        frustumCulled={false}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        sourceMesh={source.mesh}
      >
        <meshBasicMaterial {...materialProps} />
      </BoundSkinnedMesh>
    );
  }

  return (
    <mesh
      geometry={source.geometry}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
    >
      <meshBasicMaterial {...materialProps} />
    </mesh>
  );
}
