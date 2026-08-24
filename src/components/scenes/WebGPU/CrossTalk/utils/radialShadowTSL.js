import {
  Break,
  Fn,
  If,
  Loop,
  and,
  float,
  mod,
  select,
  sign,
  vec2,
} from 'three/tsl';

import { atlasSDF } from './occluderAtlas';
import { ATLAS_BASE, MAX_WINDOWS } from './radianceConstants';

// TSL port of references/radianceCascades2.glsl (Shadertoy XsK3RR). Despite
// the preset's "Radiance Cascades" name, that shader is NOT cascades — it's a
// per-light 1D radial distance-field shadow map: Buffer A marches every
// light's rays outward in all directions once and stores the nearest-occluder
// distance per angle; the image pass looks up each pixel's angle-to-light and
// compares its radius against that stored distance to decide lit/shadowed,
// with inverse-square falloff.
//
// The multi-tab twist: the scene here is the UNION of every alive window's
// geometry (walls from the window-rect union, plus each window's decorative
// scene + user occluder), and every light is marched against that shared
// scene. So light from one window bleeds into a window it overlaps, and the
// occluders of both windows stack in the overlap — the "corners of overlapping
// tabs provide extra occlusion" behaviour falls straight out of the union SDF.

const MARCH_STEPS = 64;
const HIT_EPSILON = 1e-2;
const MIN_STEP = 0.5;
const MAX_TRACE = 8000;
export const NO_HIT = 1e5;

// --- SDF primitives (all take a node point, return a node distance) ---

// Proper box SDF (negative inside), used for the window rects and the user
// occluder where a clean gradient matters for smooth shadow marching.
const sdBox = (halfExtents, p) => {
  const d = p.abs().sub(halfExtents);
  return d.max(vec2(0)).length().add(d.x.max(d.y).min(0));
};

// Shadertoy's cheaper shapes, ported verbatim for the decorative scene.
const sdCircle = (r, p) => p.length().sub(r);
const sdBoxSquare = (s, p) => p.x.abs().max(p.y.abs()).sub(s);
const sdRect = (s, p) => p.x.abs().sub(s.x).max(p.y.abs().sub(s.y));
const sdRing = (ir, or, p) =>
  p
    .length()
    .sub((ir + or) / 2)
    .abs()
    .sub(or - ir);

// sdEquilateralTriangle(p, r) — r is the circumradius, matching OccluderHandle.
const sdTriangle = Fn(([pIn, r]) => {
  const k = Math.sqrt(3);
  const p = vec2(pIn.x.abs().sub(r), pIn.y.add(r.div(k))).toVar();
  If(p.x.add(p.y.mul(k)).greaterThan(0), () => {
    p.assign(vec2(p.x.sub(p.y.mul(k)), p.x.mul(-k).sub(p.y)).mul(0.5));
  });
  p.x.subAssign(p.x.clamp(r.mul(-2), 0));
  return p.length().mul(sign(p.y)).negate();
});

// CCW rotation by a node angle.
const rotate2D = (p, a) => {
  const c = a.cos();
  const s = a.sin();
  return vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c)));
};

// Domain repetition (Rep1/Rep2 from the reference).
const rep2 = (p, r) => mod(p, vec2(r, r)).sub(r / 2);
const rep1 = (p, r) => vec2(mod(p.x, r).sub(r / 2), p.y);

// --- extra occluder shapes, ported from references/markers.glsl (Nicolas
// Rougier's marker SDFs). `r` is a radius-like size (osize.x) so every shape
// reads at a comparable scale to the circle.
const sdDiamond = (p, r) => p.x.abs().add(p.y.abs()).sub(r);

const sdCross = (p, r) =>
  sdBox(vec2(r, r.mul(0.34)), p).min(sdBox(vec2(r.mul(0.34), r), p));

const sdAnnulus = (p, r) =>
  p
    .length()
    .sub(r)
    .max(p.length().sub(r.mul(0.5)).negate());

const sdHeart = (p, r) => {
  const k = Math.SQRT1_2;
  const q = r.mul(2 / 3.5);
  const x = p.x.sub(p.y).mul(k);
  const y = p.x.add(p.y).mul(k);
  const r1 = x.abs().max(y.abs()).sub(q);
  const r2 = p.sub(vec2(k, -k).mul(q)).length().sub(q);
  const r3 = p.sub(vec2(-k, -k).mul(q)).length().sub(q);
  return r1.min(r2).min(r3);
};

