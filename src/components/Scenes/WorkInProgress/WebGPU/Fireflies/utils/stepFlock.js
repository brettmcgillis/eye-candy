import boundaryForce from './boundaryForce';

// Per-frame boid step: alignment/cohesion/separation (boids-js
// BoidsController.compute*, combined into one grid pass per agent instead of
// three), obstacle avoidance, box-boundary avoidance, and fleeing from any
// hunter within fleeRadius. Mutates sim.flockPos/flockVel/fleeing in place.
export default function stepFlock(sim, params, delta) {
  const {
    flockGrid,
    flockPos,
    flockVel,
    flockCount,
    fleeing,
    obstacleGrid,
    obstaclePos,
    obstacleRadius,
    obstacleMaxRadius,
    hunterPos,
    hunterCount,
  } = sim;
  const {
    alignWeight,
    cohesionWeight,
    separationWeight,
    obstacleWeight,
    fleeWeight,
    boundaryWeight,
    neighborRadius,
    separationRadius,
    obstacleMargin,
    boundaryMargin,
    fleeRadius,
    maxSpeed,
    worldSize,
  } = params;

  flockGrid.clear();
  flockGrid.insertAll(flockPos, flockCount);

  // Alignment/cohesion/separation share one grid pass (see header comment),
  // so the search window has to cover whichever of the two radii is larger
  // — a user can push separationRadius past neighborRadius via Leva, and
  // capping the search at neighborRadius would silently drop separation
  // neighbors beyond it.
  const queryRadius = Math.max(neighborRadius, separationRadius);
  const neighborRadiusSq = neighborRadius * neighborRadius;
  const separationRadiusSq = separationRadius * separationRadius;
  const fleeRadiusSq = fleeRadius * fleeRadius;
  // Obstacles vary in radius (createHabitat's min/max range), so the search
  // window has to cover the largest possible one, not just the margin —
  // otherwise a big obstacle's avoidance radius can exceed the window and
  // get missed entirely.
  const obstacleQueryRadius = obstacleMaxRadius + obstacleMargin;

  for (let i = 0; i < flockCount; i += 1) {
    const base = i * 3;
    const x = flockPos[base];
    const y = flockPos[base + 1];
    const z = flockPos[base + 2];

    let alignX = 0;
    let alignY = 0;
    let alignZ = 0;
    let cohX = 0;
    let cohY = 0;
    let cohZ = 0;
    let sepX = 0;
    let sepY = 0;
    let sepZ = 0;
    let neighborCount = 0;

    flockGrid.forEachNear(x, y, z, queryRadius, (j) => {
      if (j === i) return;
      const jBase = j * 3;
      const dx = x - flockPos[jBase];
      const dy = y - flockPos[jBase + 1];
      const dz = z - flockPos[jBase + 2];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq >= neighborRadiusSq) return;

      neighborCount += 1;
      alignX += flockVel[jBase];
      alignY += flockVel[jBase + 1];
      alignZ += flockVel[jBase + 2];
      cohX += flockPos[jBase];
      cohY += flockPos[jBase + 1];
      cohZ += flockPos[jBase + 2];

      if (distSq > 0 && distSq < separationRadiusSq) {
        const dist = Math.sqrt(distSq);
        sepX += dx / dist / dist;
        sepY += dy / dist / dist;
        sepZ += dz / dist / dist;
      }
    });

    if (neighborCount > 0) {
      alignX /= neighborCount;
      alignY /= neighborCount;
      alignZ /= neighborCount;
      cohX = cohX / neighborCount - x;
      cohY = cohY / neighborCount - y;
      cohZ = cohZ / neighborCount - z;
    }

    let obsX = 0;
    let obsY = 0;
    let obsZ = 0;
    obstacleGrid.forEachNear(x, y, z, obstacleQueryRadius, (j) => {
      const jBase = j * 3;
      const dx = x - obstaclePos[jBase];
      const dy = y - obstaclePos[jBase + 1];
      const dz = z - obstaclePos[jBase + 2];
      const avoidRadius = obstacleRadius[j] + obstacleMargin;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq <= 0 || distSq >= avoidRadius * avoidRadius) return;

      const dist = Math.sqrt(distSq);
      obsX += dx / dist / dist;
      obsY += dy / dist / dist;
      obsZ += dz / dist / dist;
    });

    const [boundX, boundY, boundZ] = boundaryForce(
      x,
      y,
      z,
      worldSize,
      boundaryMargin
    );

    let fleeX = 0;
    let fleeY = 0;
    let fleeZ = 0;
    let isFleeing = false;
    for (let h = 0; h < hunterCount; h += 1) {
      const hBase = h * 3;
      const dx = x - hunterPos[hBase];
      const dy = y - hunterPos[hBase + 1];
      const dz = z - hunterPos[hBase + 2];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < fleeRadiusSq) {
        isFleeing = true;
        const dist = Math.sqrt(distSq) || 0.01;
        fleeX += dx / dist;
        fleeY += dy / dist;
        fleeZ += dz / dist;
      }
    }
    fleeing[i] = isFleeing ? 1 : 0;

    const fx =
      alignWeight * alignX +
      cohesionWeight * cohX +
      separationWeight * sepX +
      obstacleWeight * obsX +
      boundaryWeight * boundX +
      fleeWeight * fleeX;
    const fy =
      alignWeight * alignY +
      cohesionWeight * cohY +
      separationWeight * sepY +
      obstacleWeight * obsY +
      boundaryWeight * boundY +
      fleeWeight * fleeY;
    const fz =
      alignWeight * alignZ +
      cohesionWeight * cohZ +
      separationWeight * sepZ +
      obstacleWeight * obsZ +
      boundaryWeight * boundZ +
      fleeWeight * fleeZ;

    let vx = flockVel[base] + fx * delta;
    let vy = flockVel[base + 1] + fy * delta;
    let vz = flockVel[base + 2] + fz * delta;

    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      vx *= scale;
      vy *= scale;
      vz *= scale;
    }

    flockVel[base] = vx;
    flockVel[base + 1] = vy;
    flockVel[base + 2] = vz;
    flockPos[base] = x + vx * delta;
    flockPos[base + 1] = y + vy * delta;
    flockPos[base + 2] = z + vz * delta;
  }
}
