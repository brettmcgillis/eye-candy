const ALIGN_FACTOR = 0.05;
const AVOID_FACTOR = 30;
const COHERE_FACTOR = 5;
const CONFUSION_FACTOR = 0.2;
const FLEE_FACTOR = 3;
const HABITAT_FACTOR = 0.1;
const HABITAT_RADIUS = 8;
const NUDGE_FACTOR = 0.01;
const NUDGE_LIMIT = 3;
const TAU_SPEED = 0.01;
const HABITAT_Y = 3.5;

function getControls(config) {
  return {
    desiredSpeed: config.fireflySpeed * 0.22,
    fireCycle: config.fireCycle,
    fleeRadius: config.hunterRadius * 0.13,
    protectedRadius: config.separationRadius * 0.026,
    visibleRadius: config.neighborRadius * 0.026,
  };
}

/* eslint-disable no-param-reassign */
function seedSphere(positions, velocities, clocks, index, controls) {
  const offset = index * 3;
  const radius = Math.cbrt(Math.random()) * HABITAT_RADIUS * 0.9;
  const theta = Math.random() * Math.PI * 2;
  const y = Math.random() * 2 - 1;
  const planar = Math.sqrt(1 - y * y);
  positions[offset] = radius * planar * Math.cos(theta);
  positions[offset + 1] = radius * y + HABITAT_Y;
  positions[offset + 2] = radius * planar * Math.sin(theta);
  velocities[offset] = (Math.random() * 2 - 1) * (controls.desiredSpeed / 5);
  velocities[offset + 1] =
    (Math.random() * 2 - 1) * (controls.desiredSpeed / 5);
  velocities[offset + 2] =
    (Math.random() * 2 - 1) * (controls.desiredSpeed / 5);
  clocks[index] = Math.random() * controls.fireCycle;
}

