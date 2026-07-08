import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { getTiltGravity, startMotion, stopMotion } from '../utils/deviceMotion';
import FlipFluid from '../utils/flipFluid';
import {
  applyWindowMask,
  computeWorldOrigin,
  confineToMask,
  gridToScreenX,
  gridToScreenY,
  seedParticles,
} from '../utils/fluidWorld';

const FLUID_CHANNEL = 'eyeCandy:crossTalk:fluid';
const DENSITY = 1000.0;
// Grid columns across worldWidth — coarser than the original demo's res=100
// since this now runs on the CPU main thread alongside React/fiber, not in
// isolation, and has to leave headroom for a live dev reload/HMR.
const GRID_COLUMNS = 130;
const BROADCAST_HZ = 30;

// Host-authoritative FLIP sim: only the elected host window (see
// useWindowSync / WindowRegistry host election) actually steps the physics.
// It's a single shared body of water across every alive window's screen
// rect, so it must be simulated once, not once per tab. The host publishes
// particle positions over BroadcastChannel (structured-clone of a
// Float32Array — no JSON, unlike the low-frequency rect/meta heartbeat in
// windowSync) at BROADCAST_HZ; every window, host included, renders from
// that shared buffer so a tab never draws a different water state than its
// siblings. This hook is only ever mounted while the FluidSim preset's view
// is active (see components/FluidSimView.jsx) — mounting/unmounting is the
// on/off switch, so there's no separate enabled/disabled flag to thread
// through.
export default function useFluidSim({
  bubbleBuoyancy,
  compensateDrift,
  diffuseEmissionRate,
  diffuseLifetime,
  diffuseMinSpeed,
  flipRatio,
  gravity,
  isHost,
  maxDiffuseParticles,
  maxParticles,
  overRelaxation,
  particleIters,
  particleRadius,
  pressureIters,
  reseedToken,
  separateParticles,
  tiltGravity,
  whitewaterEnabled,
  windows,
  worldHeight,
  worldWidth,
}) {
  const bufferRef = useRef(new Float32Array(2 * maxParticles));
  const countRef = useRef(0);
  // Whitewater render buffer: stride-4 [x, y, type, fade] per particle —
  // screen-space position, DIFFUSE_* type for the per-type color pick on the
  // GPU, and the age-driven alpha so dying particles fade instead of popping.
  const diffuseBufferRef = useRef(new Float32Array(4 * maxDiffuseParticles));
  const diffuseCountRef = useRef(0);
  const fluidRef = useRef(null);
  const originRef = useRef({ height: worldHeight, x: 0, y: 0 });
  const scratchRef = useRef({
    x: new Float32Array(maxParticles),
    y: new Float32Array(maxParticles),
  });
  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(FLUID_CHANNEL);
    return () => channelRef.current.close();
  }, []);

  // Non-host windows just copy whatever the host last published into the
  // shared render buffer — they never touch the solver.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return undefined;

    const onMessage = (event) => {
      if (isHost) return;
      const { count, diffuse, diffuseCount, origin, pos } = event.data;
      if (bufferRef.current.length !== pos.length) {
        bufferRef.current = new Float32Array(pos.length);
      }
      bufferRef.current.set(pos);
      countRef.current = count;
      originRef.current = origin;
      if (diffuse) {
        if (diffuseBufferRef.current.length < diffuse.length) {
          diffuseBufferRef.current = new Float32Array(diffuse.length);
        }
        diffuseBufferRef.current.set(diffuse);
        diffuseCountRef.current = diffuseCount;
      }
    };

    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [isHost]);

  // Tilt gravity (single-tab mobile): attach the shared deviceorientation
  // listeners while the toggle is on. On iOS this alone does nothing until
  // the Leva "Enable Tilt" button has granted permission (see
  // utils/deviceMotion.js) — until then getTiltGravity stays at straight
  // down, so the sim behaves exactly as before.
  useEffect(() => {
    if (!isHost || !tiltGravity) return undefined;
    startMotion();
    return () => stopMotion();
  }, [isHost, tiltGravity]);

  const spacing = worldWidth / GRID_COLUMNS;

  // (Re)build the solver whenever this window becomes host, or the world/
  // particle-count controls change shape. A fresh host after the previous
  // one closed always starts a brand-new body of water rather than trying
  // to recover unrecoverable in-memory state — matches the scene's own
  // "disconnect the bottom tab, reattach at top" restart model.
  useEffect(() => {
    if (!isHost) {
      fluidRef.current = null;
      return;
    }

    const origin = computeWorldOrigin(windows, worldHeight);
    originRef.current = origin;

    const fluid = new FlipFluid(
      DENSITY,
      worldWidth,
      worldHeight,
      spacing,
      particleRadius,
      maxParticles
    );
    seedParticles(
      fluid,
      windows.length
        ? windows
        : [{ h: worldHeight, w: worldWidth, x: origin.x, y: origin.y }],
      origin,
      maxParticles
    );
    fluidRef.current = fluid;

    if (bufferRef.current.length !== 2 * maxParticles) {
      bufferRef.current = new Float32Array(2 * maxParticles);
    }
    if (scratchRef.current.x.length !== maxParticles) {
      scratchRef.current = {
        x: new Float32Array(maxParticles),
        y: new Float32Array(maxParticles),
      };
    }
  }, [isHost, maxParticles, worldWidth, worldHeight, reseedToken]);

  useFrame((_, delta) => {
    const fluid = fluidRef.current;
    if (!isHost || !fluid) return;

    const dt = Math.min(delta, 1 / 30);
    const rects = windows.length ? windows : [];
    const origin = originRef.current;

    applyWindowMask(fluid, rects, origin);

    const { x: prevX, y: prevY } = scratchRef.current;
    for (let i = 0; i < fluid.numParticles; i += 1) {
      prevX[i] = fluid.particlePos[2 * i];
      prevY[i] = fluid.particlePos[2 * i + 1];
    }

    // Gravity as a grid-space vector: straight down normally, or the Leva
    // magnitude along the live device-tilt direction (already a unit vector
    // in grid space, upright = {0, -1}).
    let gravityX = 0;
    let gravityY = -gravity;
    if (tiltGravity) {
      const tilt = getTiltGravity();
      gravityX = gravity * tilt.x;
      gravityY = gravity * tilt.y;
    }

    fluid.integrateParticles(dt, gravityX, gravityY);
    if (separateParticles) fluid.pushParticlesApart(particleIters);
    confineToMask(fluid, prevX, prevY, rects, origin);
    fluid.transferVelocities(true);
    fluid.updateParticleDensity();
    fluid.solveIncompressibility(
      pressureIters,
      dt,
      overRelaxation,
      compensateDrift
    );
    fluid.transferVelocities(false, flipRatio);

    // Whitewater rides on the just-solved grid: vorticity feeds the
    // turbulence emission potential, then the diffuse layer advances/emits
    // under the same gravity vector as the liquid.
    fluid.setWhitewaterSettings(
      whitewaterEnabled,
      maxDiffuseParticles,
      diffuseEmissionRate,
      diffuseMinSpeed,
      diffuseLifetime
    );
    if (whitewaterEnabled) {
      fluid.updateVorticity();
      fluid.updateDiffuseParticles(dt, gravityX, gravityY, bubbleBuoyancy);
    }

    const out = bufferRef.current;
    for (let i = 0; i < fluid.numParticles; i += 1) {
      out[2 * i] = gridToScreenX(fluid.particlePos[2 * i], origin);
      out[2 * i + 1] = gridToScreenY(fluid.particlePos[2 * i + 1], origin);
    }
    countRef.current = fluid.numParticles;

    if (diffuseBufferRef.current.length < 4 * fluid.numDiffuseParticles) {
      diffuseBufferRef.current = new Float32Array(
        4 * fluid.maxDiffuseParticles
      );
    }
    const dOut = diffuseBufferRef.current;
    // Every particle spawns with at least half of diffuseLifetime left, so
    // normalizing fade against that floor makes each start fully opaque.
    const invHalfLife = 1 / (fluid.diffuseLifetime * 0.5);
    for (let i = 0; i < fluid.numDiffuseParticles; i += 1) {
      dOut[4 * i] = gridToScreenX(fluid.diffusePos[2 * i], origin);
      dOut[4 * i + 1] = gridToScreenY(fluid.diffusePos[2 * i + 1], origin);
      dOut[4 * i + 2] = fluid.diffuseType[i];
      dOut[4 * i + 3] = Math.min(1, fluid.diffuseLife[i] * invHalfLife);
    }
    diffuseCountRef.current = fluid.numDiffuseParticles;

    const now = performance.now();
    if (now - lastBroadcastRef.current >= 1000 / BROADCAST_HZ) {
      lastBroadcastRef.current = now;
      channelRef.current?.postMessage({
        count: fluid.numParticles,
        diffuse: dOut.slice(0, 4 * fluid.numDiffuseParticles),
        diffuseCount: fluid.numDiffuseParticles,
        origin,
        pos: out.slice(0, 2 * fluid.numParticles),
      });
    }
  });

  return useMemo(
    () => ({ bufferRef, countRef, diffuseBufferRef, diffuseCountRef }),
    []
  );
}
