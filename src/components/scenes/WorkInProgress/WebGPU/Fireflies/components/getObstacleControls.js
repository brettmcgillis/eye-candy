import { folder } from 'leva';

// Static obstacles the flock steers around (boids-js's obstacle entities —
// Floids has no equivalent). obstacleCount can go to 0 to disable them
// entirely; Obstacles.jsx skips rendering when it does.
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
      obstacleColor: { value: p.obstacleColor, label: 'Obstacle Color' },
    },
    { collapsed: true }
  );
}
