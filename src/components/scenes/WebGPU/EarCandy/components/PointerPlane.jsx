import React, { memo, useCallback } from 'react';

import useStage from '../hooks/useStage';

function PointerPlane({ onDown, onMove, onUp }) {
  const stage = useStage();

  const handleDown = useCallback(
    (event) => {
      event.stopPropagation();
      event.target.setPointerCapture(event.pointerId);
      onDown?.(event.point, event);
    },
    [onDown]
  );

  const handleMove = useCallback(
    (event) => onMove?.(event.point, event),
    [onMove]
  );

  const handleUp = useCallback(
    (event) => {
      event.target.releasePointerCapture?.(event.pointerId);
      onUp?.(event.point, event);
    },
    [onUp]
  );

  const handleContext = useCallback((event) => {
    event.nativeEvent.preventDefault();
  }, []);

  return (
    <mesh
      onContextMenu={handleContext}
      onPointerCancel={handleUp}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      position={[0, 0, -1]}
    >
      <planeGeometry args={[stage.width, stage.height]} />
      <meshBasicMaterial depthWrite={false} opacity={0} transparent />
    </mesh>
  );
}

export default memo(PointerPlane);
