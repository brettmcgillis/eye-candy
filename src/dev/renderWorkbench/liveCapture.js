import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// RGBA pixels as the base64 PNG a Live-tab capture posts to
// `/dev-api/<tool>/captures`.
export default async function pngBase64(pixels, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas
    .getContext('2d')
    .putImageData(new ImageData(pixels, width, height), 0, 0);
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// R3F zeroes its clock whenever the frameloop changes, and the next
// advance(t) would replay t seconds at once. This keeps the clock
// monotonic and remembers the time of the last frame drawn, which is the
// moment a pause or a capture freezes. Runs ahead of every other callback.
export function useLiveClock() {
  const lastRef = useRef(0);
  useFrame((state, delta) => {
    if (state.clock.elapsedTime < lastRef.current) {
      // eslint-disable-next-line no-param-reassign
      state.clock.elapsedTime = lastRef.current + delta;
    }
    lastRef.current = state.clock.elapsedTime;
  }, -2);
  return lastRef;
}

export function freezeClock(state, lastRef) {
  state.setFrameloop('never');
  return lastRef.current;
}

export function resumeClock(state) {
  state.setFrameloop('always');
}

// Every pass (post effects, a plot's depth pass) sizes itself from the
// drawing buffer, so a capture renders with the buffer at the capture's
// size and puts the canvas back after; returns the undo.
export function captureSize({ gl, size }, width, height) {
  const ratio = gl.getPixelRatio();
  gl.setPixelRatio(1);
  gl.setSize(width, height, false);
  return () => {
    gl.setPixelRatio(ratio);
    gl.setSize(size.width, size.height, false);
  };
}

// A pass (post effects, a plot's depth pass) renders at most once per
// animation frame, so a capture drawn in the frame the live loop just drew
// reads that frame's pass back. Two frames make sure a fresh one began.
export const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

// One frozen frame at `seconds`. The clock is pinned first: R3F's own
// frameloop sync may have zeroed it, and advance() steps by the difference.
export function stepFrozen(state, seconds) {
  // eslint-disable-next-line no-param-reassign
  state.clock.elapsedTime = seconds;
  state.advance(seconds, true);
}
