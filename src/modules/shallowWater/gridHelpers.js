import { float, floor, instanceIndex, int, ivec2, mix, vec2 } from 'three/tsl';

// Everything the kernels do to get from an invocation index to a world point
// and back. Parameterised on the grid size and the domain size rather than
// reading module constants, because the solver resolution is a scene control
// and the domain is a scene's own sense of scale: changing either rebuilds
// these kernels instead of reinterpreting a fixed one.
export default function gridHelpers(res, worldSize) {
  const cell = worldSize / res;

  const coordOf = () =>
    ivec2(int(instanceIndex.mod(res)), int(instanceIndex.div(res)));
  const clamped = (c) => ivec2(c.x.clamp(0, res - 1), c.y.clamp(0, res - 1));
  const inside = (c) =>
    c.x
      .greaterThanEqual(0)
      .and(c.x.lessThan(res))
      .and(c.y.greaterThanEqual(0))
      .and(c.y.lessThan(res));

  const fieldAt = (field, c) => {
    const cc = clamped(c);
    return field.element(cc.y.mul(res).add(cc.x));
  };
  const bedAt = (field, c) => fieldAt(field, c).x;

  // Row 0 is the upstream / deep edge at +z, so world z runs backwards through
  // the grid.
  const worldOf = (c) =>
    vec2(
      float(c.x)
        .div(res - 1)
        .sub(0.5)
        .mul(worldSize),
      float(0.5)
        .sub(float(c.y).div(res - 1))
        .mul(worldSize)
    );

  const uvOf = (c) => vec2(c).add(0.5).div(res);

  // Velocity is stored in world space so the grains can use it unchanged.
  // Walking a uv back along it therefore has to flip z, which is the one place
  // that sign lives.
  const uvDrift = (velocity) =>
    vec2(velocity.x, velocity.y.negate()).div(worldSize);

  const bilinear = (source, uv) => {
    const p = uv.mul(res).sub(0.5);
    const base = ivec2(floor(p));
    const f = p.sub(floor(p));
    const at = (dx, dy) => source.load(clamped(base.add(ivec2(dx, dy))));
    return mix(mix(at(0, 0), at(1, 0), f.x), mix(at(0, 1), at(1, 1), f.x), f.y);
  };

  return {
    bedAt,
    bilinear,
    cell,
    clamped,
    coordOf,
    fieldAt,
    inside,
    uvDrift,
    uvOf,
    worldOf,
  };
}
