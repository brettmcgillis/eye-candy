/* eslint-disable no-param-reassign */
import * as THREE from 'three';

import { sceneDistance, sceneGradient } from './treeDistance';

// Probe directions on a Fibonacci sphere. Built once: the agent re-uses the
// same set every frame and only weighs them differently.
const PROBE_COUNT = 32;
const PROBES = Array.from({ length: PROBE_COUNT }, (unused, i) => {
  const y = 1 - (2 * (i + 0.5)) / PROBE_COUNT;
  const radius = Math.sqrt(Math.max(1 - y * y, 0));
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return new THREE.Vector3(
    Math.cos(theta) * radius,
    y,
    Math.sin(theta) * radius
  );
});

const PROBE_STEPS = 10;
const WANDER_RATES = [Math.sqrt(0.5), Math.sqrt(0.31), Math.sqrt(0.17)];

const scratchDir = new THREE.Vector3();
const scratchGrad = new THREE.Vector3();
const desired = new THREE.Vector3();
const toPivot = new THREE.Vector3();

export function createAgent(spawn) {
  return {
    clearance: 0,
    dwell: 0,
    elapsed: 0,
    heading: new THREE.Vector3(0, 0, 1),
    peering: false,
    position: new THREE.Vector3().copy(spawn),
    speed: 0,
    spawn: new THREE.Vector3().copy(spawn),
  };
}

// How far the field lets us see along `dir` before a branch gets in the way.
// A short sphere-trace, deliberately cheap — this runs once per probe.
function openness(origin, dir, field, range, safety) {
  let t = 0.005;

  for (let i = 0; i < PROBE_STEPS; i += 1) {
    const d = sceneDistance(
      origin.x + dir.x * t,
      origin.y + dir.y * t,
      origin.z + dir.z * t,
      field
    );
    if (!(d > 1e-4)) return t;
    t += d * safety;
    if (t >= range) return range;
  }

  return Math.min(t, range);
}

function wander(elapsed, amount) {
  return scratchDir
    .set(
      Math.sin(elapsed * WANDER_RATES[0]),
      Math.sin(elapsed * WANDER_RATES[1]) * 0.6,
      Math.sin(elapsed * WANDER_RATES[2])
    )
    .multiplyScalar(amount);
}

export function stepAgent(agent, dt, params) {
  const { field } = params;
  agent.elapsed += dt;

  agent.dwell -= dt;
  if (agent.dwell <= 0) {
    agent.peering = !agent.peering;
    const [lo, hi] = agent.peering
      ? [params.peerMin, params.peerMax]
      : [params.cruiseMin, params.cruiseMax];
    agent.dwell = lo + Math.random() * Math.max(hi - lo, 0);
  }

  agent.clearance = sceneDistance(
    agent.position.x,
    agent.position.y,
    agent.position.z,
    field
  );

  desired.set(0, 0, 0);
  for (let i = 0; i < PROBE_COUNT; i += 1) {
    const probe = PROBES[i];
    const alignment = probe.dot(agent.heading);

    if (alignment >= -0.2) {
      const reach = openness(
        agent.position,
        probe,
        field,
        params.probeRange,
        params.stepSafety
      );
      const weight =
        (reach / params.probeRange) ** params.opennessBias *
        (0.35 + 0.65 * Math.max(alignment, 0)) *
        (1 - params.levelFlight * Math.abs(probe.y));
      desired.addScaledVector(probe, weight);
    }
  }

  if (desired.lengthSq() < 1e-8) desired.copy(agent.heading).negate();
  desired.normalize();

  desired.add(
    wander(agent.elapsed, agent.peering ? params.wander * 2 : params.wander)
  );

  // Skim the ground: pull back toward the cruise altitude, saturating a band
  // either side of it so a tall chamber doesn't fling the sphere upward.
  if (params.altitudeHold > 0) {
    const band = Math.max(params.altitudeBand, 1e-3);
    desired.y +=
      THREE.MathUtils.clamp(
        (params.altitude - agent.position.y) / band,
        -1,
        1
      ) * params.altitudeHold;
  }

  // Leash: the lattice is infinite, so without this the sphere eventually
  // wanders into a region the camera has no reason to be in.
  toPivot.copy(agent.spawn).sub(agent.position);
  const drift = toPivot.length();
  if (drift > params.leash) {
    desired.addScaledVector(
      toPivot.divideScalar(drift),
      ((drift - params.leash) / params.leash) * params.leashStrength
    );
  }

  // Exploring means skimming the rock, not hanging in the middle of the
  // chamber: the sphere is the only light, so open space is just dark. Past
  // the hug distance the nearest wall pulls the heading in; the margin push
  // below stops it before contact.
  if (agent.clearance > params.hugDistance && params.hugStrength > 0) {
    sceneGradient(
      agent.position.x,
      agent.position.y,
      agent.position.z,
      field,
      scratchGrad
    );
    const excess = Math.min(
      (agent.clearance - params.hugDistance) / params.hugDistance,
      1
    );
    desired.addScaledVector(scratchGrad, -excess * params.hugStrength);
  }

  if (agent.clearance < params.margin) {
    sceneGradient(
      agent.position.x,
      agent.position.y,
      agent.position.z,
      field,
      scratchGrad
    );
    desired.addScaledVector(
      scratchGrad,
      (1 - agent.clearance / params.margin) * params.avoidance
    );
  }

  desired.normalize();
  agent.heading.lerp(desired, 1 - Math.exp(-params.turnRate * dt)).normalize();

  const room = THREE.MathUtils.clamp(agent.clearance / params.comfort, 0.15, 1);
  const target = (agent.peering ? params.peerSpeed : params.cruiseSpeed) * room;
  agent.speed += (target - agent.speed) * (1 - Math.exp(-params.accel * dt));

  agent.position.addScaledVector(agent.heading, agent.speed * dt);

  if (!Number.isFinite(agent.position.lengthSq())) {
    agent.position.copy(agent.spawn);
    agent.speed = 0;
    return agent;
  }

  const settled = sceneDistance(
    agent.position.x,
    agent.position.y,
    agent.position.z,
    field
  );
  if (settled < params.radius) {
    sceneGradient(
      agent.position.x,
      agent.position.y,
      agent.position.z,
      field,
      scratchGrad
    );
    agent.position.addScaledVector(scratchGrad, params.radius - settled);

    const into = agent.heading.dot(scratchGrad);
    if (into < 0) agent.heading.addScaledVector(scratchGrad, -into).normalize();
    agent.speed *= params.bounceDamping;
  }

  return agent;
}
