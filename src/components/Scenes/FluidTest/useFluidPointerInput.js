import { useCallback, useMemo, useRef } from 'react';

export default function useFluidPointerInput({ size }) {
  const pointerRef = useRef(null);
  const lastRef = useRef(null);
  const downRef = useRef(false);

  const updateFromEvent = useCallback(
    (e) => {
      if (!e.uv || !downRef.current) return;

      const { x, y } = e.uv;
      const prev = lastRef.current;
      let vx = prev ? x - prev.x : 0;
      let vy = prev ? y - prev.y : 0;

      if (size.width > size.height) {
        vx *= size.width / Math.max(1, size.height);
      } else {
        vy *= size.height / Math.max(1, size.width);
      }

      const pointer = { x, y, vx, vy, down: true };
      lastRef.current = pointer;
      pointerRef.current = pointer;
    },
    [size.height, size.width]
  );

  const clear = useCallback(() => {
    downRef.current = false;
    lastRef.current = null;
    pointerRef.current = null;
  }, []);

  const pointerEvents = useMemo(
    () => ({
      onPointerDown: (e) => {
        e.stopPropagation();
        downRef.current = true;
        e.target.setPointerCapture(e.pointerId);
        updateFromEvent(e);
      },
      onPointerMove: (e) => {
        e.stopPropagation();
        updateFromEvent(e);
      },
      onPointerUp: (e) => {
        e.stopPropagation();
        if (e.target.releasePointerCapture) {
          e.target.releasePointerCapture(e.pointerId);
        }
        clear();
      },
      onPointerCancel: (e) => {
        e.stopPropagation();
        if (e.target.releasePointerCapture) {
          e.target.releasePointerCapture(e.pointerId);
        }
        clear();
      },
      onPointerLeave: (e) => {
        e.stopPropagation();
        if (e.pointerType === 'mouse') clear();
      },
    }),
    [clear, updateFromEvent]
  );

  return { pointerRef, pointerEvents };
}
