import * as THREE from 'three/webgpu';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createFloidsSimulation, {
  BASE_HABITAT_RADIUS,
  HABITAT_Y,
  HUNTER_HABITAT_RATIO,
  MAX_HUNTERS,
  WORLD_SCALE,
} from '../utils/createFloidsSimulation';

const SWARM_CHANNEL = 'eyeCandy:fireflies:swarm';
const BROADCAST_HZ = 24;
// Hunter.js CHASE_RADIUS (0.5), scaled — see createFloidsSimulation.js's
// WORLD_SCALE doc comment for the dimensional reasoning.
const HUNTER_SIGHT_RADIUS = 0.5 * WORLD_SCALE;
const HUNTER_SIGHT_RADIUS_SQ = HUNTER_SIGHT_RADIUS ** 2;
// Hunter.js chase()'s divide-by-zero epsilon (0.0025), scaled by
// WORLD_SCALE^2 since it's compared against a squared distance.
const HUNTER_CHASE_EPSILON = 0.0025 * WORLD_SCALE ** 2;
// Hunter.js CHASE_FACTOR (0.3) — governs how hard the hunter accelerates
// toward its weighted prey average. Our weighting (1/max(distSq, eps))
// isn't byte-identical to Hunter.js's own chase() (1/(distSq+eps) then a
// clampLength(0,3) before this factor is applied), so this is an
// adaptation of the coefficient to a structurally similar-but-not-
// identical formula, not a literal transcription — flagged rather than
// presented as more precise than it is.
const HUNTER_CHASE_FACTOR = 0.3;
// Small spawn-time spread so up to 3 hunters don't stack at the same point.
const HUNTER_SPAWN_OFFSETS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(3.4, 0, 2.1),
  new THREE.Vector3(-3.2, 0, -2.4),
];
const HUNTER_HOME_CENTER = new THREE.Vector3(0, HABITAT_Y, 0);
const hunterOffset = new THREE.Vector3();
const cursorPosition = new THREE.Vector3();
const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -HABITAT_Y);

