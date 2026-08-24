import { useCallback, useEffect, useRef } from 'react';

import * as THREE from 'three/webgpu';

// Shared pointer-drag mechanics for both GravityArrow styles (vector
// polygon and road-sign texture) — the rotate-the-arrow-like-a-clock-hand
// interaction is identical regardless of which mesh renders it, only the
// geometry/material differ (see arrowShapes.js / signVariants.js).
//
// event.point (the raycast hit) is only fresh while the ray is actually
// still intersecting the mesh. Once the pointer is captured (see
// handlePointerDown below), r3f keeps delivering move events for pointer
// positions that no longer hit the arrow's shape, but for those events it
// pads `event.point` in from the *original* intersection it cached when
// capture started (see @react-three/fiber's events.ts: captured pointers
// get `captureData.intersection` re-injected verbatim, and a native
// PointerEvent has no `.point` to override it with). So event.point
// silently freezes the instant the cursor drifts off the shape, the angle
// stops updating, and the next real hit snaps it back to reality — that
// was the "goes slow, works a bit; snaps back otherwise" bug.
// event.unprojectedPoint has no such gap: r3f recomputes it fresh from the
// current pointer position on every single event regardless of what (if
// anything) the ray currently hits, so it's what's used here.
export default function useArrowDrag({ draggable, onDrag }) {
  const draggingRef = useRef(false);
  const originRef = useRef(new THREE.Vector3());

  const angleFromEvent = useCallback((event) => {
    event.object.getWorldPosition(originRef.current);
    const dx = event.unprojectedPoint.x - originRef.current.x;
    const dy = event.unprojectedPoint.y - originRef.current.y;
    return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!draggable) return;
      event.stopPropagation();
      event.target.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      document.body.style.cursor = 'grabbing';
      onDrag?.(angleFromEvent(event));
    },
    [angleFromEvent, draggable, onDrag]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!draggingRef.current) return;
      event.stopPropagation();
      onDrag?.(angleFromEvent(event));
    },
    [angleFromEvent, onDrag]
  );

  const handlePointerUp = useCallback((event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = 'grab';
    event.target.releasePointerCapture(event.pointerId);
  }, []);

  const handlePointerOver = useCallback(() => {
    if (draggable) document.body.style.cursor = 'grab';
  }, [draggable]);

  const handlePointerOut = useCallback(() => {
    if (draggable && !draggingRef.current) document.body.style.cursor = 'auto';
  }, [draggable]);

  // Defensive reset — e.g. the preset gets switched away mid-drag, which
  // unmounts this component without ever firing pointerup/pointerout.
  useEffect(() => {
    if (!draggable) return undefined;
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [draggable]);

  return {
    onPointerCancel: handlePointerUp,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerOut: handlePointerOut,
    onPointerOver: handlePointerOver,
    onPointerUp: handlePointerUp,
  };
}
