import {
  Fn,
  If,
  Loop,
  Return,
  abs,
  cross,
  dot,
  float,
  instanceIndex,
  int,
  max,
  min,
  mix,
  normalize,
  select,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

// One thread walks one wire: a binomial low-pass over the beads (the solver's
// chain kinks at bead spacing, finer than the tube can bend), then a
// rotation-minimising frame by double reflection (Wang et al. 2008). The tube
// sweeps its ring around that frame, so it never twists or pinches however
// the wire turns — which a stateless frame cannot promise.
export default function createFrames(b, u, layout) {
  const { pointsPerWire, wireCount } = layout;
  const last = pointsPerWire - 1;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(wireCount)), () => {
      Return();
    });
    const base = int(instanceIndex).mul(pointsPerWire).toVar();
    const raw = (t) => b.pos.element(base.add(t.clamp(0, last)));

    Loop(
      { start: int(0), end: int(pointsPerWire), type: 'int', name: 't' },
      ({ t }) => {
        const smoothed = raw(t.sub(2))
          .add(raw(t.sub(1)).mul(4))
          .add(raw(t).mul(6))
          .add(raw(t.add(1)).mul(4))
          .add(raw(t.add(2)))
          .div(16);
        const end = t.equal(0).or(t.equal(last));
        const weight = select(end, float(0), u.wireSmoothing);
        b.render.element(base.add(t)).assign(mix(raw(t), smoothed, weight));
      }
    );

    const at = (t) => b.render.element(base.add(t)).xyz;
    const tangentAt = (t) =>
      normalize(at(min(t.add(1), int(last))).sub(at(max(t.sub(1), int(0)))));

    const t0 = tangentAt(int(0));
    const axis = select(abs(t0.x).lessThan(0.9), vec3(1, 0, 0), vec3(0, 0, 1));
    const r = normalize(cross(t0, axis)).toVar();
    b.frame.element(base).assign(vec4(r, 0));

    Loop({ start: int(0), end: int(last), type: 'int', name: 'i' }, ({ i }) => {
      const tangent = tangentAt(i);
      const next = i.add(1);
      const tangentNext = tangentAt(next).toVar();
      const v1 = at(next).sub(at(i)).toVar();
      const c1 = max(dot(v1, v1), float(1e-12));
      const rL = r.sub(v1.mul(dot(v1, r).mul(2).div(c1))).toVar();
      const tL = tangent.sub(v1.mul(dot(v1, tangent).mul(2).div(c1)));
      const v2 = tangentNext.sub(tL).toVar();
      const c2 = dot(v2, v2);
      const reflected = select(
        c2.greaterThan(1e-12),
        rL.sub(
          v2.mul(
            dot(v2, rL)
              .mul(2)
              .div(max(c2, float(1e-12)))
          )
        ),
        rL
      );
      r.assign(
        normalize(reflected.sub(tangentNext.mul(dot(reflected, tangentNext))))
      );
      b.frame.element(base.add(next)).assign(vec4(r, 0));
    });
  })().compute(wireCount);
}
