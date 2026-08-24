import boundaryForce, { clampToHabitat } from './boundaryForce';

// Gentle drift for obstacles: a slowly-changing random heading (classic
// "wander" steering — a small random nudge to velocity each frame reads as
// meandering, unlike fully-random velocity which reads as jittering) plus
// the same habitat boundary containment the flock and hunters use.
// obstacleSpeed of 0 (the default/preset value) keeps obstacles fully
// static, preserving the original behavior and skipping the grid rebuild
// below entirely. Rebuilding obstacleGrid here (rather than once at spawn,
// see useFlockSimulation's buildSim) is what lets stepFlock's obstacle
// avoidance query see current positions.
export default function stepObstacles(sim, params, delta) {
  const { obstaclePos, obstacleVel, obstacleCount, obstacleGrid } = sim;
  const {
    obstacleSpeed,
    obstacleWander,
    boundaryWeight,
    boundaryMargin,
    worldSize,
    habitatShape,
  } = params;

  if (obstacleSpeed <= 0 || obstacleCount === 0) return;

  for (let i = 0; i < obstacleCount; i += 1) {
    const base = i * 3;
    const x = obstaclePos[base];
    const y = obstaclePos[base + 1];
    const z = obstaclePos[base + 2];

    const [boundX, boundY, boundZ] = boundaryForce(
      habitatShape,
      x,
      y,
      z,
      worldSize,
      boundaryMargin
    );

    let vx =
      obstacleVel[base] +
      (Math.random() - 0.5) * obstacleWander +
      boundaryWeight * boundX * delta;
    let vy =
      obstacleVel[base + 1] +
      (Math.random() - 0.5) * obstacleWander +
      boundaryWeight * boundY * delta;
    let vz =
      obstacleVel[base + 2] +
      (Math.random() - 0.5) * obstacleWander +
      boundaryWeight * boundZ * delta;

    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed > obstacleSpeed) {
      const scale = obstacleSpeed / speed;
      vx *= scale;
      vy *= scale;
      vz *= scale;
    }

    obstacleVel[base] = vx;
    obstacleVel[base + 1] = vy;
    obstacleVel[base + 2] = vz;

    obstaclePos[base] = x + vx * delta;
    obstaclePos[base + 1] = y + vy * delta;
    obstaclePos[base + 2] = z + vz * delta;
    clampToHabitat(habitatShape, obstaclePos, obstacleVel, base, worldSize);
  }

  obstacleGrid.clear();
  obstacleGrid.insertAll(obstaclePos, obstacleCount);
}
