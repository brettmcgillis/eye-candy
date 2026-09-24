import { Fn, clamp, float, floor, instanceIndex, int } from 'three/tsl';

// Catmull-Rom over one instance's slice of a packed control-point buffer. A
// polyline would do for an unlit ribbon, but a tube's frame is built from the
// derivative, and a polyline's derivative jumps at every joint — every control
// point would show as a facet. `.w` rides along, interpolated the same way.
export default function createCurveSampler({ points, pointsPerStrand }) {
  const segments = pointsPerStrand - 1;

  return Fn(([progress]) => {
    const f = clamp(progress, 0, 1).mul(float(segments));
    const i0 = int(floor(f)).min(int(segments - 1));
    const u = f.sub(float(i0));
    const base = int(instanceIndex).mul(int(pointsPerStrand));
    const at = (k) =>
      points.element(base.add(clamp(i0.add(int(k)), 0, segments)));

    const p0 = at(-1);
    const p1 = at(0);
    const p2 = at(1);
    const p3 = at(2);
    const u2 = u.mul(u);
    const u3 = u2.mul(u);

    return p1
      .mul(2)
      .add(p2.sub(p0).mul(u))
      .add(p0.mul(2).sub(p1.mul(5)).add(p2.mul(4)).sub(p3).mul(u2))
      .add(p0.negate().add(p1.mul(3)).sub(p2.mul(3)).add(p3).mul(u3))
      .mul(0.5);
  });
}
