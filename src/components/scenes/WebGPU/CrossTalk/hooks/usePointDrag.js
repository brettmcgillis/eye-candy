import { useCallback, useRef } from 'react';

import * as THREE from 'three/webgpu';

// Position-drag sibling of useArrowDrag.js (same pointer-capture mechanics,
// same event.unprojectedPoint reasoning — see that file's comment), but
// reports a normalized offset from the owning window's own rect center
// instead of an angle, clamped to stay within the window (±0.5 either
// axis) so the light/occluder can't be dragged into a sibling window's
// territory where this tab has no control surface for it.
export default function usePointDrag({ draggable, onDrag, rect }) {
  const draggingRef = useRef(false);

  const offsetFromEvent = useCallback(
    (event) => {
      if (!rect) return null;
      // `unprojectedPoint` is in the ortho camera's own frame (0..canvasW,
      // 0..canvasH), NOT absolute desktop coords — DesktopStage's eased world
      // group is what maps this window's slice of world space onto the canvas.
      // Only draggable window is the self window, which fills the canvas, so
      // its centre in this frame is (rect.w/2, rect.h/2). Subtracting the
      // *absolute* centre (rect.x/y) instead is why non-origin windows (tab 2+)
      // pinned the handle to an edge.
      const x = (event.unprojectedPoint.x - rect.w / 2) / rect.w;
      const y = (event.unprojectedPoint.y - rect.h / 2) / rect.h;

      return {
        x: THREE.MathUtils.clamp(x, -0.5, 0.5),
        y: THREE.MathUtils.clamp(y, -0.5, 0.5),
      };
    },
    [rect]
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (!draggable) return;
      event.stopPropagation();
      event.target.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      document.body.style.cursor = 'grabbing';

      const offset = offsetFromEvent(event);
      if (offset) onDrag?.(offset);
    },
    [draggable, offsetFromEvent, onDrag]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!draggingRef.current) return;
      event.stopPropagation();

      const offset = offsetFromEvent(event);
      if (offset) onDrag?.(offset);
    },
    [offsetFromEvent, onDrag]
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

  return {
    onPointerCancel: handlePointerUp,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerOut: handlePointerOut,
    onPointerOver: handlePointerOver,
    onPointerUp: handlePointerUp,
  };
}
