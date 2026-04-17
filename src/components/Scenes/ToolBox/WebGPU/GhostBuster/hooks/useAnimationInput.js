import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

function isTypingTarget(target) {
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

export default function useAnimationInput() {
  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
    space: false,
    tab: false,
  });
  const expressionRef = useRef(0);
  const prevGpNextPresetRef = useRef(false);
  const resultRef = useRef({
    windDirX: 0,
    windDirZ: 0,
    windStrength: 0,
    jumpTriggered: false,
    expressionKey: 0,
    orbitX: 0,
    orbitY: 0,
    zoom: 0,
    nextPreset: false,
  });

  useEffect(() => {
    const keys = keysRef.current;

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.w = true;
          e.preventDefault();
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.s = true;
          e.preventDefault();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.a = true;
          e.preventDefault();
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.d = true;
          e.preventDefault();
          break;
        case 'KeyQ':
          keys.q = true;
          e.preventDefault();
          break;
        case 'KeyE':
          keys.e = true;
          e.preventDefault();
          break;
        case 'Space':
          if (!e.repeat) keys.space = true;
          e.preventDefault();
          break;
        case 'Tab':
          if (!e.repeat) keys.tab = true;
          e.preventDefault();
          break;
        case 'Digit1':
          expressionRef.current = 1;
          break;
        case 'Digit2':
          expressionRef.current = 2;
          break;
        case 'Digit3':
          expressionRef.current = 3;
          break;
        case 'Digit4':
          expressionRef.current = 4;
          break;
        case 'Digit5':
          expressionRef.current = 5;
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.w = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.s = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.a = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.d = false;
          break;
        case 'KeyQ':
          keys.q = false;
          break;
        case 'KeyE':
          keys.e = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Poll input every frame (before default priority) and write to ref
  useFrame(() => {
    const keys = keysRef.current;
    const result = resultRef.current;

    let kx = 0;
    let kz = 0;
    if (keys.a) kx += 1;
    if (keys.d) kx -= 1;
    if (keys.w) kz += 1;
    if (keys.s) kz -= 1;

    let gpx = 0;
    let gpz = 0;
    let gpJump = false;
    let gpOrbitX = 0;
    let gpOrbitY = 0;
    let gpZoom = 0;
    let gpNextPreset = false;
    try {
      const gamepads = navigator.getGamepads?.();
      const gp = gamepads?.[0];
      if (gp) {
        gpx = -gp.axes[0];
        gpz = -gp.axes[1];
        if (Math.abs(gpx) < 0.15) gpx = 0;
        if (Math.abs(gpz) < 0.15) gpz = 0;
        gpJump = gp.buttons[0]?.pressed || false;

        gpOrbitX = gp.axes[2] ?? 0;
        gpOrbitY = gp.axes[3] ?? 0;
        if (Math.abs(gpOrbitX) < 0.15) gpOrbitX = 0;
        if (Math.abs(gpOrbitY) < 0.15) gpOrbitY = 0;

        // LT (6) = zoom in, RT (7) = zoom out
        const lt = gp.buttons[6]?.value ?? 0;
        const rt = gp.buttons[7]?.value ?? 0;
        gpZoom = lt - rt;

        // RB (5) = next preset (edge-triggered)
        const rbPressed = gp.buttons[5]?.pressed || false;
        gpNextPreset = rbPressed && !prevGpNextPresetRef.current;
        prevGpNextPresetRef.current = rbPressed;
      }
    } catch {
      // Gamepad API unavailable
    }

    const dx = kx + gpx;
    const dz = kz + gpz;
    const len = Math.sqrt(dx * dx + dz * dz);

    if (len > 0.001) {
      result.windDirX = dx / len;
      result.windDirZ = dz / len;
      result.windStrength = Math.min(len, 1);
    } else {
      result.windDirX = 0;
      result.windDirZ = 0;
      result.windStrength = 0;
    }

    result.jumpTriggered = keys.space || gpJump;
    keys.space = false;

    result.orbitX = gpOrbitX;
    result.orbitY = gpOrbitY;

    // Zoom: Q = in (+1), E = out (-1), plus analog triggers
    let kZoom = 0;
    if (keys.q) kZoom += 1;
    if (keys.e) kZoom -= 1;
    result.zoom = Math.max(-1, Math.min(1, kZoom + gpZoom));

    result.nextPreset = keys.tab || gpNextPreset;
    keys.tab = false;

    result.expressionKey = expressionRef.current;
    expressionRef.current = 0;
  }, -1);

  return resultRef;
}
