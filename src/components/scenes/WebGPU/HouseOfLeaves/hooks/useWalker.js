import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { fbm1 } from '@modules/houseOfLeaves';

import { wrapAngle } from '../utils/frames';
import useInput from './useInput';

const HALF_PI = Math.PI / 2;
const START_KINDS = {
  'Living Room': 'livingRoom',
  Hallway: 'corridor',
  'Great Room': 'greatRoom',
  Staircase: 'shaft',
  Floor: 'shaftFloor',
  'Way Back': 'returnCorridor',
};
// Far enough out that the walk never reaches it in a session, close enough in
// that world coordinates stay small enough for shader-side noise to keep its
// precision.
const REBASE_RADIUS = 400;

// The walker owns the camera. Directed, it does what the director asks —
// a drive and a look target; in the debug walk it does what the keys ask.
// Either way the zone it is standing in decides where a step can go, and the
// world hands it from one zone to the next at the thresholds.
//
// Runs at priority -1 so it resolves the frame's position before anything
// that streams geometry around it.
export default function useWalker(config, world, director) {
  const camera = useThree((state) => state.camera);
  const input = useInput({
    enabled: config.walkEnabled && !config.directed,
    lookSensitivity: config.lookSensitivity,
  });

  const walker = useMemo(
    () => ({
      anchor: new THREE.Vector3(),
      position: new THREE.Vector3(),
      zone: null,
      zoneId: null,
      lap: 0,
      state: null,
      progress: 0,
      yaw: 0,
      pitch: 0,
      stride: 0,
      gait: 0,
      speed: 0,
      eyeHeight: 1.65,
      elapsed: 0,
      // What the director writes and the walker reads.
      drive: {
        forward: 0,
        strafe: 0,
        speed: 1.4,
        yaw: 0,
        pitch: 0,
        eyeHeight: 1.65,
        lookLag: 4,
        handheld: 1,
      },
      // Handed to the zones so they can resolve steps without allocating.
      scratch: {
        delta: new THREE.Vector3(),
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        local: new THREE.Vector3(),
      },
    }),
    []
  );

  const [, setActive] = useState(null);
  const worldRef = useRef(null);

  // A new world (the layout changed) restarts the walk.
  useEffect(() => {
    worldRef.current = world;
    const zone = world.startAt(START_KINDS[config.startZone] ?? 'livingRoom');
    walker.zone = zone;
    walker.zoneId = zone.id;
    walker.lap = zone.lap;
    walker.state = zone.spawn();
    walker.anchor.set(0, 0, 0);
    walker.yaw = zone.facing(walker.state, walker.scratch);
    walker.pitch = 0;
    walker.stride = 0;
    walker.gait = 0;
    walker.elapsed = 0;
    walker.eyeHeight = config.eyeHeight;
    walker.drive.yaw = walker.yaw;
    walker.drive.pitch = 0;
    walker.drive.eyeHeight = config.eyeHeight;
    walker.drive.speed = config.walkSpeed;
    director?.reset?.();
    setActive(zone.id);
  }, [director, walker, world]);

  useFrame((_, rawDelta) => {
    const { zone } = walker;
    if (!zone || !walker.state) return;
    const dt = Math.min(rawDelta, 1 / 20);
    walker.elapsed += dt;
    const { drive } = walker;

    if (config.directed) director?.update(walker, dt);

    let forward;
    let strafe;
    let speed;
    if (config.directed) {
      const lag = 1 - Math.exp(-drive.lookLag * dt);
      walker.yaw += wrapAngle(drive.yaw - walker.yaw) * lag;
      walker.pitch += (drive.pitch - walker.pitch) * lag;
      forward = drive.forward;
      strafe = drive.strafe;
      speed = drive.speed;
      walker.eyeHeight +=
        (drive.eyeHeight - walker.eyeHeight) * (1 - Math.exp(-2.5 * dt));
    } else {
      if (config.walkEnabled) {
        walker.yaw -= input.lookX;
        walker.pitch = Math.max(
          -HALF_PI + 0.01,
          Math.min(HALF_PI - 0.01, walker.pitch - input.lookY)
        );
      }
      forward = (input.forward ? 1 : 0) - (input.back ? 1 : 0) + input.padY;
      strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.padX;
      speed = config.walkSpeed;
      if (input.sprint) speed *= config.sprintMultiplier;
      walker.eyeHeight = config.eyeHeight;
    }
    input.lookX = 0;
    input.lookY = 0;

    const { delta, a, b, local } = walker.scratch;
    const length = Math.hypot(forward, strafe);
    // Paced by distance covered rather than by time, so the step rate rises
    // with a run and the cycle simply stops where it is when the walker does.
    const travelled = length > 1e-4 ? speed * dt : 0;
    walker.speed = length > 1e-4 ? speed : 0;
    walker.stride += travelled * config.bobRate;
    const target = travelled > 0 ? 1 : 0;
    walker.gait +=
      (target - walker.gait) * (1 - Math.exp(-config.bobSettle * dt));
    if (length > 1e-4) {
      const nx = strafe / length;
      const nz = forward / length;
      const sin = Math.sin(walker.yaw);
      const cos = Math.cos(walker.yaw);
      // Yaw 0 faces -Z, so forward is (-sin, -cos) and right is (cos, -sin).
      delta.set(
        (nx * cos - nz * sin) * speed * dt,
        0,
        (nx * -sin - nz * cos) * speed * dt
      );
      walker.state = zone.step(walker.state, delta, { a, b });
    }

    // Handing over between zones keeps the yaw. The spaces share one
    // coordinate system, so nothing in the world moves at the threshold.
    const handoff = zone.exit?.(walker.state);
    if (handoff) {
      const next = worldRef.current.next(zone, handoff);
      walker.zone = next;
      walker.state = next.enter ? next.enter(handoff) : next.spawn();
      walker.zoneId = next.id;
      walker.lap = next.lap;
      director?.onZone?.(walker, next);
      setActive(next.id);
    }

    const live = walker.zone;
    live.place(walker.state, walker.position);
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
    // asymmetry is what reads as legs rather than as a bobbing camera. A run
    // bobs harder than a walk.
    const pace = Math.min(2, walker.speed / Math.max(0.1, config.walkSpeed));
    const bobScale = walker.gait * (0.6 + 0.4 * pace);
    const bob = Math.sin(walker.stride * 2) * config.bobAmount * bobScale;
    const sway = Math.sin(walker.stride) * config.bobSway * bobScale;
    // Handheld: a slow wander of the frame even at rest, from the same fbm
    // the architecture drifts with. Never applied to the walker's own yaw,
    // so the director's targets stay exact.
    const hand = config.handheld * drive.handheld;
    const t = walker.elapsed;
    const handYaw = fbm1(t * 0.35 + 3.1, 3) * 0.05 * hand;
    const handPitch = fbm1(t * 0.41 + 17.3, 3) * 0.035 * hand;
    const handRoll = fbm1(t * 0.27 + 41.9, 3) * 0.02 * hand;
    const cos = Math.cos(walker.yaw);
    const sin = Math.sin(walker.yaw);
    camera.position.set(
      local.x + cos * sway,
      local.y + walker.eyeHeight + bob,
      local.z - sin * sway
    );
    camera.rotation.set(
      walker.pitch + handPitch,
      walker.yaw + handYaw,
      Math.sin(walker.stride) * config.bobRoll * bobScale + handRoll,
      'YXZ'
    );
  }, -1);

  return walker;
}
