/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const SUBSTEP = 1 / 960;
const MAX_SUBSTEPS = 48;
const AIR_DENSITY = 1.2;
const NORMAL_DRAG = 1.2;
const EDGE_DRAG = 0.4;
const AREAL_DENSITY = 0.08;
const STRETCH_COMPLIANCE = 1e-9;
const PARTICLE_RADIUS = 0.0008;
const FLOOR_FRICTION = 0.8;
const GRAVITY = new THREE.Vector3(0, -9.8, 0);

const lastDown = new THREE.Vector3();
const from = new THREE.Vector3();
const delta = new THREE.Vector3();
const edgeA = new THREE.Vector3();
const edgeB = new THREE.Vector3();
const normal = new THREE.Vector3();
const flow = new THREE.Vector3();
const force = new THREE.Vector3();
const axisSeg = new THREE.Vector3();
const rung = new THREE.Vector3();
const rungGoal = new THREE.Vector3();
const rungMid = new THREE.Vector3();
const nearest = new THREE.Vector3();

const at = (row, side) => row * 2 + side;

// Particle pairs held at their rest distance: rows down each edge, rungs
// across, diagonals for shear (all near-inextensible), and every-other-row
// links whose softness is the ribbon's bending stiffness.
function buildConstraints(rows, rowGap, width) {
  const stretch = [];
  const bend = [];
  const diagonal = Math.hypot(rowGap, width);
  for (let r = 0; r < rows; r += 1) {
    stretch.push([at(r, 0), at(r, 1), width]);
    if (r + 1 < rows) {
      stretch.push([at(r, 0), at(r + 1, 0), rowGap]);
      stretch.push([at(r, 1), at(r + 1, 1), rowGap]);
      stretch.push([at(r, 0), at(r + 1, 1), diagonal]);
      stretch.push([at(r, 1), at(r + 1, 0), diagonal]);
    }
    if (r + 2 < rows) {
      bend.push([at(r, 0), at(r + 2, 0), rowGap * 2]);
      bend.push([at(r, 1), at(r + 2, 1), rowGap * 2]);
    }
  }
  return { bend, stretch };
}

// Straight down, across the shaft; a near-vertical shaft keeps the last one.
function knotDown(axis, target) {
  lastDown.copy(target);
  target.copy(GRAVITY).normalize();
  target.addScaledVector(axis, -target.dot(axis));
  if (target.lengthSq() < 0.04) return target.copy(lastDown);
  return target.normalize();
}

