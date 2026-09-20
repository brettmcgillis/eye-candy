import {
  atan,
  cos,
  dot,
  float,
  round,
  select,
  sin,
  smoothstep,
  uniform,
  vec2,
} from 'three/tsl';

export function bedShapeUniforms() {
  return {
    apothem: uniform(1),
    base: uniform(0),
    inset: uniform(0),
    step: uniform(Math.PI / 2),
  };
}

export function applyBedShapeUniforms(uniforms, shape) {
  const u = uniforms;
  u.apothem.value = shape.apothem;
  u.base.value = shape.base;
  u.inset.value = shape.inset;
  u.step.value = shape.step;
}

// Signed distance to the nearest edge line of the regular polygon, plus that
// edge's outward normal. A circle is the same polygon with enough sides that
// the fold collapses to length(point) - apothem.
export function bedShapeAt(point, shape) {
  const swept = atan(point.y, point.x).sub(shape.base);
  const angle = shape.base.add(round(swept.div(shape.step)).mul(shape.step));
  const facet = vec2(cos(angle), sin(angle));

  return { facet, distance: dot(point, facet).sub(shape.apothem) };
}

// How strongly a cell sits in the band just inside the rim that faces
// `towards` (+1 for the +z edge, -1 for the -z edge). Reduces to the old
// row-count band for a square at rotation 0, and follows the rim round a
// circle or into the V of a rotated hexagon.
export function bedRimBand(point, shape, reach, towards) {
  const { distance, facet } = bedShapeAt(point, shape);
  const inset = distance.negate();
  const near = float(1).sub(smoothstep(0, reach, inset));
  const faces = smoothstep(0.2, 0.7, facet.y.mul(towards));

  return select(distance.lessThan(0), near.mul(faces), float(0));
}