// Faithful CPU port of Floids' Agents.tick(): force accumulation reads stable
// position/velocity arrays, then a second pass integrates all agents together.
export default function createFloidsSimulation(count, config) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const nextVelocities = new Float32Array(count * 3);
  const clocks = new Float32Array(count);
  const nudges = new Uint8Array(count);
  const controls = getControls(config);

  for (let index = 0; index < count; index += 1) {
    seedSphere(positions, velocities, clocks, index, controls);
  }

  function step(delta, nextConfig, hunterPosition, cursor) {
    const dt = Math.min(delta, 1 / 30);
    Object.assign(controls, getControls(nextConfig));
    const visibleRadiusSq = controls.visibleRadius ** 2;
    const protectedRadiusSq = controls.protectedRadius ** 2;
    const fleeRadiusSq = controls.fleeRadius ** 2;

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const px = positions[offset];
      const py = positions[offset + 1];
      const pz = positions[offset + 2];
      let alignX = 0;
      let alignY = 0;
      let alignZ = 0;
      let cohereX = 0;
      let cohereY = 0;
      let cohereZ = 0;
      let avoidX = 0;
      let avoidY = 0;
      let avoidZ = 0;
      let neighbors = 0;

      clocks[index] += dt;
      if (clocks[index] >= controls.fireCycle) {
        clocks[index] %= controls.fireCycle;
      }

      for (let other = 0; other < count; other += 1) {
        if (other !== index) {
          const otherOffset = other * 3;
          const dx = positions[otherOffset] - px;
          const dy = positions[otherOffset + 1] - py;
          const dz = positions[otherOffset + 2] - pz;
          const distanceSq = dx * dx + dy * dy + dz * dz;
          if (distanceSq < visibleRadiusSq) {
            neighbors += 1;
            alignX += velocities[otherOffset];
            alignY += velocities[otherOffset + 1];
            alignZ += velocities[otherOffset + 2];
            cohereX += positions[otherOffset];
            cohereY += positions[otherOffset + 1];
            cohereZ += positions[otherOffset + 2];
            if (distanceSq < protectedRadiusSq) {
              avoidX += dx;
              avoidY += dy;
              avoidZ += dz;
            }
            if (clocks[other] < dt) {
              nudges[index] = Math.min(NUDGE_LIMIT, nudges[index] + 1);
            }
          }
        }
      }

      let forceX = 0;
      let forceY = 0;
      let forceZ = 0;
      if (neighbors) {
        forceX += (alignX / neighbors - velocities[offset]) * ALIGN_FACTOR;
        forceY += (alignY / neighbors - velocities[offset + 1]) * ALIGN_FACTOR;
        forceZ += (alignZ / neighbors - velocities[offset + 2]) * ALIGN_FACTOR;
        forceX += (cohereX / neighbors - px) * COHERE_FACTOR;
        forceY += (cohereY / neighbors - py) * COHERE_FACTOR;
        forceZ += (cohereZ / neighbors - pz) * COHERE_FACTOR;
        forceX -= avoidX * AVOID_FACTOR;
        forceY -= avoidY * AVOID_FACTOR;
        forceZ -= avoidZ * AVOID_FACTOR;
      }

      const hunterX = px - hunterPosition.x;
      const hunterY = py - hunterPosition.y;
      const hunterZ = pz - hunterPosition.z;
      const hunterDistanceSq =
        hunterX * hunterX + hunterY * hunterY + hunterZ * hunterZ;
      if (hunterDistanceSq < fleeRadiusSq && hunterDistanceSq > 0.000001) {
        const inverseDistance = 1 / Math.sqrt(hunterDistanceSq);
        forceX += hunterX * inverseDistance * FLEE_FACTOR;
        forceY += hunterY * inverseDistance * FLEE_FACTOR;
        forceZ += hunterZ * inverseDistance * FLEE_FACTOR;
        clocks[index] = Math.max(
          0,
          clocks[index] - controls.fireCycle * CONFUSION_FACTOR * Math.random()
        );
      }

      const habitatX = px;
      const habitatY = py - HABITAT_Y;
      const habitatZ = pz;
      if (
        habitatX * habitatX + habitatY * habitatY + habitatZ * habitatZ >
        HABITAT_RADIUS ** 2
      ) {
        forceX -= habitatX * HABITAT_FACTOR;
        forceY -= habitatY * HABITAT_FACTOR;
        forceZ -= habitatZ * HABITAT_FACTOR;
      }

      if (cursor.mode !== 'off') {
        const cursorX = cursor.position.x - px;
        const cursorY = cursor.position.y - py;
        const cursorZ = cursor.position.z - pz;
        const cursorDistance = Math.hypot(cursorX, cursorY, cursorZ);
        if (cursorDistance < cursor.radius && cursorDistance > 0.000001) {
          const sign = cursor.mode === 'attract' ? 1 : -1;
          const strength = sign * (1 - cursorDistance / cursor.radius) * 3;
          forceX += (cursorX / cursorDistance) * strength;
          forceY += (cursorY / cursorDistance) * strength;
          forceZ += (cursorZ / cursorDistance) * strength;
        }
      }

      let vx = velocities[offset] + forceX * dt;
      let vy = velocities[offset + 1] + forceY * dt;
      let vz = velocities[offset + 2] + forceZ * dt;
      const speed = Math.hypot(vx, vy, vz);
      if (speed > 0.000001) {
        const restore = (controls.desiredSpeed - speed) * (dt / TAU_SPEED);
        vx += (vx / speed) * restore;
        vy += (vy / speed) * restore;
        vz += (vz / speed) * restore;
      }
      nextVelocities[offset] = vx;
      nextVelocities[offset + 1] = vy;
      nextVelocities[offset + 2] = vz;
    }

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const clockPhase =
        (Math.PI * 2 * (controls.fireCycle - clocks[index])) /
        controls.fireCycle;
      clocks[index] += Math.sin(clockPhase) * nudges[index] * NUDGE_FACTOR;
      nudges[index] = 0;
      velocities[offset] = nextVelocities[offset];
      velocities[offset + 1] = nextVelocities[offset + 1];
      velocities[offset + 2] = nextVelocities[offset + 2];
      positions[offset] += velocities[offset] * dt;
      positions[offset + 1] += velocities[offset + 1] * dt;
      positions[offset + 2] += velocities[offset + 2] * dt;
    }
  }

  return { clocks, positions, step, velocities };
}