// A tied ribbon as a two-edge strip of particles, solved with small-step
// XPBD: inextensible along and across, softly resisting bending, carried by
// air drag that depends on which way each panel faces (it floats broadside
// and slices edge-on), and kept out of capsules and the floor.
export default function createRibbonSim({ length, rows, width }) {
  const count = rows * 2;
  const rowGap = length / (rows - 1);
  const mass = (AREAL_DENSITY * length * width) / count;
  const { bend, stretch } = buildConstraints(rows, rowGap, width);

  const position = Array.from({ length: count }, () => new THREE.Vector3());
  const previous = Array.from({ length: count }, () => new THREE.Vector3());
  const velocity = Array.from({ length: count }, () => new THREE.Vector3());
  const accel = Array.from({ length: count }, () => new THREE.Vector3());
  const pins = [new THREE.Vector3(), new THREE.Vector3()];
  const pinsFrom = [new THREE.Vector3(), new THREE.Vector3()];
  const knotDownDir = new THREE.Vector3(0, -1, 0);

  function pinTargets(knot, wrapRadius) {
    knotDown(knot.axis, knotDownDir);
    from.copy(knot.center).addScaledVector(knotDownDir, wrapRadius);
    pins[0].copy(from).addScaledVector(knot.axis, -width / 2);
    pins[1].copy(from).addScaledVector(knot.axis, width / 2);
  }

  function solve(pairs, alpha) {
    pairs.forEach(([a, b, rest]) => {
      const wa = a < 2 ? 0 : 1;
      const wb = b < 2 ? 0 : 1;
      const w = wa + wb;
      if (!w) return;
      delta.subVectors(position[a], position[b]);
      const dist = delta.length();
      if (dist < 1e-9) return;
      const lambda = -(dist - rest) / (w / mass + alpha);
      delta.multiplyScalar(lambda / mass / dist);
      position[a].addScaledVector(delta, wa);
      position[b].addScaledVector(delta, -wb);
    });
  }

  // A two-edge strip has almost no resistance to twisting about its own
  // centreline; satin does. Ease each rung toward its neighbours' heading
  // so twist spreads gradually instead of spinning panel by panel.
  function resistTwist(twist) {
    for (let r = 1; r + 1 < rows; r += 1) {
      rungGoal
        .subVectors(position[at(r - 1, 1)], position[at(r - 1, 0)])
        .add(rung.subVectors(position[at(r + 1, 1)], position[at(r + 1, 0)]));
      if (rungGoal.lengthSq() > 1e-12) {
        rungMid
          .addVectors(position[at(r, 0)], position[at(r, 1)])
          .multiplyScalar(0.5);
        rung
          .subVectors(position[at(r, 1)], position[at(r, 0)])
          .lerp(rungGoal.setLength(width), twist)
          .setLength(width / 2);
        position[at(r, 0)].copy(rungMid).sub(rung);
        position[at(r, 1)].copy(rungMid).add(rung);
      }
    }
  }

  function aero(windAt, drag) {
    accel.forEach((a) => a.copy(GRAVITY));
    for (let r = 0; r + 1 < rows; r += 1) {
      const quad = [at(r, 0), at(r, 1), at(r + 1, 0), at(r + 1, 1)];
      edgeA.subVectors(position[quad[2]], position[quad[0]]);
      edgeB.subVectors(position[quad[1]], position[quad[0]]);
      normal.crossVectors(edgeA, edgeB);
      const area = normal.length();
      if (area > 1e-10) {
        normal.divideScalar(area);
        flow.set(0, 0, 0);
        quad.forEach((i) => flow.add(velocity[i]));
        flow.multiplyScalar(0.25).sub(windAt(r));
        const across = flow.dot(normal);
        force
          .copy(normal)
          .multiplyScalar(
            -0.5 *
              AIR_DENSITY *
              NORMAL_DRAG *
              drag *
              area *
              across *
              Math.abs(across)
          );
        flow.addScaledVector(normal, -across);
        force.addScaledVector(
          flow,
          -0.5 * AIR_DENSITY * EDGE_DRAG * drag * area * flow.length()
        );
        quad.forEach((i) => accel[i].addScaledVector(force, 0.25 / mass));
      }
    }
  }

  function collide(capsules, floorY) {
    for (let i = 2; i < count; i += 1) {
      const p = position[i];
      capsules.forEach(({ end, radius, start }) => {
        axisSeg.subVectors(end, start);
        const t = THREE.MathUtils.clamp(
          delta.subVectors(p, start).dot(axisSeg) /
            Math.max(axisSeg.lengthSq(), 1e-10),
          0,
          1
        );
        nearest.copy(start).addScaledVector(axisSeg, t);
        delta.subVectors(p, nearest);
        const dist = delta.length();
        const reach = radius + PARTICLE_RADIUS;
        if (dist < reach && dist > 1e-9) {
          p.addScaledVector(delta, (reach - dist) / dist);
        }
      });
      const floor = floorY + PARTICLE_RADIUS;
      if (p.y < floor) {
        p.y = floor;
        previous[i].x += (p.x - previous[i].x) * FLOOR_FRICTION;
        previous[i].z += (p.z - previous[i].z) * FLOOR_FRICTION;
      }
    }
  }

  return {
    count,
    position,
    rows,

    // Hang straight down from the knot, at rest.
    reset(knot, wrapRadius) {
      pinTargets(knot, wrapRadius);
      for (let r = 0; r < rows; r += 1) {
        for (let side = 0; side < 2; side += 1) {
          position[at(r, side)]
            .copy(pins[side])
            .addScaledVector(knotDownDir, r * rowGap);
          previous[at(r, side)].copy(position[at(r, side)]);
          velocity[at(r, side)].set(0, 0, 0);
        }
      }
      pinsFrom[0].copy(pins[0]);
      pinsFrom[1].copy(pins[1]);
    },

    // `knot` moved once this frame; its motion is spread over the substeps
    // so the ribbon is led by the arrow, never yanked.
    step(
      dt,
      {
        bendCompliance,
        capsules,
        damping,
        drag,
        floorY,
        knot,
        twist,
        windAt,
        wrapRadius,
      }
    ) {
      if (!(dt > 0)) return;
      pinTargets(knot, wrapRadius);
      const substeps = Math.min(MAX_SUBSTEPS, Math.ceil(dt / SUBSTEP));
      const h = dt / substeps;
      const stretchAlpha = STRETCH_COMPLIANCE / (h * h);
      const bendAlpha = bendCompliance / (h * h);
      for (let s = 1; s <= substeps; s += 1) {
        aero(windAt, drag);
        for (let i = 2; i < count; i += 1) {
          velocity[i].addScaledVector(accel[i], h);
          previous[i].copy(position[i]);
          position[i].addScaledVector(velocity[i], h);
        }
        for (let side = 0; side < 2; side += 1) {
          previous[side].copy(position[side]);
          position[side].lerpVectors(pinsFrom[side], pins[side], s / substeps);
        }
        solve(stretch, stretchAlpha);
        solve(bend, bendAlpha);
        resistTwist(twist);
        collide(capsules, floorY);
        const keep = Math.max(0, 1 - damping * h);
        for (let i = 0; i < count; i += 1) {
          velocity[i]
            .subVectors(position[i], previous[i])
            .divideScalar(h)
            .multiplyScalar(i < 2 ? 1 : keep);
        }
      }
      pinsFrom[0].copy(pins[0]);
      pinsFrom[1].copy(pins[1]);
    },

    get down() {
      return knotDownDir;
    },
  };
}
