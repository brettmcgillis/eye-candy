import { useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

const KEYS = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  KeyX: 'turbo',
};

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return (
    !!target?.isContentEditable ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select'
  );
}

// One move vector and one look delta, whatever produced them. Every source —
// keys, pointer, and later the on-screen arrows and a touch stick — writes to
// these two, so movement never has to know how it was asked for.
export default function useInput({ enabled = true, lookSensitivity = 0.0022 }) {
  const domElement = useThree((state) => state.gl.domElement);

  const input = useMemo(
    () => ({
      forward: false,
      back: false,
      left: false,
      right: false,
      sprint: false,
      turbo: false,
      lookX: 0,
      lookY: 0,
      // Written by the overlay controls rather than the keyboard, and summed
      // with the keys so a held button and a held key behave identically.
      padX: 0,
      padY: 0,
    }),
    []
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const clear = () => {
      Object.keys(KEYS).forEach((code) => {
        input[KEYS[code]] = false;
      });
    };

    const onKey = (down) => (event) => {
      if (down && isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const action = KEYS[event.code];
      if (!action) return;
      input[action] = down;
      event.preventDefault();
    };

    const onDown = onKey(true);
    const onUp = onKey(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clear);
      clear();
    };
  }, [enabled, input]);

  // Drag to look rather than pointer lock: it costs no permission prompt, it
  // is the same gesture on touch, and it leaves the cursor free for Leva.
  useEffect(() => {
    if (!enabled || !domElement) return undefined;
    let pointer = null;

    const onPointerDown = (event) => {
      if (!event.isPrimary) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      domElement.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      input.lookX += (event.clientX - pointer.x) * lookSensitivity;
      input.lookY += (event.clientY - pointer.y) * lookSensitivity;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const onPointerUp = (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      domElement.releasePointerCapture?.(event.pointerId);
      pointer = null;
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointercancel', onPointerUp);
    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointercancel', onPointerUp);
    };
  }, [domElement, enabled, input, lookSensitivity]);

  return input;
}
