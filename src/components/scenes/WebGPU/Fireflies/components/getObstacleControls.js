import { folder } from 'leva';

// Obstacles the flock steers around (boids-js's obstacle entities — Floids
// has no equivalent). obstacleCount can go to 0 to disable them entirely;
// Obstacles.jsx skips rendering when it does. obstacleSpeed defaults to 0
// (fully static, the original behavior) — above 0, stepObstacles.js gives
// them a gentle wander plus the same habitat boundary containment the flock
// and hunters use, and rebuilds obstacleGrid every frame so the flock's
// avoidance query stays current. obstacleWander only matters once moving.
export default function getObstacleControls(p) {
  return folder(
    {
      obstacleCount: { value: p.obstacleCount, min: 0, max: 20, step: 1 },
      obstacleMinRadius: {
        value: p.obstacleMinRadius,
        min: 0.2,
        max: 5,
        step: 0.1,
      },
      obstacleMaxRadius: {
        value: p.obstacleMaxRadius,
        min: 0.2,
        max: 8,
        step: 0.1,
      },
      obstacleSpeed: {
        value: p.obstacleSpeed,
        min: 0,
        max: 10,
        step: 0.25,
        label: 'Move Speed',
      },
      obstacleWander: {
        value: p.obstacleWander,
        min: 0,
        max: 10,
        step: 0.25,
        label: 'Wander Strength',
      },
      obstacleColor: { value: p.obstacleColor, label: 'Obstacle Color' },
    },
    { collapsed: true }
  );
}
