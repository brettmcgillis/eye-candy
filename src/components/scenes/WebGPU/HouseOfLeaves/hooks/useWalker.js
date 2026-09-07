import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { ZONE_LABELS, createZone } from '../utils/zones';
import useInput from './useInput';

const HALF_PI = Math.PI / 2;
// Far enough out that the walk never reaches it in a session, close enough in
// that world coordinates stay small enough for shader-side noise to keep its
// precision.
const REBASE_RADIUS = 400;

// The walker owns the camera. CameraRig still supplies the shot machinery for
// recording, and in its fixed mode it writes the camera frame once on change
// rather than every frame, so the two do not fight — switching the camera to
// orbit hands control back for debugging.
//
// Runs at priority -1 so it resolves the frame's position before anything that
// streams geometry around it. Only a positive priority takes over rendering, so
// a negative one is free ordering.
export default function useWalker(config) {
  const camera = useThree((state) => state.camera);
  const input = useInput({
    enabled: config.walkEnabled,
    lookSensitivity: config.lookSensitivity,
  });

  const walker = useMemo(
    () => ({
      anchor: new THREE.Vector3(),
      position: new THREE.Vector3(),
      zoneId: null,
      zone: null,
      state: null,
      frame: null,
      progress: 0,
      yaw: 0,
      pitch: 0,
      stride: 0,
      gait: 0,
    }),
    []
  );

  const scratch = useMemo(
    () => ({
      delta: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      local: new THREE.Vector3(),
    }),
    []
  );

  // Built lazily and cached, and rebuilt only when a value the zones actually
  // read changes. Keying this on `config` would rebuild on every unrelated
  // Leva edit, and rebuilding is where the walker would get put back at the
  // start of the corridor.
  const zones = useMemo(() => {
    const cache = new Map();
    return (id) => {
      if (!cache.has(id)) cache.set(id, createZone(id, config));
      return cache.get(id);
    };
  }, [
    config.corridorWidth,
    config.descentLength,
    config.floorExits,
    config.hallLength,
    config.landingOvershoot,
    config.origin,
    config.roomSize,
    config.shaft,
    config.stairWidth,
    config.walkerRadius,
  ]);

  const startId = ZONE_LABELS[config.zone] ?? config.zone;
  const zoneRef = useRef(null);
  const [, setActive] = useState(startId);

  // Changing a zone's dimensions must not move the walker; only choosing a
  // different starting zone begins a new walk.
  useEffect(() => {
    const zone = zones(startId);
    zoneRef.current = zone;
    walker.zone = zone;
    walker.zoneId = zone.id;
    walker.state = zone.spawn();
    walker.frame = zone.frame(walker.state);
    walker.anchor.set(0, 0, 0);
    // The zone decides which way is onward; nothing else knows.
    walker.yaw = zone.facing(walker.state, walker.frame, scratch);
    walker.pitch = 0;
    walker.stride = 0;
    walker.gait = 0;
    setActive(zone.id);
  }, [scratch, startId, walker, zones]);

  useFrame((_, rawDelta) => {
    const zone = zoneRef.current;
    if (!zone || !walker.state) return;
    const dt = Math.min(rawDelta, 1 / 20);

    if (config.walkEnabled) {
      walker.yaw -= input.lookX;
      walker.pitch = Math.max(
        -HALF_PI + 0.01,
        Math.min(HALF_PI - 0.01, walker.pitch - input.lookY)
      );
    }
    input.lookX = 0;
    input.lookY = 0;

    const forward = (input.forward ? 1 : 0) - (input.back ? 1 : 0) + input.padY;
    const strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.padX;
    const drive = config.autopilot ? 1 : forward;

    let speed = config.walkSpeed;
    if (input.sprint) {
      speed *= config.sprintMultiplier;
      // Turbo only stacks on a sprint, so a mistimed X during ordinary walking
      // cannot launch the walker down the shaft.
      if (input.turbo) speed *= config.turboMultiplier;
    }

    const { delta, a, b, local } = scratch;
    const length = Math.hypot(drive, strafe);
    // Paced by distance covered rather than by time, so the step rate rises
    // with a sprint and the cycle simply stops where it is when the walker
    // does, instead of marching on the spot.
    const travelled = length > 1e-4 ? speed * dt : 0;
    walker.stride += travelled * config.bobRate;
    const target = travelled > 0 ? 1 : 0;
    walker.gait +=
      (target - walker.gait) * (1 - Math.exp(-config.bobSettle * dt));
    if (length > 1e-4) {
      const nx = strafe / length;
      const nz = drive / length;
      const sin = Math.sin(walker.yaw);
      const cos = Math.cos(walker.yaw);
      // Yaw 0 faces -Z, so forward is (-sin, -cos) and right is (cos, -sin).
      delta.set(
        (nx * cos - nz * sin) * speed * dt,
        0,
        (nx * -sin - nz * cos) * speed * dt
      );
      walker.state = zone.step(walker.state, delta, { a, b }, walker.frame);
    }

    // Recomputed after the step so the frame the geometry is drawn against is
    // the one the walker actually ended the frame in.
    walker.frame = zone.frame(walker.state);

    // Handing over between zones keeps the yaw. The spaces share one
    // coordinate system, so nothing in the world moves at the threshold — a
    // reset here would swing the view for no reason the walker can see.
    const handoff = config.journey
      ? zone.exit?.(walker.state, walker.frame)
      : null;
    if (handoff) {
      const next = zones(handoff.to);
      zoneRef.current = next;
      walker.zone = next;
      walker.state = next.enter ? next.enter(handoff) : next.spawn();
      walker.frame = next.frame(walker.state);
      walker.zoneId = next.id;
      setActive(next.id);
    }

    const live = zoneRef.current;
    live.place(walker.state, walker.position, walker.frame);
    walker.progress = live.progress(walker.state);

    // Rebasing moves the anchor and the camera by the same vector in the same
    // frame, and every streamed piece is placed relative to the anchor, so
    // nothing on screen moves. It exists only to keep the numbers small.
    local.subVectors(walker.position, walker.anchor);
    if (local.lengthSq() > REBASE_RADIUS * REBASE_RADIUS) {
      walker.anchor.copy(walker.position).round();
      local.subVectors(walker.position, walker.anchor);
    }

    if (!config.walkEnabled) return;

    // Two falls per stride vertically, one sway per stride sideways — the
    // asymmetry is what reads as legs rather than as a bobbing camera. Without
    // it a walk at constant height reads as gliding, and the flashlight, which
    // hangs off the eye, has nothing to shake it.
    const bob = Math.sin(walker.stride * 2) * config.bobAmount * walker.gait;
    const sway = Math.sin(walker.stride) * config.bobSway * walker.gait;
    const cos = Math.cos(walker.yaw);
    const sin = Math.sin(walker.yaw);
    camera.position.set(
      local.x + cos * sway,
      local.y + config.eyeHeight + bob,
      local.z - sin * sway
    );
    camera.rotation.set(
      walker.pitch,
      walker.yaw,
      Math.sin(walker.stride) * config.bobRoll * walker.gait,
      'YXZ'
    );
  }, -1);

  return walker;
}
