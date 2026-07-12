import boundaryForce from './boundaryForce';

// Hunter chase, ported from Floids' Hunter.js tick()/chase()/
// restoreVelocity(), swapping its spherical habitat constraint for the same
// box-boundary force the flock uses. Brute-force over the flock (hunter
// count is tiny — up to a handful) rather than a grid query, since Floids'
// own grid.findNear() is just an optimization for a bigger prey set than
// this scene needs.
export default function stepHunters(sim, params, delta) {
  const { hunterPos, hunterVel, hunterCount, flockPos, flockCount } = sim;
  const {
    chaseFactor,
    chaseEpsilon,
    sightRadius,
    desiredSpeed,
    restoreTau,
    boundaryWeight,
    boundaryMargin,
    worldSize,
    maxHunterSpeed,
  } = params;

  const sightRadiusSq = sightRadius * sightRadius;

  for (let h = 0; h < hunterCount; h += 1) {
    const base = h * 3;
    const x = hunterPos[base];
    const y = hunterPos[base + 1];
    const z = hunterPos[base + 2];

    let chaseX = 0;
    let chaseY = 0;
    let chaseZ = 0;
    let preyCount = 0;

    for (let p = 0; p < flockCount; p += 1) {
      const pBase = p * 3;
      const dx = flockPos[pBase] - x;
      const dy = flockPos[pBase + 1] - y;
      const dz = flockPos[pBase + 2] - z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < sightRadiusSq) {
        const weight = 1 / (distSq + chaseEpsilon);
        chaseX += dx * weight;
        chaseY += dy * weight;
        chaseZ += dz * weight;
        preyCount += 1;
      }
    }

    if (preyCount > 0) {
      const norm = 1 / Math.max(preyCount, 10);
      chaseX *= norm;
      chaseY *= norm;
      chaseZ *= norm;
    }

    const [boundX, boundY, boundZ] = boundaryForce(
      x,
      y,
      z,
      worldSize,
      boundaryMargin
    );

    const vx = hunterVel[base];
    const vy = hunterVel[base + 1];
    const vz = hunterVel[base + 2];
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const restoreScale = (desiredSpeed - speed) / restoreTau;

    const fx =
      chaseFactor * chaseX + boundaryWeight * boundX + vx * restoreScale;
    const fy =
      chaseFactor * chaseY + boundaryWeight * boundY + vy * restoreScale;
    const fz =
      chaseFactor * chaseZ + boundaryWeight * boundZ + vz * restoreScale;

    let nvx = vx + fx * delta;
    let nvy = vy + fy * delta;
    let nvz = vz + fz * delta;

    const newSpeed = Math.sqrt(nvx * nvx + nvy * nvy + nvz * nvz);
    if (newSpeed > maxHunterSpeed) {
      const scale = maxHunterSpeed / newSpeed;
      nvx *= scale;
      nvy *= scale;
      nvz *= scale;
    }

    hunterVel[base] = nvx;
    hunterVel[base + 1] = nvy;
    hunterVel[base + 2] = nvz;
    hunterPos[base] = x + nvx * delta;
    hunterPos[base + 1] = y + nvy * delta;
    hunterPos[base + 2] = z + nvz * delta;
  }
}
