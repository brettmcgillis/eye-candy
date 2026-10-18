import React from 'react';

import { act, advance, createRoot, extend } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import GhostStudio from './GhostStudio';

// React only honours `act` while IS_REACT_ACT_ENVIRONMENT is set, and warns
// about every update outside one while it is — a texture arriving later is
// such an update — so the flag is raised for the act alone.
async function flushed(work) {
  const previous = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(work);
  } finally {
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous;
  }
}

// An R3F root on a renderer the caller owns, with no frame loop: each
// `step(seconds)` runs one frame at that clock (the same seconds twice is a
// still frame — the cloth and rig see a zero delta). GhostBusterCLI mounts the
// stage this way on its headless renderer.
export default async function createStageRoot({
  canvas,
  height,
  pixelRatio,
  renderer,
  width,
}) {
  extend(THREE);
  const root = createRoot(canvas);
  await root.configure({
    camera: { far: 100, fov: 30, near: 0.01, position: [0, 0, 4] },
    dpr: pixelRatio,
    events: undefined,
    frameloop: 'never',
    gl: renderer,
    shadows: 'soft',
    size: { height, left: 0, top: 0, width },
  });
  let store = null;
  let mounts = 0;

  return {
    get camera() {
      return store.getState().camera;
    },
    get scene() {
      return store.getState().scene;
    },
    get state() {
      return store.getState();
    },
    // Every mount is a fresh stage: a new cloth sim from rest at clock 0.
    // `act` flushes the commit and its passive effects (where useFrame
    // subscribes) before the first step, so no frame runs half-mounted.
    async mount(props) {
      mounts += 1;
      await flushed(async () => {
        store = root.render(<GhostStudio key={mounts} {...props} />);
      });
      const { clock } = store.getState();
      clock.elapsedTime = 0;
      clock.oldTime = 0;
    },
    // Flushes what a suspended subtree committed once its assets arrived.
    flush: () => flushed(async () => {}),
    step(seconds) {
      advance(seconds, true, store.getState());
    },
    unmount() {
      root.unmount();
    },
  };
}