const sdClover = (p, r) => {
  const q = r.mul(2 / 3.5);
  const off = r.mul(0.5);
  const disc = (ang) =>
    p
      .sub(vec2(Math.cos(ang), Math.sin(ang)).mul(off))
      .length()
      .sub(q);
  const t1 = -Math.PI / 2;
  const t2 = t1 + (2 * Math.PI) / 3;
  const t3 = t2 + (2 * Math.PI) / 3;
  return disc(t1).min(disc(t2)).min(disc(t3));
};

// markers.glsl uses `size` as the full marker box; our `r` is radius-like, so
// these pass `size = 2r` to keep every shape ~the same on-screen scale.
const K = Math.SQRT1_2; // SQRT_2 / 2

const sdSpade = (p, r) => {
  const size = r.mul(2);
  const s = size.mul(0.85 / 3.5);
  const x = p.x.add(p.y).mul(K).add(s.mul(0.4));
  const y = p.x.sub(p.y).mul(K).sub(s.mul(0.4));
  const r1 = x.abs().max(y.abs()).sub(s);
  const r2 = p
    .sub(vec2(K, K * 0.2).mul(s))
    .length()
    .sub(s);
  const r3 = p
    .sub(vec2(-K, K * 0.2).mul(s))
    .length()
    .sub(s);
  const r4 = r1.min(r2).min(r3);
  const r5 = p.sub(vec2(0.65, 0.125).mul(size)).length().sub(size.div(1.6));
  const r6 = p.sub(vec2(-0.65, 0.125).mul(size)).length().sub(size.div(1.6));
  // The root's slab is unbounded in x; the reference relies on the point
  // sprite to clip it. Bound it to the central stem so its far ends don't
  // render as bars across our larger occluder quad.
  const r9 = r5
    .min(r6)
    .negate()
    .max(p.y.sub(size.mul(0.5)).max(size.mul(0.1).sub(p.y)))
    .max(p.x.abs().sub(size.mul(0.4)));
  return r4.min(r9);
};

const sdClub = (p, r) => {
  const size = r.mul(2);
  const disc = (ang) =>
    p
      .sub(vec2(Math.cos(ang), Math.sin(ang)).mul(size.mul(0.225)))
      .length()
      .sub(size.div(4.25));
  const t1 = -Math.PI / 2;
  const t2 = t1 + (2 * Math.PI) / 3;
  const t3 = t2 + (2 * Math.PI) / 3;
  const r4 = disc(t1).min(disc(t2)).min(disc(t3));
  const r5 = p.sub(vec2(0.65, 0.125).mul(size)).length().sub(size.div(1.6));
  const r6 = p.sub(vec2(-0.65, 0.125).mul(size)).length().sub(size.div(1.6));
  const r9 = r5
    .min(r6)
    .negate()
    .max(p.y.sub(size.mul(0.5)).max(size.mul(0.2).sub(p.y)))
    .max(p.x.abs().sub(size.mul(0.4)));
  return r4.min(r9);
};

const sdChevron = (p, r) => {
  const size = r.mul(2);
  const x = p.x.sub(p.y).mul(K);
  const y = p.x.add(p.y).mul(K);
  const third = size.div(3);
  const r1 = x.abs().max(y.abs()).sub(third);
  const r2 = x.sub(third).abs().max(y.sub(third).abs()).sub(third);
  return r1.max(r2.negate());
};

const sdTag = (p, r) => {
  const size = r.mul(2);
  const r1 = p.x
    .abs()
    .sub(size.div(2))
    .max(p.y.abs().sub(size.div(6)));
  const r2 = p.x.sub(size.div(1.5)).abs().add(p.y.abs()).sub(size);
  return r1.max(r2.mul(0.75));
};

const sdAsterisk = (p, r) => {
  const size = r.mul(2);
  const x = p.x.sub(p.y).mul(K);
  const y = p.x.add(p.y).mul(K);
  const h = size.div(2);
  const t = size.div(10);
  const r1 = x.abs().sub(h).max(y.abs().sub(t));
  const r2 = y.abs().sub(h).max(x.abs().sub(t));
  const r3 = p.x.abs().sub(h).max(p.y.abs().sub(t));
  const r4 = p.y.abs().sub(h).max(p.x.abs().sub(t));
  return r1.min(r2).min(r3).min(r4);
};

