import * as THREE from 'three/webgpu';

import { brushFromGeometry, createBox, cut, cutToGeometry } from './csg';
import createPrng from './prng';

const TOWER_SEED = 1013;
const STAIR_SEED = 2029;
export const STEP_BUCKETS = [6, 10, 16, 24];

// Variants are carved once and instanced, so the booleans are paid per form
// rather than per building.
function carveTower(random) {
  let brush = createBox({
    depth: 1,
    height: 1,
    position: [0, 0.5, 0],
    width: 1,
  });

  const setbackHeight = 0.4 + random() * 0.35;
  const setbackWidth = 0.3 + random() * 0.25;
  const quadrant = Math.floor(random() * 4);
  const sx = quadrant % 2 === 0 ? 1 : -1;
  const sz = quadrant < 2 ? 1 : -1;

  brush = cut(
    brush,
    createBox({
      depth: setbackWidth,
      height: setbackHeight + 0.4,
      position: [
        sx * (0.5 - setbackWidth / 2),
        1 - setbackHeight / 2 + 0.2,
        sz * (0.5 - setbackWidth / 2),
      ],
      width: setbackWidth,
    })
  );

  const slotDepth = 0.14 + random() * 0.12;
  const slotWidth = 0.12 + random() * 0.16;
  const slotAxis = random() > 0.5;

  brush = cut(
    brush,
    createBox({
      depth: slotAxis ? slotDepth : slotWidth,
      height: 0.8,
      position: [
        slotAxis ? sx * (0.5 - slotDepth / 2 + 0.02) : 0,
        0.5,
        slotAxis ? 0 : sz * (0.5 - slotDepth / 2 + 0.02),
      ],
      width: slotAxis ? slotWidth : slotDepth,
    })
  );

  const arcadeHeight = 0.04 + random() * 0.05;
  const arcadeDepth = 0.28 + random() * 0.14;

  brush = cut(
    brush,
    createBox({
      depth: arcadeDepth,
      height: arcadeHeight,
      position: [0, arcadeHeight / 2, 0.5],
      width: 1.4,
    })
  );

  brush = cut(
    brush,
    createBox({
      depth: 0.9,
      height: 0.9,
      position: [-sx * 0.62, 1.08, -sz * 0.62],
      rotationY: Math.PI / 4,
      width: 0.9,
    })
  );

  return brush;
}

export function createTowerVariants(count) {
  const random = createPrng(TOWER_SEED);

  return Array.from({ length: count }, () => {
    const geometry = carveTower(random).geometry.clone();
    geometry.computeVertexNormals();
    return geometry;
  });
}

// The void above the treads, extended past every face of the block so no
// boolean ever meets a coplanar pair. Floors sit strictly inside the card's
// height for the same reason.
function stairVoidGeometry(steps, descending) {
  const shape = new THREE.Shape();
  const span = steps + 1;
  const floorAt = (index) =>
    descending ? 1 - (index + 1) / span : (index + 1) / span;

  shape.moveTo(-0.7, 1.25);

  for (let i = 0; i < steps; i += 1) {
    const floor = floorAt(i);
    shape.lineTo(i === 0 ? -0.7 : -0.5 + i / steps, floor);
    shape.lineTo(i === steps - 1 ? 0.7 : -0.5 + (i + 1) / steps, floor);
  }

  shape.lineTo(0.7, 1.25);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    depth: 1.4,
  });

  geometry.translate(0, 0, -0.7);

  return geometry;
}

function carveStair(steps, descending, narrowing) {
  const block = createBox({
    depth: 1,
    height: 1,
    position: [0, 0.5, 0],
    width: 1,
  });
  const terraced = cut(
    block,
    brushFromGeometry(stairVoidGeometry(steps, descending))
  );

  // Matches the reference's per-step horizontal creep: one face shaved on a
  // slant so the run narrows as it descends.
  const angle = Math.atan(narrowing);
  const halfWidth = 1;
  const normal = new THREE.Vector3(1, 0, -narrowing).normalize();
  const wedge = createBox({
    depth: 3,
    height: 3,
    position: [
      -0.5 + narrowing / 2 - normal.x * halfWidth,
      0.5,
      -normal.z * halfWidth,
    ],
    rotationY: angle,
    width: halfWidth * 2,
  });

  const geometry = cutToGeometry(terraced, wedge);

  geometry.rotateY(Math.PI / 2);

  return geometry;
}

export function createStairVariants(narrowing) {
  const random = createPrng(STAIR_SEED);

  return STEP_BUCKETS.flatMap((steps) =>
    [true, false].map((descending) => ({
      descending,
      geometry: carveStair(
        steps,
        descending,
        narrowing * (0.8 + random() * 0.4)
      ),
      steps,
    }))
  );
}

export function pickStairVariant(variants, cell) {
  const bucket = STEP_BUCKETS.reduce((best, steps) =>
    Math.abs(steps - cell.steps) < Math.abs(best - cell.steps) ? steps : best
  );

  return variants.findIndex(
    (variant) =>
      variant.steps === bucket && variant.descending === cell.descending
  );
}
