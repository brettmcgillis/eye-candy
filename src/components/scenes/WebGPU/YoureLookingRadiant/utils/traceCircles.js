import { If, Loop, and, float } from 'three/tsl';

// Distance from a light to the first occluder along a ray, solved rather than
// marched. A circle is the only body in this scene, and ray-versus-circle is a
// quadratic, so the 64 sphere-tracing steps the shared module needs for
// arbitrary SDFs collapse to one intersection per body.
//
// Stands in for the module's `marchShadow` as the shadow map's `marchFn`.
// CrossTalk still needs the marcher; this scene does not.

// A miss, in pixels. Must stay well inside half-float range: the shadow map is
// a HalfFloatType target, and the module's NO_HIT of 1e5 lands there as
// Infinity, which turns the compose's smoothstep into NaN.
const MISS = 1e4;

export default function buildCircleTrace(u) {
  return (origin, dir, lightIndex) => {
    const exclude = u.lightOwner.element(lightIndex);
    const nearest = float(MISS).toVar();

    Loop({ end: u.bodyCount, start: 0, type: 'int' }, ({ i }) => {
      const data = u.bodyData.element(i);
      const radius = data.z;
      // Glass bends light rather than stopping it, and a light sits inside its
      // own body — without that exclusion every ray terminates at t = 0 and
      // the whole frame reads as shadowed.
      const solid = and(
        radius.greaterThan(0),
        and(u.bodyInfo.element(i).y.lessThan(0.5), float(i).notEqual(exclude))
      );

      If(solid, () => {
        const toCentre = origin.sub(data.xy);
        const along = toCentre.dot(dir);
        const gap = toCentre.dot(toCentre).sub(radius.mul(radius));
        const disc = along.mul(along).sub(gap);

        If(disc.greaterThan(0), () => {
          const t = along.negate().sub(disc.sqrt());

          If(t.greaterThan(0), () => {
            nearest.assign(nearest.min(t));
          });
        });
      });
    });

    return nearest;
  };
}