// Host-authoritative shared swarm: only the elected host window (the
// lowest-id alive window — see src/modules/windowSync/WindowRegistry.js)
// actually steps the flock + hunter physics. It's one continuous
// flock/habitat shared across every alive window's screen, simulated once
// rather than once per tab, publishing positions over a throttled
// BroadcastChannel; every window (host included) renders from that shared
// buffer. Mirrors CrossTalk's useFluidSim host-authoritative pattern.
//
// Cursor interaction only reacts to the HOST window's own pointer — a
// deliberate simplification (relaying every window's pointer to the host
// would need its own broadcast channel for comparatively little payoff),
// not a bug. See todo.md.
export default function useSharedSwarm({ config, isHost, windows }) {
  const { camera, pointer, raycaster } = useThree();
  const simulationRef = useRef(null);
  const positionsRef = useRef(new Float32Array(0));
  const clocksRef = useRef(new Float32Array(0));
  const hunterPositionsRef = useRef(new Float32Array(MAX_HUNTERS * 3));
  const hunterCountRef = useRef(0);
  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const hunterPositions = useMemo(
    () =>
      HUNTER_SPAWN_OFFSETS.map(
        (spawn) => new THREE.Vector3(spawn.x, HABITAT_Y + spawn.y, spawn.z)
      ),
    []
  );
  const hunterVelocities = useMemo(
    () => HUNTER_SPAWN_OFFSETS.map(() => new THREE.Vector3(0.12, 0, 0.08)),
    []
  );

  // Grows with the number of alive windows so opening another tab actually
  // gives the shared flock more room, not just a different viewport onto
  // the same fixed-size habitat.
  const habitatRadius = useMemo(
    () => BASE_HABITAT_RADIUS * Math.sqrt(Math.max(1, windows.length)),
    [windows.length]
  );

  useEffect(() => {
    channelRef.current = new BroadcastChannel(SWARM_CHANNEL);
    return () => channelRef.current.close();
  }, []);

  // Non-host windows just copy whatever the host last published — they
  // never touch the solver.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return undefined;

    const onMessage = (event) => {
      if (isHost) return;
      const {
        clocks,
        hunterCount,
        hunterPositions: hp,
        positions,
      } = event.data;
      if (positionsRef.current.length !== positions.length) {
        positionsRef.current = new Float32Array(positions.length);
      }
      positionsRef.current.set(positions);
      if (clocksRef.current.length !== clocks.length) {
        clocksRef.current = new Float32Array(clocks.length);
      }
      clocksRef.current.set(clocks);
      hunterPositionsRef.current.set(hp);
      hunterCountRef.current = hunterCount;
    };

    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [isHost]);

  // (Re)build the solver whenever this window becomes host, or the flock
  // count changes. A fresh host after the previous one closed always starts
  // a brand-new flock rather than trying to recover unrecoverable in-memory
  // state — matches useFluidSim's own restart model.
  useEffect(() => {
    if (!isHost) {
      simulationRef.current = null;
      return undefined;
    }

    const simulation = createFloidsSimulation(
      config.fireflyCount,
      config,
      habitatRadius
    );
    simulationRef.current = simulation;
    positionsRef.current = simulation.positions;
    clocksRef.current = simulation.clocks;
    hunterPositions.forEach((position, index) => {
      const spawn = HUNTER_SPAWN_OFFSETS[index];
      position.set(spawn.x, HABITAT_Y + spawn.y, spawn.z);
    });
    hunterVelocities.forEach((velocity) => velocity.set(0.12, 0, 0.08));

    return () => {
      simulationRef.current = null;
    };
    // habitatRadius intentionally excluded from the dependency list — it's
    // read live inside useFrame below via the closure, and shouldn't tear
    // down/reseed the flock every time a sibling window opens or closes.
  }, [isHost, config.fireflyCount]);

  useFrame((_, rawDelta) => {
    if (!isHost) return;
    const simulation = simulationRef.current;
    if (!simulation) return;

    const delta = Math.min(rawDelta, 1 / 30);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(pointerPlane, cursorPosition);

    const activeHunterCount = config.hunterCount;
    for (let h = 0; h < HUNTER_SPAWN_OFFSETS.length; h += 1) {
      if (h < activeHunterCount) {
        const hunterPosition = hunterPositions[h];
        let preyX = 0;
        let preyY = 0;
        let preyZ = 0;
        let preyCount = 0;
        for (let index = 0; index < config.fireflyCount; index += 1) {
          const offset = index * 3;
          const dx = simulation.positions[offset] - hunterPosition.x;
          const dy = simulation.positions[offset + 1] - hunterPosition.y;
          const dz = simulation.positions[offset + 2] - hunterPosition.z;
          const distanceSq = dx * dx + dy * dy + dz * dz;
          if (distanceSq < HUNTER_SIGHT_RADIUS_SQ) {
            const weight = 1 / Math.max(distanceSq, HUNTER_CHASE_EPSILON);
            preyX += dx * weight;
            preyY += dy * weight;
            preyZ += dz * weight;
            preyCount += 1;
          }
        }

        const velocity = hunterVelocities[h];
        if (preyCount) {
          velocity.x += (preyX / preyCount) * delta * HUNTER_CHASE_FACTOR;
          velocity.y += (preyY / preyCount) * delta * HUNTER_CHASE_FACTOR;
          velocity.z += (preyZ / preyCount) * delta * HUNTER_CHASE_FACTOR;
        }
        hunterOffset.copy(hunterPosition).sub(HUNTER_HOME_CENTER);
        const homeRadius = habitatRadius * HUNTER_HABITAT_RATIO;
        if (hunterOffset.lengthSq() > homeRadius * homeRadius) {
          velocity.addScaledVector(hunterOffset, -0.5 * delta);
        }
        velocity.setLength(config.hunterSpeed * WORLD_SCALE);
        hunterPosition.addScaledVector(velocity, delta);

        const hOffset = h * 3;
        hunterPositionsRef.current[hOffset] = hunterPosition.x;
        hunterPositionsRef.current[hOffset + 1] = hunterPosition.y;
        hunterPositionsRef.current[hOffset + 2] = hunterPosition.z;
      }
    }
    hunterCountRef.current = activeHunterCount;

    simulation.step(
      delta,
      config,
      hunterPositionsRef.current,
      activeHunterCount,
      {
        mode: config.cursorMode,
        position: cursorPosition,
        radius: config.cursorRadius * 0.02,
      },
      habitatRadius
    );

    const now = performance.now();
    if (now - lastBroadcastRef.current >= 1000 / BROADCAST_HZ) {
      lastBroadcastRef.current = now;
      channelRef.current?.postMessage({
        clocks: simulation.clocks.slice(),
        hunterCount: activeHunterCount,
        hunterPositions: hunterPositionsRef.current.slice(),
        positions: simulation.positions.slice(),
      });
    }
  });

  return {
    clocksRef,
    habitatRadius,
    hunterCountRef,
    hunterPositionsRef,
    positionsRef,
  };
}
