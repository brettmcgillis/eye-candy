import { atan, cos, dot, round, sin, uniform, vec2 } from 'three/tsl';

export function polygonUniforms() {
  return {
    apothem: uniform(1),
    base: uniform(0),
    inset: uniform(0),
    step: uniform(Math.PI / 2),
  };
}

export function applyPolygonUniforms(uniforms, shape) {
  const u = uniforms;
  u.apothem.value = shape.apothem;
  u.base.value = shape.base;
  u.inset.value = shape.inset;
  u.step.value = shape.step;
}

// Signed distance to the nearest edge line of the regular polygon, plus that
// edge's outward normal. A circle is the same polygon with enough sides that
// the fold collapses to length(point) - apothem.
export function polygonAt(point, shape) {
  const swept = atan(point.y, point.x).sub(shape.base);
  const angle = shape.base.add(round(swept.div(shape.step)).mul(shape.step));
  const facet = vec2(cos(angle), sin(angle));

  return { facet, distance: dot(point, facet).sub(shape.apothem) };
}
