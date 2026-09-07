import * as THREE from 'three/webgpu';

export const LANDING_DEFAULTS = {
  innerRadius: 24,
  outerRadius: 30,
  innerRadiusEnd: null,
  outerRadiusEnd: null,
  arc: Math.PI / 8,
  thickness: 1.2,
  radialSegments: 24,
};

// A flat annular sector with real thickness — top, underside and all four
// edges — so it reads as a slab rather than a floating plane. Radii are given
// explicitly: the outer edge has to sit exactly on the wall's inner face or
// the slab cuts through it.
export default function createLanding(options = {}) {
  const o = { ...LANDING_DEFAULTS, ...options };
  const inner = o.innerRadius;
  const outer = o.outerRadius;
  // A landing is the transition piece where the shaft changes gauge, so it
  // tapers for the same reason a flight does: it has to leave at whatever
  // radius the flight below it arrives at.
  const innerEnd = o.innerRadiusEnd ?? inner;
  const outerEnd = o.outerRadiusEnd ?? outer;
  const segments = Math.max(2, Math.round(o.radialSegments));
  const top = 0;
  const bottom = -o.thickness;

  const positions = [];
  const indices = [];
  const ring = (from, to, y) => {
    const start = positions.length / 3;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const a = t * o.arc;
      const radius = from + (to - from) * t;
      positions.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
    }
    return start;
  };

  const innerTop = ring(inner, innerEnd, top);
  const outerTop = ring(outer, outerEnd, top);
  const innerBottom = ring(inner, innerEnd, bottom);
  const outerBottom = ring(outer, outerEnd, bottom);

  const strip = (a, b, flip) => {
    for (let i = 0; i < segments; i += 1) {
      const a0 = a + i;
      const a1 = a + i + 1;
      const b0 = b + i;
      const b1 = b + i + 1;
      if (flip) indices.push(a0, b0, b1, a0, b1, a1);
      else indices.push(a0, b1, b0, a0, a1, b1);
    }
  };

  strip(innerTop, outerTop, false);
  strip(innerBottom, outerBottom, true);
  strip(outerTop, outerBottom, false);
  strip(innerTop, innerBottom, true);

  const cap = (t0, t1, b0, b1, flip) => {
    if (flip) indices.push(t0, b0, b1, t0, b1, t1);
    else indices.push(t0, b1, b0, t0, t1, b1);
  };
  cap(innerTop, outerTop, innerBottom, outerBottom, true);
  cap(
    innerTop + segments,
    outerTop + segments,
    innerBottom + segments,
    outerBottom + segments,
    false
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  // Flat-shaded: the slab's top shares its rim vertices with the curved edges,
  // and averaging those normals smeared a gradient across what should read as
  // a flat stone surface.
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  geometry.dispose();
  return flat;
}
