// Initial spawn layout for a fresh simulation: flock + hunters scattered
// near the center of the box world, obstacles scattered further out so the
// flock doesn't spawn already colliding with one. Box world, not Floids'
// unit sphere — see todo.md "the scene initially should look like the
// boids-js example".
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Rejection-sampled uniform point within a sphere of the given radius —
// cheap at these agent counts (a handful of retries at worst) and avoids
// the corner-biased density a naive spherical-coordinate sample would give.
function randomInSphere(radius) {
  let x;
  let y;
  let z;
  do {
    x = randomRange(-radius, radius);
    y = randomRange(-radius, radius);
    z = randomRange(-radius, radius);
  } while (x * x + y * y + z * z > radius * radius);
  return [x, y, z];
}

export function createFlockSpawn({ count, worldSize, maxSpeed, habitatShape }) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const spawnExtent = worldSize * 0.3;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    if (habitatShape === 'sphere') {
      const [x, y, z] = randomInSphere(spawnExtent);
      positions[base] = x;
      positions[base + 1] = y;
      positions[base + 2] = z;
    } else {
      positions[base] = randomRange(-spawnExtent, spawnExtent);
      positions[base + 1] = randomRange(-spawnExtent, spawnExtent);
      positions[base + 2] = randomRange(-spawnExtent, spawnExtent);
    }

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
  habitatShape,
}) {
  const positions = new Float32Array(count * 3);
  const radii = new Float32Array(count);
  const innerExclusion = worldSize * 0.15;
  const outerExtent = worldSize * 0.4;
  // Cube corner-sampling can land outside a sphere habitat (worldSize * 0.4
  // reaches worldSize * 0.4 * sqrt(3) at the corners, past the sphere's
  // worldSize * 0.5 radius) — reject those too when the habitat is a sphere.
  const sphereExtent = worldSize * 0.45;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    let x;
    let y;
    let z;
    let dist;
    do {
      x = randomRange(-outerExtent, outerExtent);
      y = randomRange(-outerExtent, outerExtent);
      z = randomRange(-outerExtent, outerExtent);
      dist = Math.hypot(x, y, z);
    } while (
      dist < innerExclusion ||
      (habitatShape === 'sphere' && dist > sphereExtent)
    );

    positions[base] = x;
    positions[base + 1] = y;
    positions[base + 2] = z;
    radii[i] = randomRange(minRadius, maxRadius);
  }

  return { positions, radii };
}
