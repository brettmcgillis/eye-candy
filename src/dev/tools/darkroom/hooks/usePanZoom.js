import { useEffect, useRef } from 'react';

const MAX_SCALE = 16;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const fractionIn = (element, { clientX, clientY }) => {
  const rect = element.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
};

// Wheel or pinch zooms about the pointer, drag pans, double-click resets.
// Gestures move the preview, or the picture while `composeRef` holds a
// target ({ begin, update, reset }) whose points are fractions of the output.
export default function usePanZoom(viewRef, composeRef) {
  const frameRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const viewElement = viewRef.current;
    const { style } = viewElement;
    let view = { scale: 1, x: 0, y: 0 };
    let gesture = null;
    const pointers = new Map();

    const set = (scale, x, y) => {
      view = { scale, x: clamp(x, 1 - scale, 0), y: clamp(y, 1 - scale, 0) };
      style.transform = `translate(${view.x * 100}%, ${view.y * 100}%) scale(${scale})`;
      frame.dataset.zoomed = scale > 1 ? 'true' : 'false';
    };

    const inspect = {
      begin: () => view,
      element: frame,
      reset: () => set(1, 0, 0),
      update(start, anchor, at, factor) {
        const scale = clamp(start.scale * factor, 1, MAX_SCALE);
        const k = scale / start.scale;
        set(
          scale,
          at.x - (anchor.x - start.x) * k,
          at.y - (anchor.y - start.y) * k
        );
      },
    };

    const target = () =>
      composeRef.current
        ? { ...composeRef.current, element: viewElement }
        : inspect;

    const centroid = () => {
      const list = [...pointers.values()];
      return {
        clientX: list.reduce((sum, p) => sum + p.clientX, 0) / list.length,
        clientY: list.reduce((sum, p) => sum + p.clientY, 0) / list.length,
      };
    };

    const spread = () => {
      const [a, b] = [...pointers.values()];
      return b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0;
    };

    const begin = () => {
      if (!pointers.size) {
        gesture = null;
        return;
      }
      const active = target();
      gesture = {
        active,
        anchor: fractionIn(active.element, centroid()),
        spread: spread(),
        start: active.begin(),
      };
    };

    const onWheel = (event) => {
      event.preventDefault();
      const active = target();
      const point = fractionIn(active.element, event);
      const lines = event.deltaMode === 1 ? 16 : 1;
      const speed = event.ctrlKey ? 0.01 : 0.002;
      active.update(
        active.begin(),
        point,
        point,
        Math.exp(-event.deltaY * lines * speed)
      );
    };

    const onDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      frame.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, event);
      begin();
    };

    const onMove = (event) => {
      if (!gesture || !pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, event);
      const { active, anchor, start } = gesture;
      const factor = gesture.spread > 1 ? spread() / gesture.spread : 1;
      active.update(
        start,
        anchor,
        fractionIn(active.element, centroid()),
        factor
      );
    };

    const onUp = (event) => {
      if (!pointers.delete(event.pointerId)) return;
      begin();
    };

    const onReset = () => target().reset();

    frame.addEventListener('wheel', onWheel, { passive: false });
    frame.addEventListener('pointerdown', onDown);
    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerup', onUp);
    frame.addEventListener('pointercancel', onUp);
    frame.addEventListener('dblclick', onReset);
    return () => {
      frame.removeEventListener('wheel', onWheel);
      frame.removeEventListener('pointerdown', onDown);
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerup', onUp);
      frame.removeEventListener('pointercancel', onUp);
      frame.removeEventListener('dblclick', onReset);
    };
  }, [composeRef, viewRef]);

  return frameRef;
}
