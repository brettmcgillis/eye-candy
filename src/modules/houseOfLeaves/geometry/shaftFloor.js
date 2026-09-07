import * as THREE from 'three/webgpu';

import {
  EDGE_EPSILON,
  archHeightAt,
  orientInward,
  sampleSpan,
} from './geometryUtils';

export const SHAFT_FLOOR_DEFAULTS = {
  radius: 30,
  skirtHeight: 40,
  segments: 128,
  doorways: [],
};

// The bottom of the descent: a disc closing the shaft, with a skirt of wall
// rising from its edge. Corridors leave it through arched openings cut in that
// skirt — the floor of the world you finally reach, and every way out of it.
export default function createShaftFloor(options = {}) {
  const o = { ...SHAFT_FLOOR_DEFAULTS, ...options };
  const segments = Math.max(24, Math.round(o.segments));
  const positions = [0, 0, 0];
  const indices = [];

  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * o.radius, 0, Math.sin(angle) * o.radius);
  }
  for (let i = 0; i < segments; i += 1) {
    indices.push(0, 1 + ((i + 1) % segments), 1 + i);
  }

  // Each doorway occupies an angular span; the skirt is sampled with a doubled
  // vertex at every jamb so the opening's sides are vertical.
  const TAU = Math.PI * 2;
  const wrap = (a) => ((a % TAU) + TAU) % TAU;
  // Angles are compared as shortest angular distance and normalised into
  // [0, 2PI): a doorway placed past a full turn, or straddling the seam, must
  // still be cut. Comparing raw angles silently produced a wall with no exits.
  const spans = o.doorways.map((door) => {
    const half = door.width / (2 * o.radius);
    const angle = wrap(door.angle);
    return {
      ...door,
      angle,
      half,
      from: wrap(angle - half),
      to: wrap(angle + half),
    };
  });
  const topAt = (angle) => {
    let top = 0;
    spans.forEach((door) => {
      const delta = wrap(angle - door.angle + Math.PI) - Math.PI;
      const cut = archHeightAt(delta * o.radius, {
        width: door.width,
        height: door.height,
        archRise: door.archRise ?? door.width * 0.5,
      });
      if (cut > top) top = cut;
    });
    return top;
  };

  const breaks = [];
  spans.forEach((door) => breaks.push(door.from, door.to));
  // Resolve each doorway's arch properly: at 128 samples over a full turn a
  // 5m opening gets three points, which is why the arches read as chunky
  // facets rather than curves.
  const narrowest = spans.reduce(
    (min, door) => Math.min(min, door.half * 2),
    Infinity
  );
  const needed = Number.isFinite(narrowest)
    ? Math.ceil((TAU / narrowest) * 16)
    : 0;
  const samples = sampleSpan(
    0,
    TAU,
    Math.min(2048, Math.max(segments, needed)),
    breaks
  );
  const skirtBase = positions.length / 3;
  samples.forEach((sample) => {
    const angle = sample.v;
    const x = Math.cos(angle) * o.radius;
    const z = Math.sin(angle) * o.radius;
    positions.push(
      x,
      Math.min(topAt(angle + sample.side * EDGE_EPSILON), o.skirtHeight),
      z
    );
    positions.push(x, o.skirtHeight, z);
  });
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = skirtBase + i * 2;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  return orientInward(geometry, new THREE.Vector3(0, o.skirtHeight * 0.3, 0));
}

// Deterministic ring of exits, varied in size, for the room at the bottom.
export function shaftFloorDoorways({
  count = 6,
  radius = 30,
  baseWidth = 5,
  baseHeight = 8,
  variance = 0.5,
  archRatio = 0.3,
  avoidAngle = null,
} = {}) {
  const doorways = [];
  const spacing = (Math.PI * 2) / Math.max(1, count);
  // Centre the widest gap on the angle to avoid, so the last flight of stairs
  // comes down between two exits rather than across one.
  const offset = avoidAngle === null ? 0 : avoidAngle + spacing * 0.5;
  for (let i = 0; i < count; i += 1) {
    const angle = offset + i * spacing;
    const roll = Math.sin(i * 12.9898) * 43758.5453;
    const jitter = roll - Math.floor(roll);
    const scale = 1 + (jitter - 0.5) * variance;
    const width = Math.max(1.5, baseWidth * scale);
    const height = Math.max(2.5, baseHeight * scale);
    doorways.push({
      angle: ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
      width: Math.min(width, radius * 0.9),
      height,
      archRise: height * archRatio,
    });
  }
  return doorways;
}
