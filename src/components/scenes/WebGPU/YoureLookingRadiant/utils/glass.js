import {
  If,
  Loop,
  float,
  pow,
  reflect,
  refract,
  select,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';

export const EDGE_AA_PX = 1.5;

const MIRROR_REACH = 1.6;

export function nearestGlass(g, worldPos) {
  const nearest = float(1e6).toVar();
  const centre = vec2(0).toVar();
  const radius = float(1).toVar();

  Loop({ end: g.bodyCount, start: 0, type: 'int' }, ({ i }) => {
    If(g.bodyInfo.element(i).y.greaterThan(0.5), () => {
      const data = g.bodyData.element(i);
      const at = data.xy;
      const r = data.w;
      const d = worldPos.sub(at).length().sub(r);

      If(d.lessThan(nearest), () => {
        nearest.assign(d);
        centre.assign(at);
        radius.assign(r);
      });
    });
  });

  // Clamped to the unit disc before the normal is built: outside a lens, or
  // with no lens at all, `local` is the pixel's own coordinates and the
  // unnormalised normal it makes throws an offset thousands of pixels long.
  const local = worldPos.sub(centre).div(radius.max(1e-4));
  const unit = local.div(local.length().max(1));
  const height = float(1).sub(unit.dot(unit)).max(0).sqrt();

  return {
    centre,
    dist: nearest,
    height,
    inside: smoothstep(0, EDGE_AA_PX, nearest).oneMinus(),
    normal: vec3(unit, height),
    radius,
    unit,
  };
}

// Both surfaces of the ball, not one. A single refraction only smears what is
// behind it; the traverse and the exit are what invert the picture, and an
// inverted picture is the whole reason a glass ball reads as glass.
export function ballOffset(lens, ior, depth) {
  const entry = refract(vec3(0, 0, -1), lens.normal, float(1).div(ior));
  const exitPoint = lens.normal.add(entry.mul(entry.dot(lens.normal).mul(-2)));
  const leaving = refract(entry, exitPoint.negate(), ior);
  const travel = depth.negate().sub(exitPoint.z).div(leaving.z.min(-1e-3));
  const landing = exitPoint.xy.add(leaving.xy.mul(travel));
  // refract returns zero under total internal reflection: no transmitted ray
  // to follow, and Fresnel has already handed that pixel to the mirror term.
  const escaped = leaving.dot(leaving).greaterThan(0.25);

  return select(escaped, landing.sub(lens.unit).mul(lens.radius), vec2(0));
}

export function fresnelTerm(lens, ior) {
  const f0 = ior.sub(1).div(ior.add(1));
  const r0 = f0.mul(f0);

  return r0.add(float(1).sub(r0).mul(pow(lens.height.oneMinus(), 5)));
}

export function mirrorOffset(lens) {
  return reflect(vec3(0, 0, -1), lens.normal)
    .xy.mul(lens.radius)
    .mul(MIRROR_REACH);
}
