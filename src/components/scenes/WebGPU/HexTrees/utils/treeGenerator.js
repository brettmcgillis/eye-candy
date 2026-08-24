import { Quaternion, Vector3 } from 'three';

// Direct structural port of ../../../../../../../../hex-trees.js's recursive
// Fork/TurtleState classes (root hex-trees.js is the Turtletoy reference this
// scene is built from). Two things carry over unchanged from the source:
//
// 1. A fork's generate() FIRST spawns an entire nested generation cascade at
//    its OWN anchor point (thinner, generation+1, branches=3) before doing
//    any of its own outward branching — and since that nested cascade's own
//    generate() call repeats the same check, EVERY node in the tree (not
//    just the root) re-triggers a partial cascade up to generationLimit.
//    This is what produces the nested hex-rosette-within-rosette look, and
//    it is also why generationLimit (source range: 1-20) can blow up branch
//    counts combinatorially — see MAX_BRANCHES_PER_TREE below.
// 2. Outward branching forks (spawned from the per-branch loop) carry
//    `branches=2` and keep the SAME generation as their parent — only the
//    generation-cascade recursion above increments generation. Thickness
//    likewise only steps down at generation boundaries (thicknessRatio),
//    never along an outward iteration chain, matching the source exactly.
//
// Deviations, all deliberate: quaternion-based 3D orientation replaces the
// source's single 2D heading float (2D mode still turns around one fixed
// axis, so at pitchAngle=0 the traced directions match the source exactly);
// the circle decoration is a single ring instance per anchor instead of the
// source's pen-plotter partial-reveal-arc animation trick; segment thickness
// no longer double-draws offset lines (Slowbro's 2D stroke-width hack) since
// segments become real cylinder radii downstream.

const FORWARD = new Vector3(0, 1, 0);
const NORMAL_AXIS = new Vector3(0, 0, 1);
const PITCH_AXIS = new Vector3(1, 0, 0);
const ROLL_AXIS = new Vector3(0, 1, 0);
const DEG = Math.PI / 180;

// Matches the source's hardcoded `f.iteration < 7` recursion cap — a fixed
// magic number in hex-trees.js itself, not one of its tunable params.
const RECURSION_DEPTH_CAP = 7;

// Safety valve the source (an offline SVG plotter) never needed: at
// aggressive generationLimit/iterationLimit/probability combinations the
// cascade in note 1 above can genuinely blow up. Once a tree crosses this,
// generate() stops spawning new forks (already-emitted branches are kept)
// rather than hanging the tab.
const MAX_BRANCHES_PER_TREE = 20000;

class TurtleState {
  constructor(position, orientation, thickness) {
    this.position = position.clone();
    this.orientation = orientation.clone();
    this.thickness = thickness;
  }

  clone() {
    return new TurtleState(this.position, this.orientation, this.thickness);
  }
}

function turn(state, angleDeg, axis) {
  if (!angleDeg) return;
  state.orientation.multiply(
    new Quaternion().setFromAxisAngle(axis, angleDeg * DEG)
  );
}

function stepForward(state, distance) {
  const direction = FORWARD.clone().applyQuaternion(state.orientation);
  state.position.addScaledVector(direction, distance);
}

// Generates one hex-tree: a flat { branches, circles } pair, no THREE
// scene objects — Forest.jsx hands these to BranchField/CircleField for
// instancing. `random` is a seeded PRNG closure (utils/seededRandom.js) so a
// given seed always reproduces the same tree. `is3D` gates the pitch/roll
// turns that let branches leave the plane.
export default function generateTree({ settings, random, treeIndex = 0 }) {
  const {
    length,
    lengthRatio,
    thickness,
    thicknessRatio,
    generationLimit,
    iterationLimit,
    forkProbPerGen,
    forkProbPerIter,
    circleProb,
    circleRadiusMin,
    circleRadiusMax,
    spreadAngle,
    initialAngle,
    pitchAngle,
    is3D,
  } = settings;

  const branches = [];
  const circles = [];
  let order = 0;
  let capped = false;

  function nextOrder() {
    order += 1;
    return order;
  }

  function maybeEmitCircle(state, generation) {
    if (random() >= circleProb) return;
    const radius =
      circleRadiusMin + random() * (circleRadiusMax - circleRadiusMin);
    const normal = new Vector3(0, 0, 1).applyQuaternion(state.orientation);
    circles.push({
      center: state.position.clone(),
      normal,
      radius,
      generation,
      generationT: generation / generationLimit,
      treeIndex,
      order: nextOrder(),
    });
  }

  function generate(state, iteration, generation, branchCount) {
    if (capped) return;

    if (generation < generationLimit) {
      const nested = state.clone();
      nested.thickness *= thicknessRatio;
      generate(nested, 0, generation + 1, 3);
    }

    const segmentLength = length * lengthRatio ** generation;

    maybeEmitCircle(state, generation);

    const attemptState = state.clone();
    turn(attemptState, initialAngle, NORMAL_AXIS);

    const forks = [];
    for (let i = 0; i < branchCount; i += 1) {
      const threshold =
        forkProbPerGen * generation + forkProbPerIter * iteration;
      if (!capped && iteration < iterationLimit && random() > threshold) {
        const branchStart = attemptState.position.clone();
        const nextState = attemptState.clone();
        stepForward(nextState, segmentLength);
        branches.push({
          start: branchStart,
          end: nextState.position.clone(),
          radius: attemptState.thickness,
          generation,
          generationT: generation / generationLimit,
          treeIndex,
          order: nextOrder(),
        });
        if (branches.length + circles.length >= MAX_BRANCHES_PER_TREE) {
          capped = true;
          // eslint-disable-next-line no-console
          console.warn(
            `[HexTrees] tree ${treeIndex} hit MAX_BRANCHES_PER_TREE ` +
              `(${MAX_BRANCHES_PER_TREE}) — lower Generation Limit, ` +
              'Iteration Limit, or the fork probabilities.'
          );
        }
        forks.push({ state: nextState, iteration: iteration + 1 });
      }
      turn(attemptState, spreadAngle, NORMAL_AXIS);
      if (is3D) {
        turn(attemptState, pitchAngle, PITCH_AXIS);
        turn(attemptState, (random() - 0.5) * 360, ROLL_AXIS);
      }
    }

    forks.forEach((fork) => {
      if (!capped && fork.iteration < RECURSION_DEPTH_CAP) {
        generate(fork.state, fork.iteration, generation, 2);
      }
    });
  }

  const root = new TurtleState(
    new Vector3(0, 0, 0),
    new Quaternion(),
    thickness
  );
  generate(root, 0, 0, 3);

  const totalOrder = Math.max(1, order);
  branches.forEach((branch) => {
    // eslint-disable-next-line no-param-reassign
    branch.birthOrder = branch.order / totalOrder;
  });
  circles.forEach((circle) => {
    // eslint-disable-next-line no-param-reassign
    circle.birthOrder = circle.order / totalOrder;
  });

  return { branches, circles };
}
