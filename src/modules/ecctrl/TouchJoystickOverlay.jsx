import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { EcctrlJoystick } from './EcctrlJoystick.tsx';

function supportsTouchUi() {
  if (typeof window === 'undefined') return false;

  const hasTouchEvents = 'ontouchstart' in window;
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  const hasCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const hasNoHover =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none)').matches;

  return hasTouchEvents || hasTouchPoints || hasCoarsePointer || hasNoHover;
}

// Portals an EcctrlJoystick to document.body on touch-capable devices.
// Extra props (e.g. joystickBaseProps / joystickStickProps /
// joystickHandleProps with custom materials) pass through to EcctrlJoystick
// — memoize them in the caller so the portal render effect stays quiet.
export default function TouchJoystickOverlay({
  buttonNumber = 5,
  ...joystickProps
}) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const [showJoystick, setShowJoystick] = useState(() => supportsTouchUi());

  useEffect(() => {
    const container = document.createElement('div');
    container.dataset.ecctrlJoystickPortal = 'true';
    document.body.appendChild(container);

    containerRef.current = container;
    rootRef.current = createRoot(container);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;

      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }

      containerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateTouchUi = () => {
      setShowJoystick(supportsTouchUi());
    };

    const coarsePointerQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null;
    const hoverQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: none)')
        : null;
    const viewport = window.visualViewport;

    updateTouchUi();

    coarsePointerQuery?.addEventListener?.('change', updateTouchUi);
    hoverQuery?.addEventListener?.('change', updateTouchUi);
    coarsePointerQuery?.addListener?.(updateTouchUi);
    hoverQuery?.addListener?.(updateTouchUi);

    window.addEventListener('resize', updateTouchUi);
    window.addEventListener('orientationchange', updateTouchUi);
    window.addEventListener('focus', updateTouchUi);
    window.addEventListener('pointerdown', updateTouchUi);
    document.addEventListener('visibilitychange', updateTouchUi);
    viewport?.addEventListener('resize', updateTouchUi);

    return () => {
      coarsePointerQuery?.removeEventListener?.('change', updateTouchUi);
      hoverQuery?.removeEventListener?.('change', updateTouchUi);
      coarsePointerQuery?.removeListener?.(updateTouchUi);
      hoverQuery?.removeListener?.(updateTouchUi);

      window.removeEventListener('resize', updateTouchUi);
      window.removeEventListener('orientationchange', updateTouchUi);
      window.removeEventListener('focus', updateTouchUi);
      window.removeEventListener('pointerdown', updateTouchUi);
      document.removeEventListener('visibilitychange', updateTouchUi);
      viewport?.removeEventListener('resize', updateTouchUi);
    };
  }, []);

  useEffect(() => {
    rootRef.current?.render(
      showJoystick ? (
        <EcctrlJoystick buttonNumber={buttonNumber} {...joystickProps} />
      ) : null
    );
  }, [showJoystick, buttonNumber, joystickProps]);

  return null;
}