const sdInfinity = (p, r) => {
  const size = r.mul(2);
  const p1 = p.sub(vec2(0.2125, 0).mul(size));
  const p2 = p.sub(vec2(-0.2125, 0).mul(size));
  const r1 = p1.length().sub(size.div(3.5));
  const r2 = p1.length().sub(size.div(7.5));
  const r3 = p2.length().sub(size.div(3.5));
  const r4 = p2.length().sub(size.div(7.5));
  return r1.max(r2.negate()).min(r3.max(r4.negate()));
};

const sdPin = (p, r) => {
  const size = r.mul(2);
  const c1 = vec2(0, -0.15).mul(size);
  const r1 = p.sub(c1).length().sub(size.div(2.675));
  const r2 = p.sub(vec2(1.49, -0.8).mul(size)).length().sub(size.mul(2));
  const r3 = p.sub(vec2(-1.49, -0.8).mul(size)).length().sub(size.mul(2));
  const r4 = p.sub(c1).length().sub(size.div(5));
  return r1.min(r2.max(r3).max(p.y.negate())).max(r4.negate());
};

const sdArrow = (p, r) => {
  const size = r.mul(2);
  const r1 = p.x.abs().add(p.y.abs()).sub(size.div(2));
  const r2 = p.x.add(size.div(2)).abs().max(p.y.abs()).sub(size.div(2));
  const r3 = p.x
    .sub(size.div(6))
    .abs()
    .sub(size.div(4))
    .max(p.y.abs().sub(size.div(4)));
  return r3.min(r1.mul(0.75).max(r2));
};

// Approximate ellipse (sign-correct, conservative for marching) — not the
// reference's exact IQ root-solve, but visually an ellipse.
const sdEllipse = (p, r) => {
  const size = r.mul(2);
  const ax = size.div(3);
  const ay = size.div(2);
  const kk = vec2(p.x.div(ax), p.y.div(ay)).length();
  return kk.sub(1).mul(ax.min(ay));
};

// Occluder shape ids — must match radianceConstants' OCCLUDER_SHAPES order and
// the Leva dropdown. Exported so OccluderHandle can preview any shape with the
// exact SDF the scene shades against. An If/ElseIf chain (not nested select) so
// only the active shape's SDF is evaluated per sample. Ids from ATLAS_BASE up
// are artwork sampled out of the baked SDF atlas rather than an analytic form.
export const occluderSDF = (shapeId, p, osize) => {
  const r = osize.x;
  const d = float(NO_HIT).toVar();
  If(shapeId.lessThan(0.5), () => d.assign(sdCircle(r, p)))
    .ElseIf(shapeId.lessThan(1.5), () => d.assign(sdBox(osize, p)))
    .ElseIf(shapeId.lessThan(2.5), () => d.assign(sdTriangle(p, r)))
    .ElseIf(shapeId.lessThan(3.5), () => d.assign(sdDiamond(p, r)))
    .ElseIf(shapeId.lessThan(4.5), () => d.assign(sdCross(p, r)))
    .ElseIf(shapeId.lessThan(5.5), () => d.assign(sdAnnulus(p, r)))
    .ElseIf(shapeId.lessThan(6.5), () => d.assign(sdHeart(p, r)))
    .ElseIf(shapeId.lessThan(7.5), () => d.assign(sdClover(p, r)))
    .ElseIf(shapeId.lessThan(8.5), () => d.assign(sdSpade(p, r)))
    .ElseIf(shapeId.lessThan(9.5), () => d.assign(sdClub(p, r)))
    .ElseIf(shapeId.lessThan(10.5), () => d.assign(sdChevron(p, r)))
    .ElseIf(shapeId.lessThan(11.5), () => d.assign(sdTag(p, r)))
    .ElseIf(shapeId.lessThan(12.5), () => d.assign(sdAsterisk(p, r)))
    .ElseIf(shapeId.lessThan(13.5), () => d.assign(sdInfinity(p, r)))
    .ElseIf(shapeId.lessThan(14.5), () => d.assign(sdPin(p, r)))
    .ElseIf(shapeId.lessThan(15.5), () => d.assign(sdArrow(p, r)))
    .ElseIf(shapeId.lessThan(16.5), () => d.assign(sdEllipse(p, r)))
    .Else(() => {
      const half = r.mul(1.25);
      d.assign(
        atlasSDF(shapeId.sub(ATLAS_BASE), p, r, sdBox(vec2(half, half), p))
      );
    });
  return d;
};

