import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  DEFAULT_ATTRACTOR_STRENGTH,
  attractorAccel,
  isLost,
  randomPositionInWindows,
  stepFeather,
} from '../utils/featherWorld';

const FEATHER_CHANNEL = 'eyeCandy:crossTalk:feathers';
const MOUSE_CHANNEL = 'eyeCandy:crossTalk:feathersMouse';
const BROADCAST_HZ = 30;
const MOUSE_STALE_MS = 500;

// Host-authoritative feather swarm, mirroring useGravityBall/useFluidSim:
// only the elected host window steps the physics, broadcasting a packed
// [x, y, angle] buffer over a dedicated BroadcastChannel; every window, host
// included, renders from that shared buffer (see components/FeatherField.jsx).
//
// Two attractors, gravity + spin (see utils/featherWorld.js's
// attractorAccel): every alive window's own rect center at that window's
// own broadcast `attractorStrength` meta (mirroring Gravity Rooms'
// gravityAngle), plus whichever window the OS cursor currently sits over.
// Only the window actually under the cursor knows its own screen-space
// mouse position, so every window — not just the host — posts its own local
// mouse world-position on a second, low-rate channel; the host picks out
// whichever one is freshest. A BroadcastChannel never delivers a tab's own
// postMessage back to itself, so the host tracks its own cursor locally
// rather than waiting to hear it echoed back.
//
// There's no per-window confinement — particles roam one shared coordinate
// space and every window is just a fixed-size porthole onto it (see
// utils/featherWorld.js's file comment), so a particle can drift freely from
// one window's territory into another's. isLost/randomPositionInWindows is
// only an escape hatch for a particle that's slingshot past every
// attractor's reach, not a wall.
export default function useFeatherSwarm({
  damping,
  isHost,
  maxParticles,
  maxSpeed,
  mouseStrength,
  resetToken,
  selfId,
  selfRect,
  spinStrength,
  windows,
}) {
  const bufferRef = useRef(new Float32Array(3 * maxParticles));
  const countRef = useRef(0);
  const mouseAttractorRef = useRef(null);
  const particlesRef = useRef([]);
  const channelRef = useRef(null);
  const mouseChannelRef = useRef(null);
  const mouseMapRef = useRef(new Map());
  const localMouseRef = useRef({ active: false, x: 0, y: 0 });
  const lastBroadcastRef = useRef(0);
  const lastMouseBroadcastRef = useRef(0);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(FEATHER_CHANNEL);
    mouseChannelRef.current = new BroadcastChannel(MOUSE_CHANNEL);
    return () => {
      channelRef.current.close();
      mouseChannelRef.current.close();
    };
  }, []);

  // Non-host windows just copy whatever the host last published — they
  // never touch the physics.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return undefined;

    const onMessage = (event) => {
      if (isHost) return;
      const { count, mouse, pos } = event.data;
      if (bufferRef.current.length !== pos.length) {
        bufferRef.current = new Float32Array(pos.length);
      }
      bufferRef.current.set(pos);
      countRef.current = count;
      mouseAttractorRef.current = mouse;
    };

    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [isHost]);

  // Only the host needs every window's cursor position — it's the only one
  // running the physics that reads mouseMapRef.
  useEffect(() => {
    const channel = mouseChannelRef.current;
    if (!channel || !isHost) return undefined;

    const onMessage = (event) => {
      const { active, id, x, y } = event.data;
      mouseMapRef.current.set(id, { active, t: performance.now(), x, y });
    };

    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [isHost]);

  // selfRect is a fresh object every render (see useWindowSync), so it's read
  // through a ref rather than a dependency — otherwise this effect would
  // re-subscribe its listeners on every registry heartbeat across every
  // alive window, not just when this window's own rect actually changes.
  const selfRectRef = useRef(selfRect);
  selfRectRef.current = selfRect;

  // Every window (host or not) tracks and broadcasts its own local cursor,
  // converted to shared world space via its own selfRect — same trick as
  // DesktopStage's -selfRect world offset.
  useEffect(() => {
    const onMove = (event) => {
      const rect = selfRectRef.current;
      if (!rect) return;
      localMouseRef.current = {
        active: true,
        x: rect.x + event.clientX,
        y: rect.y + event.clientY,
      };
    };
    const onLeave = () => {
      localMouseRef.current = { ...localMouseRef.current, active: false };
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // (Re)seed the particle pool whenever the count changes or the Scatter
  // button fires. Only needs the first 0-windows-to-some-windows transition
  // (not every subsequent window-count change): with no per-window
  // confinement, particles already drift freely toward wherever an
  // attractor is, including one added later — physics handles redistributing
  // across a newly-opened window on its own, no explicit reseed needed.
  // Deliberately not gated on `isHost` — a fresh host after the previous one
  // closed rebuilds its own pool from scratch rather than trying to recover
  // unrecoverable in-memory state, same as useFluidSim/useGravityBall's
  // rebuild triggers.
  const hasWindows = windows.length > 0;
  useEffect(() => {
    if (!hasWindows) return;
    particlesRef.current = Array.from({ length: maxParticles }, () => ({
      vx: 0,
      vy: 0,
      ...randomPositionInWindows(windows),
    }));
    if (bufferRef.current.length !== 3 * maxParticles) {
      bufferRef.current = new Float32Array(3 * maxParticles);
    }
    countRef.current = maxParticles;
  }, [maxParticles, resetToken, hasWindows]);

  useFrame((_, rawDelta) => {
    const now = performance.now();

    if (now - lastMouseBroadcastRef.current >= 1000 / BROADCAST_HZ) {
      lastMouseBroadcastRef.current = now;
      mouseChannelRef.current?.postMessage({
        id: selfId,
        ...localMouseRef.current,
      });
    }

    if (!isHost) return;

    const dt = Math.min(rawDelta, 1 / 30);

    const attractors = windows.map((win) => ({
      x: win.x + win.w / 2,
      y: win.y + win.h / 2,
      strength: win.meta?.attractorStrength ?? DEFAULT_ATTRACTOR_STRENGTH,
    }));

    // The host's own cursor never arrives through mouseMapRef (a tab never
    // receives its own BroadcastChannel post) — seed the map with it
    // directly before picking the freshest entry.
    mouseMapRef.current.set(selfId, { ...localMouseRef.current, t: now });
    let mouseAttractor = null;
    let freshestT = -Infinity;
    mouseMapRef.current.forEach((entry) => {
      if (!entry.active || now - entry.t > MOUSE_STALE_MS) return;
      if (entry.t > freshestT) {
        freshestT = entry.t;
        mouseAttractor = { x: entry.x, y: entry.y };
      }
    });
    if (mouseAttractor) {
      attractors.push({ ...mouseAttractor, strength: mouseStrength });
    }
    mouseAttractorRef.current = mouseAttractor;

    const particles = particlesRef.current;
    const out = bufferRef.current;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const pull = attractorAccel(
        particle.x,
        particle.y,
        attractors,
        spinStrength
      );

      const stepped = stepFeather(particle, pull, dt, { damping, maxSpeed });
      const next =
        windows.length && isLost(stepped.x, stepped.y, attractors)
          ? { vx: 0, vy: 0, ...randomPositionInWindows(windows) }
          : stepped;
      particles[i] = next;

      out[3 * i] = next.x;
      out[3 * i + 1] = next.y;
      out[3 * i + 2] = Math.atan2(next.vy, next.vx);
    }
    countRef.current = particles.length;

    if (now - lastBroadcastRef.current >= 1000 / BROADCAST_HZ) {
      lastBroadcastRef.current = now;
      channelRef.current?.postMessage({
        count: particles.length,
        mouse: mouseAttractor,
        pos: out.slice(0, 3 * particles.length),
      });
    }
  });

  return useMemo(() => ({ bufferRef, countRef, mouseAttractorRef }), []);
}
