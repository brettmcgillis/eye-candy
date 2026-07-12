// Initial spawn layout for a fresh simulation: flock + hunters scattered
// near the center of the box world, obstacles scattered further out so the
// flock doesn't spawn already colliding with one. Box world, not Floids'
// unit sphere — see todo.md "the scene initially should look like the
// boids-js example".
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function createFlockSpawn({ count, worldSize, maxSpeed }) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const spawnExtent = worldSize * 0.3;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    positions[base] = randomRange(-spawnExtent, spawnExtent);
    positions[base + 1] = randomRange(-spawnExtent, spawnExtent);
    positions[base + 2] = randomRange(-spawnExtent, spawnExtent);

    const speed = randomRange(maxSpeed * 0.3, maxSpeed * 0.6);
    const theta = randomRange(0, Math.PI * 2);
    const phi = Math.acos(randomRange(-1, 1));
    velocities[base] = speed * Math.sin(phi) * Math.cos(theta);
    velocities[base + 1] = speed * Math.sin(phi) * Math.sin(theta);
    velocities[base + 2] = speed * Math.cos(phi);
  }

  return { positions, velocities };
}

export function createHunterSpawn({ count, worldSize, maxSpeed }) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const ringRadius = worldSize * 0.35;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    const angle = (i / Math.max(1, count)) * Math.PI * 2;
    positions[base] = Math.cos(angle) * ringRadius;
    positions[base + 1] = randomRange(worldSize * -0.1, worldSize * 0.1);
    positions[base + 2] = Math.sin(angle) * ringRadius;

    const speed = maxSpeed * 0.5;
    velocities[base] = -Math.sin(angle) * speed;
    velocities[base + 1] = 0;
    velocities[base + 2] = Math.cos(angle) * speed;
  }

  return { positions, velocities };
}

export function createObstacleSpawn({
  count,
  worldSize,
  minRadius,
  maxRadius,
}) {
  const positions = new Float32Array(count * 3);
  const radii = new Float32Array(count);
  const innerExclusion = worldSize * 0.15;
  const outerExtent = worldSize * 0.4;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    let x;
    let y;
    let z;
    do {
      x = randomRange(-outerExtent, outerExtent);
      y = randomRange(-outerExtent, outerExtent);
      z = randomRange(-outerExtent, outerExtent);
    } while (Math.hypot(x, y, z) < innerExclusion);

    positions[base] = x;
    positions[base + 1] = y;
    positions[base + 2] = z;
    radii[i] = randomRange(minRadius, maxRadius);
  }

  return { positions, radii };
}
