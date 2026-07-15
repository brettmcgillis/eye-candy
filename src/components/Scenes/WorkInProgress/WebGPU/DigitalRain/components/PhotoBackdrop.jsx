import React, { memo, useMemo } from 'react';

import { Backdrop } from '@react-three/drei';

// The cloud "photographed" against a cyclorama-style sweep — deliberately
// scaled/positioned so its edges stay in frame (see todo.md) rather than
// filling the whole background, against an even-darker scene background
// (set alongside <color attach="background"> in the scene root) so the
// backdrop itself reads as a distinct, lit surface.
function PhotoBackdrop({ config }) {
  const position = useMemo(
    () => [
      config.backdropPosition.x,
      config.backdropPosition.y,
      config.backdropPosition.z,
    ],
    [config.backdropPosition]
  );
  const scale = useMemo(
    () => [
      config.backdropScale.x,
      config.backdropScale.y,
      config.backdropScale.z,
    ],
    [config.backdropScale]
  );

  return (
    <Backdrop
      floor={config.backdropFloor}
      segments={config.backdropSegments}
      scale={scale}
      position={position}
      receiveShadow
    >
      <meshStandardMaterial
        color={config.backdropColor}
        roughness={config.backdropRoughness}
        metalness={0}
      />
    </Backdrop>
  );
}

export default memo(PhotoBackdrop);
