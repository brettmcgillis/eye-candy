// Device tilt → gravity direction, ported from the reference sims'
// MotionController (examples/fluid/src/flip/2d/*/motion.ts), reshaped from a
// class into a module singleton: exactly one set of deviceorientation /
// devicemotion listeners per window, shared by whoever asks. Enables the
// single-tab mobile scenario — tilt the phone and the water pours toward the
// low edge; shake it to respawn (subscribers decide what a shake means).
//
// Gravity here is a UNIT direction in the solver's grid space (x right+,
// y UP+, so upright portrait = {x: 0, y: -1}); the sim scales it by the Leva
// gravity magnitude. deviceorientation beta (front-back) / gamma (left-right)
// project the device's gravity vector onto the screen plane exactly as the
// reference does: tilt right → x+, device flat on a table → ~zero in-plane
// gravity and the water floats.

const SHAKE_THRESHOLD = 15; // m/s² of summed |Δaccel| across axes
const SHAKE_COOLDOWN_MS = 600;

const gravity = { x: 0, y: -1 };
let listening = false;
const shakeSubscribers = new Set();
let lastShakeTime = 0;
const lastAcceleration = { x: 0, y: 0, z: 0 };

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function handleOrientation(event) {
  if (event.beta === null || event.gamma === null) return;

  const betaRad = (event.beta * Math.PI) / 180;
  const gammaRad = (event.gamma * Math.PI) / 180;
  gravity.x = clamp(Math.sin(gammaRad) * Math.cos(betaRad), -1, 1);
  gravity.y = clamp(-Math.sin(betaRad), -1, 1);
}

function handleMotion(event) {
  const accel = event.accelerationIncludingGravity;
  if (!accel) return;

  const x = accel.x || 0;
  const y = accel.y || 0;
  const z = accel.z || 0;
  const totalDelta =
    Math.abs(x - lastAcceleration.x) +
    Math.abs(y - lastAcceleration.y) +
    Math.abs(z - lastAcceleration.z);
  lastAcceleration.x = x;
  lastAcceleration.y = y;
  lastAcceleration.z = z;

  const now = Date.now();
  if (totalDelta > SHAKE_THRESHOLD && now - lastShakeTime > SHAKE_COOLDOWN_MS) {
    lastShakeTime = now;
    shakeSubscribers.forEach((cb) => cb());
  }
}

export function isMotionSupported() {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

// iOS 13+ gates the events behind a permission prompt that may only be
// triggered from a user gesture — callers must route through
// requestMotionPermission from a click handler there.
export function needsMotionPermission() {
  return (
    isMotionSupported() &&
    typeof window.DeviceOrientationEvent.requestPermission === 'function'
  );
}

// No-op when unsupported or when permission is still ungranted on iOS (the
// events simply never fire) — safe to call optimistically from an effect.
export function startMotion() {
  if (!isMotionSupported() || listening) return;
  window.addEventListener('deviceorientation', handleOrientation);
  window.addEventListener('devicemotion', handleMotion);
  listening = true;
}

export function stopMotion() {
  if (!listening) return;
  window.removeEventListener('deviceorientation', handleOrientation);
  window.removeEventListener('devicemotion', handleMotion);
  listening = false;
  gravity.x = 0;
  gravity.y = -1;
}

// Must be called from a user-gesture call stack on iOS. Resolves true when
// tilt events will flow (either permission granted, or no permission gate on
// this platform).
export async function requestMotionPermission() {
  if (!isMotionSupported()) return false;
  if (!needsMotionPermission()) {
    startMotion();
    return true;
  }

  try {
    const orientationResponse =
      await window.DeviceOrientationEvent.requestPermission();
    let motionResponse = 'granted';
    if (typeof window.DeviceMotionEvent?.requestPermission === 'function') {
      motionResponse = await window.DeviceMotionEvent.requestPermission();
    }
    if (orientationResponse === 'granted' && motionResponse === 'granted') {
      startMotion();
      return true;
    }
  } catch {
    // Fall through — treated as denied.
  }
  return false;
}

// Live reference: callers read per frame, never store a copy.
export function getTiltGravity() {
  return gravity;
}

export function subscribeShake(cb) {
  shakeSubscribers.add(cb);
  return () => shakeSubscribers.delete(cb);
}
