import { useCallback, useMemo, useRef } from 'react';

import {
  createFlockSpawn,
  createHunterSpawn,
  createObstacleSpawn,
} from '../utils/createHabitat';
import createSpatialGrid from '../utils/createSpatialGrid';
import stepFlash from '../utils/stepFlash';
import stepFlock from '../utils/stepFlock';
import stepHunters from '../utils/stepHunters';
import stepObstacles from '../utils/stepObstacles';

// Delta is clamped the same way Floids' World.tick() does, to keep a tab
// coming back from the background (or a stutter) from feeding the sim one
// huge delta that blows agents miles off course in a single step.
const MAX_DELTA = 0.05;

function buildSim(c) {
  const flock = createFlockSpawn({
    count: c.fireflyCount,
    maxSpeed: c.maxSpeed,
    worldSize: c.worldSize,
    habitatShape: c.habitatShape,
  });
  const hunters = createHunterSpawn({
    count: c.hunterCount,
    maxSpeed: c.hunterSpeed,
    worldSize: c.worldSize,
  });
  const obstacles = createObstacleSpawn({
    count: c.obstacleCount,
    maxRadius: c.obstacleMaxRadius,
    minRadius: c.obstacleMinRadius,
    worldSize: c.worldSize,
    habitatShape: c.habitatShape,
  });

  const cellSize = c.worldSize / c.subDivisionCount;
  const flockGrid = createSpatialGrid({ cellSize, worldSize: c.worldSize });
  // Rebuilt every frame by stepObstacles when obstacleSpeed > 0; otherwise
  // (the default) obstacles never move and this initial build is the only
  // one that ever happens.
  const obstacleGrid = createSpatialGrid({ cellSize, worldSize: c.worldSize });
  obstacleGrid.insertAll(obstacles.positions, c.obstacleCount);

  return {
    flockClock: Float32Array.from(
      { length: c.fireflyCount },
      () => Math.random() * c.flashCycle
    ),
    flockCount: c.fireflyCount,
    flockFlash: new Float32Array(c.fireflyCount),
    flockGrid,
    flockNudge: new Float32Array(c.fireflyCount),
    flockPos: flock.positions,
    flockVel: flock.velocities,
    fleeing: new Uint8Array(c.fireflyCount),
    hunterCount: c.hunterCount,
    hunterPos: hunters.positions,
    hunterVel: hunters.velocities,
    obstacleCount: c.obstacleCount,
    obstacleGrid,
    // Kept alongside the per-obstacle radii so stepFlock can size its
    // obstacle-grid query window to the largest obstacle that could
    // possibly be spawned, not just whatever obstacleMargin happens to be.
    obstacleMaxRadius: c.obstacleMaxRadius,
    obstaclePos: obstacles.positions,
    obstacleRadius: obstacles.radii,
    obstacleVel: new Float32Array(c.obstacleCount * 3),
  };
}

// Owns the flock/hunter/obstacle typed-array simulation state and the
// per-frame step that advances it. Structural controls (counts, world size,
// grid resolution, obstacle radius range, or the Respawn button's tick)
// rebuild the whole simulation from scratch; every other control is read
// fresh each frame via configRef, so e.g. dragging a weight slider retunes
// live agents instead of respawning them.
export default function useFlockSimulation(config) {
  const configRef = useRef(config);
  configRef.current = config;

  const sim = useMemo(
    () => buildSim(config),
    [
      config.fireflyCount,
      config.hunterCount,
      config.obstacleCount,
      config.obstacleMaxRadius,
      config.obstacleMinRadius,
      config.respawnTick,
      config.subDivisionCount,
      config.worldSize,
    ]
  );

  const simRef = useRef(sim);
  simRef.current = sim;

  const step = useCallback((rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DELTA);
    const c = configRef.current;
    const params = {
      alignWeight: c.alignWeight,
      boundaryMargin: c.boundaryMargin,
      boundaryWeight: c.boundaryWeight,
      chaseEpsilon: c.chaseEpsilon,
      chaseFactor: c.chaseFactor,
      cohesionWeight: c.cohesionWeight,
      confusionFactor: c.confusionFactor,
      desiredSpeed: c.hunterSpeed,
      fleeRadius: c.fleeRadius,
      fleeWeight: c.fleeWeight,
      flashCycle: c.flashCycle,
      flashDecayRate: c.flashDecayRate,
      habitatShape: c.habitatShape,
      maxHunterSpeed: c.hunterMaxSpeed,
      maxSpeed: c.maxSpeed,
      neighborRadius: c.neighborRadius,
      nudgeFactor: c.nudgeFactor,
      nudgeLimit: c.nudgeLimit,
      obstacleMargin: c.obstacleMargin,
      obstacleSpeed: c.obstacleSpeed,
      obstacleWander: c.obstacleWander,
      obstacleWeight: c.obstacleWeight,
      restoreTau: c.restoreTau,
      separationRadius: c.separationRadius,
      separationWeight: c.separationWeight,
      sightRadius: c.sightRadius,
      worldSize: c.worldSize,
    };

    // Obstacles move first so stepFlock's avoidance query sees this frame's
    // positions, not last frame's.
    stepObstacles(simRef.current, params, delta);
    stepFlock(simRef.current, params, delta);
    stepFlash(simRef.current, params, delta);
    stepHunters(simRef.current, params, delta);
  }, []);

  return { simRef, step };
}