// The reference's Scene(), in units of one decor cell — evaluated once in a
// single desktop-wide space (see buildSceneSDF) rather than per window, so
// overlapping tabs read as windows onto one continuous field instead of each
// stamping its own copy. The room-wall term is dropped here; our walls come
// from the shared window-rect union instead.
const decorativeScene = (n, time) => {
  let d = sdCircle(0.02, rep2(n, 0.2));
  d = d.min(sdRect(vec2(0.005, 0.1), rep1(n, 0.2)));
  d = d.max(sdBoxSquare(0.2, n).negate()); // opS: carve central square
  d = d.min(sdRing(0.08, 0.09, n));
  d = d.max(sdRect(vec2(0.11, 0.03), rotate2D(n, time)).negate()); // opS slot
  return d;
};

// The decorative field, as its own SDF: one contiguous desktop-wide space
// anchored on `decor.origin` (the host tab's window centre) rather than
// per-window, so overlapping tabs read as windows onto one field. Kept
// separate from buildSceneSDF because the compose pass needs to tell decor
// apart from the rest of the scene to shade it its own colour.
export function buildDecorSDF(timeU, decor) {
  return Fn(([worldPos]) => {
    const scale = decor.scale.max(1);
    const n = worldPos.sub(decor.origin).div(scale);
    const d = decorativeScene(n, timeU.mul(decor.spin)).mul(scale);
    return select(decor.enabled.greaterThan(0.5), d, float(NO_HIT));
  });
}

// The shared analytic scene, in absolute desktop pixels. Returns a signed
// distance: positive in empty (marchable) space, negative inside any occluder
// or outside the union of all window rects.
export function buildSceneSDF(u, decorFn) {
  return Fn(([worldPos]) => {
    const best = float(NO_HIT).toVar();
    const unionDist = float(NO_HIT).toVar();

    Loop({ end: MAX_WINDOWS, start: 0, type: 'int' }, ({ i }) => {
      const alive = i.lessThan(u.windowCount);
      const rect = u.windowRect.element(i);
      const center = vec2(
        rect.x.add(rect.z.mul(0.5)),
        rect.y.add(rect.w.mul(0.5))
      );
      const half = vec2(rect.z.mul(0.5), rect.w.mul(0.5));
      const local = worldPos.sub(center);

      unionDist.assign(
        select(alive, unionDist.min(sdBox(half, local)), unionDist)
      );

      const od = u.occluderData.element(i);
      const osize = u.occluderSize.element(i);
      const oLocal = rotate2D(worldPos.sub(od.xy), od.z.negate());
      const occ = occluderSDF(od.w, oLocal, osize);
      best.assign(
        select(and(alive, od.w.greaterThan(-0.5)), best.min(occ), best)
      );
    });

    best.assign(best.min(decorFn(worldPos)));

    // Walls: empty inside the union of window rects, an immediate hit outside.
    best.assign(best.min(unionDist.negate()));
    return best;
  });
}

// MarchShadow: sphere-trace `sceneFn` from a light origin along `dir` and
// return the distance to the first occluder. Deliberately marches from
// `origin + dir*t` (the correct radial form), NOT the reference's
// `Scene(dir*t - origin)` — that centred-space quirk only works for lights
// near the origin and breaks for the arbitrary world-space light positions we
// have here.
export function marchShadow(sceneFn, origin, dir) {
  const t = float(0).toVar();

  Loop({ end: MARCH_STEPS, start: 0, type: 'int' }, () => {
    const ds = sceneFn(origin.add(dir.mul(t)));
    If(ds.lessThan(HIT_EPSILON), () => {
      Break();
    });
    t.addAssign(ds.max(MIN_STEP));
    If(t.greaterThan(MAX_TRACE), () => {
      Break();
    });
  });

  return t;
}
