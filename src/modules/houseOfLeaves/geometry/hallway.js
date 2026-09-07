import * as THREE from 'three/webgpu';

import { archHeightAt, orientInward } from './geometryUtils';

const MIN_RINGS_ACROSS_OPENING = 14;
const MAX_RINGS = 320;

export const HALLWAY_DEFAULTS = {
  length: 16,
  width: 4.5,
  height: 7,
  archRise: 2.25,
  widthEnd: null,
  heightEnd: null,
  archSegments: 16,
  lengthSegments: 24,
  capEnd: false,
  sideOpenings: [],
  mouthCurveRadius: 0,
  mouthCurveDepth: 1.5,
  revealDepth: 0.4,
};

// An arched corridor swept along +X. Floor, side walls and barrel vault are
// built as separate surfaces rather than one swept profile, so a side wall can
// carry a doorway without the vault having to know about it.
//
// The section is evaluated per ring rather than once, so a segment can taper
// from one cross-section to another. That is what lets a corridor drift its
// shape continuously while consecutive segments still meet exactly: each one
// starts where the last ended.
export default function createHallway(options = {}) {
  const o = { ...HALLWAY_DEFAULTS, ...options };
  const widthEnd = o.widthEnd ?? o.width;
  const heightEnd = o.heightEnd ?? o.height;
  // An opening is resolved along the same rings that sweep the corridor, so a
  // doorway narrower than the ring spacing collapses into a triangle. Subdivide
  // enough that the narrowest opening gets a real arch.
  const narrowest = o.sideOpenings.reduce(
    (min, entry) => Math.min(min, entry.width),
    Infinity
  );
  const needed = Number.isFinite(narrowest)
    ? Math.ceil((o.length / narrowest) * MIN_RINGS_ACROSS_OPENING)
    : 0;
  const columns = Math.min(
    MAX_RINGS,
    Math.max(2, Math.round(o.lengthSegments), needed)
  );
  const positions = [];
  const indices = [];

  const sectionAt = (t) => {
    const width = o.width + (widthEnd - o.width) * t;
    const height = o.height + (heightEnd - o.height) * t;
    const archRise = Math.min(o.archRise * (width / o.width), height * 0.9);
    return {
      half: width * 0.5,
      height,
      archRise,
      springLine: Math.max(0.1, height - archRise),
    };
  };

  const openingFor = (side) =>
    o.sideOpenings.filter((entry) => entry.side === side);

  const inOpening = (side, x) =>
    openingFor(side).some(
      (entry) => Math.abs(x - entry.at) <= entry.width * 0.5
    );

  const sideDoorTop = (side, x) => {
    let top = 0;
    openingFor(side).forEach((entry) => {
      if (!entry.height) return;
      const cut = archHeightAt(x - entry.at, {
        width: entry.width,
        height: entry.height,
        archRise: entry.archRise ?? entry.width * 0.5,
      });
      if (cut > top) top = cut;
    });
    return top;
  };

  const strip = (pointAt, skipAt) => {
    const base = positions.length / 3;
    for (let i = 0; i <= columns; i += 1) {
      const t = i / columns;
      const [low, high] = pointAt(t * o.length, sectionAt(t));
      positions.push(...low, ...high);
    }
    for (let i = 0; i < columns; i += 1) {
      const mid = ((i + 0.5) / columns) * o.length;
      if (!skipAt || !skipAt(mid)) {
        const a = base + i * 2;
        indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }
  };

  strip((x, s) => [
    [x, 0, -s.half],
    [x, 0, s.half],
  ]);

  [-1, 1].forEach((side) => {
    strip(
      (x, s) => [
        [x, sideDoorTop(side, x), side * s.half],
        [x, s.springLine, side * s.half],
      ],
      (x) => inOpening(side, x) && !openingFor(side).some((e) => e.height)
    );
  });

  // Openings are cut through a surface with no thickness, so without a reveal
  // a doorway reads as a seam between two coincident planes — paper walls, and
  // an apparent gap where a branch meets the corridor.
  if (o.revealDepth > 0) {
    o.sideOpenings.forEach((entry) => {
      const { side } = entry;
      const depth = o.revealDepth;
      const from = entry.at - entry.width * 0.5;
      const to = entry.at + entry.width * 0.5;
      const steps = Math.max(6, Math.round((to - from) / (o.length / columns)));
      const ring = [];
      for (let i = 0; i <= steps; i += 1) {
        const x = from + ((to - from) * i) / steps;
        const { half } = sectionAt(x / o.length);
        ring.push({ x, half, top: sideDoorTop(side, x) });
      }
      const base = positions.length / 3;
      ring.forEach((r) => {
        positions.push(r.x, r.top, side * r.half);
        positions.push(r.x, r.top, side * (r.half + depth));
      });
      for (let i = 0; i < steps; i += 1) {
        const a = base + i * 2;
        indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
      [0, steps].forEach((i) => {
        const r = ring[i];
        const j = positions.length / 3;
        positions.push(r.x, 0, side * r.half);
        positions.push(r.x, 0, side * (r.half + depth));
        positions.push(r.x, r.top, side * r.half);
        positions.push(r.x, r.top, side * (r.half + depth));
        indices.push(j, j + 1, j + 3, j, j + 3, j + 2);
      });
    });
  }

  const vaultBase = positions.length / 3;
  const arcCount = o.archSegments;
  for (let i = 0; i <= columns; i += 1) {
    const t = i / columns;
    const s = sectionAt(t);
    const x = t * o.length;
    for (let j = 0; j <= arcCount; j += 1) {
      const angle = Math.PI * (1 - j / arcCount);
      positions.push(
        x,
        s.springLine + Math.sin(angle) * s.archRise,
        Math.cos(angle) * s.half
      );
    }
  }
  const ring = arcCount + 1;
  for (let i = 0; i < columns; i += 1) {
    const mid = ((i + 0.5) / columns) * o.length;
    for (let j = 0; j < arcCount; j += 1) {
      const zMid = Math.cos(Math.PI * (1 - (j + 0.5) / arcCount));
      const side = zMid >= 0 ? 1 : -1;
      const fullHeightCut =
        inOpening(side, mid) && !openingFor(side).some((e) => e.height);
      if (!fullHeightCut) {
        const a = vaultBase + i * ring + j;
        indices.push(a, a + ring, a + ring + 1, a, a + ring + 1, a + 1);
      }
    }
  }

  if (o.capEnd) {
    const s = sectionAt(1);
    const capBase = positions.length / 3;
    positions.push(o.length, s.height * 0.4, 0);
    positions.push(o.length, 0, -s.half);
    positions.push(o.length, s.springLine, -s.half);
    for (let j = 0; j <= arcCount; j += 1) {
      const angle = Math.PI * (1 - j / arcCount);
      positions.push(
        o.length,
        s.springLine + Math.sin(angle) * s.archRise,
        Math.cos(angle) * s.half
      );
    }
    positions.push(o.length, s.springLine, s.half);
    positions.push(o.length, 0, s.half);
    const rim = positions.length / 3 - capBase - 1;
    for (let i = 1; i < rim; i += 1) {
      indices.push(capBase, capBase + i, capBase + i + 1);
    }
    // The rim is a closed loop; without this the floor edge is left open and
    // the cap has a triangular hole in the bottom of it.
    indices.push(capBase, capBase + rim, capBase + 1);
  }

  if (o.mouthCurveRadius > 0) {
    const R = o.mouthCurveRadius;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const fade = Math.max(0, 1 - x / Math.max(0.01, o.mouthCurveDepth));
      if (fade > 0) {
        positions[i] = x - (R - Math.sqrt(Math.max(0, R * R - z * z))) * fade;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  const mid = sectionAt(0.5);
  return orientInward(
    geometry,
    new THREE.Vector3(o.length * 0.5, mid.springLine * 0.5, 0)
  );
}

export function hallwaySection(options = {}) {
  const o = { ...HALLWAY_DEFAULTS, ...options };
  const archRise = Math.min(o.archRise, o.height * 0.9);
  return {
    width: o.width,
    height: o.height,
    archRise,
    springLine: Math.max(0.1, o.height - archRise),
  };
}

export function hallwaySideDoor(options = {}) {
  const s = hallwaySection(options);
  const scale = Math.min(1, s.springLine / Math.max(0.1, s.height));
  return {
    width: s.width * scale,
    height: s.height * scale,
    archRise: s.archRise * scale,
    scale,
  };
}

export function hallwaySpringLine(options = {}) {
  return hallwaySection(options).springLine;
}
