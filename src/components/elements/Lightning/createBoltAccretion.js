/* eslint-disable no-param-reassign */
import * as THREE from 'three';

import { createSeededRandom } from './lightningUtils';

const DOWN = new THREE.Vector3(0, -1, 0);

// A stepped leader walks in straight segments and changes heading only at
// segment boundaries — per-step jitter is what makes procedural lightning read
// as a wobbly noodle instead of a discharge.
function nextHeading(previous, spread, random, downBias) {
  const heading = previous
    .clone()
    .multiplyScalar(0.45)
    .addScaledVector(DOWN, downBias)
    .add(
      new THREE.Vector3(
        (random() - 0.5) * spread,
        (random() - 0.5) * spread * 0.4,
        (random() - 0.5) * spread
      )
    );

  if (heading.y > -0.18) {
    heading.y = -0.18;
  }

  return heading.normalize();
}

function walkStrand(options) {
  const {
    arcStart,
    depth,
    groundAt,
    heading,
    maxSteps,
    origin,
    random,
    recenter,
    segmentSteps,
    spread,
    stepLength,
  } = options;
  const nodes = [{ position: origin.clone(), arc: arcStart }];
  const current = origin.clone();
  const direction = heading.clone();
  let arc = arcStart;
  let reachedGround = false;

  for (let step = 0; step < maxSteps; step += 1) {
    if (step % segmentSteps === 0) {
      direction.copy(nextHeading(direction, spread, random, 0.34));
    }

    current.addScaledVector(direction, stepLength);
    current.x -= current.x * recenter;
    current.z -= current.z * recenter;
    arc += stepLength;

    const ground = groundAt(current.x, current.z);

    if (current.y <= ground) {
      current.y = ground;
      nodes.push({ position: current.clone(), arc });
      reachedGround = true;
      break;
    }

    nodes.push({ position: current.clone(), arc });
  }

  return { arcEnd: arc, depth, nodes, reachedGround };
}

function emitStrand(store, strand, options) {
  const { channelRadius, clusterSize, random, taper } = options;
  const { nodes } = strand;

  for (let index = 1; index < nodes.length; index += 1) {
    const from = nodes[index - 1];
    const to = nodes[index];
    const radius = channelRadius * taper;

    for (let grain = 0; grain < clusterSize; grain += 1) {
      if (store.count >= store.capacity) return;

      const ratio = (grain + random()) / clusterSize;
      const offset = (store.base + store.count) * 4;

      store.target[offset] = to.position.x + (random() - 0.5) * radius * 2;
      store.target[offset + 1] = to.position.y + (random() - 0.5) * radius * 2;
      store.target[offset + 2] = to.position.z + (random() - 0.5) * radius * 2;
      const arc = THREE.MathUtils.lerp(from.arc, to.arc, ratio);

      store.target[offset + 3] = arc;
      store.maxArc = Math.max(store.maxArc, arc);
      store.parent[offset] = from.position.x;
      store.parent[offset + 1] = from.position.y;
      store.parent[offset + 2] = from.position.z;
      store.parent[offset + 3] = strand.depth;
      store.count += 1;
    }
  }
}

// Writes a branched bolt into caller-owned buffers so a re-roll each cycle
// costs no allocation. `arc` is world distance from the origin along the tree,
// which is what lets one propagation front advance the trunk and every branch
// at the same speed.
export default function createBoltAccretion({
  branchCount = 64,
  capacity,
  channelRadius = 0.028,
  groundAt = () => 0,
  offset = 0,
  clusterSize = 12,
  height = 5,
  parent,
  seed = 1,
  spread = 1.4,
  stepLength = 0.016,
  target,
}) {
  const random = createSeededRandom(seed);
  const slots = capacity ?? Math.floor(target.length / 4);
  const store = {
    base: offset,
    capacity: slots,
    count: 0,
    maxArc: 0,
    parent,
    target,
  };
  const trunk = walkStrand({
    arcStart: 0,
    depth: 0,
    groundAt,
    heading: DOWN.clone(),
    maxSteps: Math.ceil((height / stepLength) * 1.8),
    origin: new THREE.Vector3(0, height, 0),
    random,
    recenter: 0.0012,
    segmentSteps: 11,
    spread,
    stepLength,
  });

  emitStrand(store, trunk, { channelRadius, clusterSize, random, taper: 1 });

  const anchors = [];
  const seedCount = Math.max(3, Math.round(branchCount * 0.4));
  for (let index = 0; index < seedCount; index += 1) {
    const node =
      trunk.nodes[
        Math.floor(THREE.MathUtils.lerp(6, trunk.nodes.length - 4, random()))
      ];
    anchors.push({ arc: node.arc, depth: 1, position: node.position });
  }

  let emitted = 0;
  while (anchors.length > 0 && emitted < branchCount) {
    const anchor = anchors.shift();
    const taper = 0.72 ** anchor.depth;
    const branch = walkStrand({
      arcStart: anchor.arc,
      depth: anchor.depth,
      groundAt,
      heading: nextHeading(DOWN.clone(), spread * 2.4, random, 0.15),
      maxSteps: Math.ceil(
        (Math.max(anchor.position.y, 0.2) / stepLength) *
          (0.2 + random() * 0.5) *
          taper
      ),
      origin: anchor.position,
      random,
      recenter: 0,
      segmentSteps: 8,
      spread: spread * 1.3,
      stepLength,
    });

    emitStrand(store, branch, {
      channelRadius,
      clusterSize: Math.max(3, Math.round(clusterSize * taper)),
      random,
      taper,
    });
    emitted += 1;

    if (anchor.depth < 4) {
      const forkCount = random() < 0.35 ? 2 : 1;
      for (let fork = 0; fork < forkCount; fork += 1) {
        const node =
          branch.nodes[
            Math.floor(
              THREE.MathUtils.lerp(0.35, 0.85, random()) * branch.nodes.length
            )
          ];
        if (node && random() < 0.8) {
          anchors.push({
            arc: node.arc,
            depth: anchor.depth + 1,
            position: node.position,
          });
        }
      }
    }
  }

  for (let index = store.count; index < slots; index += 1) {
    target[(offset + index) * 4 + 3] = -1;
  }

  const contact = trunk.nodes.at(-1);

  return {
    count: store.count,
    ground: [contact.position.x, contact.position.y, contact.position.z],
    groundArc: contact.arc,
    totalArc: Math.max(store.maxArc, 1),
  };
}
