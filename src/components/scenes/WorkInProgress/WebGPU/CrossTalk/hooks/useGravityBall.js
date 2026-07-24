import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { findRoom, gravityVector, stepBall } from '../utils/gravityRooms';

const GRAVITY_CHANNEL = 'eyeCandy:crossTalk:gravityBall';
const BROADCAST_HZ = 30;
// Straight down in this scene's screen-space world (DesktopStage's ortho
// camera has top=0/bottom=height, so +y is down) — the room-owning window's
// own gravityAngle meta overrides this the instant the ball is inside it.
const DEFAULT_ANGLE = 90;

// Host-authoritative ball, mirroring useFluidSim's split: only the elected
// host window (see useWindowSync) steps the physics, broadcasting position
// over a dedicated BroadcastChannel (too high-frequency for windowSync's
// localStorage heartbeat); every window, host included, renders from that
// shared position. Only ever mounted while Gravity Rooms is the active
// preset (see components/GravityRoomsView.jsx) — mount/unmount is the
// on/off switch, so there's no separate enabled flag to thread through.
export default function useGravityBall({
  ballRadius,
  gravityStrength,
  isHost,
  resetToken,
  restitution,
  windows,
}) {
  const positionRef = useRef({ x: 0, y: 0 });
  const ballRef = useRef({ vx: 0, vy: 0, x: 0, y: 0 });
  const roomIdRef = useRef(null);
  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(GRAVITY_CHANNEL);
    return () => channelRef.current.close();
  }, []);

  // Non-host windows just copy whatever the host last published — they
  // never touch the physics.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return undefined;

    const onMessage = (event) => {
      if (isHost) return;
      positionRef.current = event.data;
      readyRef.current = true;
    };

    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [isHost]);

  // (Re)spawn the ball at the first alive room's center whenever this
  // window becomes host, the Reset Ball button fires, or windows first
  // become available (registry population lags the initial render by a
  // tick — see WindowRegistry.start()). Deliberately excludes `windows`
  // itself from the deps: a fresh host after the previous one closed
  // always starts over rather than trying to recover unrecoverable
  // in-memory state, same as useFluidSim's rebuild trigger.
  const hasWindows = windows.length > 0;
  useEffect(() => {
    if (!isHost || !hasWindows) return;

    const room = windows[0];
    const start = { x: room.x + room.w / 2, y: room.y + room.h / 2 };
    ballRef.current = { vx: 0, vy: 0, x: start.x, y: start.y };
    roomIdRef.current = room.id;
    positionRef.current = start;
    readyRef.current = true;
  }, [isHost, hasWindows, resetToken]);

  useFrame((_, delta) => {
    if (!isHost || !readyRef.current || windows.length === 0) return;
    const dt = Math.min(delta, 1 / 30);

    const room = findRoom(
      windows,
      ballRef.current.x,
      ballRef.current.y,
      roomIdRef.current
    );
    roomIdRef.current = room?.id ?? null;
    const angle = room?.meta?.gravityAngle ?? DEFAULT_ANGLE;
    const gravity = gravityVector(angle, gravityStrength);

    ballRef.current = stepBall(ballRef.current, room, windows, dt, {
      gravity,
      radius: ballRadius,
      restitution,
    });
    positionRef.current = { x: ballRef.current.x, y: ballRef.current.y };

    const now = performance.now();
    if (now - lastBroadcastRef.current >= 1000 / BROADCAST_HZ) {
      lastBroadcastRef.current = now;
      channelRef.current?.postMessage(positionRef.current);
    }
  });

  return useMemo(() => ({ positionRef }), []);
}
