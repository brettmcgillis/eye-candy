/* eslint-disable no-param-reassign */
import { distance, offsetPolygon, polygonBounds } from './geom';
import { splitQuad } from './quadTree';

const CENTER = { x: 0, y: 0 };
const NEON_MAX_INSET = 20;
const STAIR_BAND = 10;
const STAIR_TAPER = 3;

function insetCell(quad, source, glow, gap) {
  return {
    area: quad.area,
    district: source.district,
    footprint: { h: quad.h, w: quad.w, x: quad.x, y: quad.y },
    glow,
    h: quad.h,
    rect: polygonBounds(offsetPolygon(quad.points, gap)),
    valid: quad.w > gap * 2 && quad.h > gap * 2,
    w: quad.w,
  };
}

export function classify({ composition, quads, random, referenceHeight }) {
  const radius = (referenceHeight / 1.5) * composition.edgeRadius;
  const towerArea = (referenceHeight / composition.towerAreaDivisor) ** 2;
  const landArea = (referenceHeight / composition.landAreaDivisor) ** 2;
  const stairArea = (referenceHeight / composition.stairAreaDivisor) ** 2;
  const gap = composition.streetGap;
  const groups = { landuse: [], stairs: [], towers: [] };

  quads.forEach((quad) => {
    const radial = distance(
      { x: quad.x + quad.w / 2, y: quad.y + quad.h / 2 },
      CENTER
    );

    if (radial >= radius) {
      return;
    }

    if (random() > (1 - radial / radius) * composition.densityFalloff) {
      return;
    }

    const collect = (target) => {
      splitQuad(quad, random, composition.splitJitter).forEach((sub) => {
        target.push(insetCell(sub, quad, false, gap));
      });
    };

    if (quad.area < towerArea) {
      collect(groups.towers);
    } else if (quad.area < landArea) {
      collect(groups.landuse);
    } else if (quad.area < stairArea) {
      collect(groups.stairs);
    } else {
      groups.landuse.push(insetCell(quad, quad, quad.glow, gap));
    }
  });

  return groups;
}

function stairDirection(mode, roll, index) {
  if (mode === 'forward') return true;
  if (mode === 'backward') return false;
  if (mode === 'alternate') return index % 2 === 0;

  return roll > 0.5;
}

function dressStairs(stairs, random, composition) {
  stairs.forEach((cell, index) => {
    const step = STAIR_BAND / cell.h;
    let count = 0;

    for (let i = 0; i < 1; i += step) {
      count += 1;
    }

    cell.role = 'stair';
    cell.steps = count;
    cell.stepFraction = step;
    cell.taper = STAIR_TAPER;
    cell.descending = stairDirection(
      composition.stairDirection,
      random(),
      index
    );
  });
}

function neonSlot(cell, magenta, largeArea) {
  if (cell.area > largeArea) {
    return 'amber';
  }

  return magenta ? 'magenta' : 'cyan';
}

function dressLanduse(
  landuse,
  random,
  { composition, idOffset, referenceHeight }
) {
  const neonLargeArea = (referenceHeight / 20) ** 2;
  const { neonChance, pitEvery } = composition;

  landuse.forEach((cell, index) => {
    if (pitEvery > 0 && (index + idOffset) % pitEvery === 0) {
      cell.role = 'pit';
      return;
    }

    cell.role = 'plaza';
    cell.rise = 2 + Math.sqrt(Math.sqrt(cell.area));

    if (random() < neonChance) {
      const inset = Math.min(NEON_MAX_INSET, Math.min(cell.w, cell.h) / 2);
      const magenta = random() < 0.5;

      cell.neon = { inset, slot: neonSlot(cell, magenta, neonLargeArea) };
    }
  });
}

function dressTowers(towers, random) {
  towers.forEach((cell) => {
    cell.role = 'tower';
    cell.heightRoll = random();
  });
}

const RIM_MARGIN = 4;

// A round pedestal keeps every corner of a cell inside its rim, with a little
// margin for tower footprints that widen past their cell.
function onPedestal(cell, shape, radius) {
  if (shape !== 'circle') {
    return true;
  }

  const { h, w, x, y } = cell.rect;
  const reach = radius - RIM_MARGIN;

  return [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ].every(([cx, cy]) => Math.hypot(cx, cy) <= reach);
}

// The reference runs stair direction, then plaza dressing, then tower
// heights off one stream, so the order here is load-bearing. The pedestal
// filter runs after, so a round rim never reshuffles the rolls.
export function dress(
  groups,
  { composition, idOffset, random, referenceHeight }
) {
  dressStairs(groups.stairs, random, composition);
  dressLanduse(groups.landuse, random, {
    composition,
    idOffset,
    referenceHeight,
  });
  dressTowers(groups.towers, random);

  const radius = referenceHeight / 1.5;

  return [...groups.towers, ...groups.landuse, ...groups.stairs].filter(
    (cell) => cell.valid && onPedestal(cell, composition.pedestalShape, radius)
  );
}
