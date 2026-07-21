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

import { MAX_WINDOWS } from './radianceConstants';

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

// Occluder ids — must match sceneTSL's OCCLUDER_* and the Leva dropdown.
const occluderSDF = (shapeId, p, osize) =>
  select(
    shapeId.lessThan(0.5),
    sdCircle(osize.x, p),
    select(shapeId.lessThan(1.5), sdBox(osize, p), sdTriangle(p, osize.x))
  );

// The reference's Scene(), in per-window normalized units (worldPos relative
// to the window centre, divided by the window height — same normalization the
// shadertoy does with iResolution.y). The room-wall term is dropped here; our
// walls come from the shared window-rect union instead (see buildSceneSDF), so
// that light can bleed across overlapping tabs.
const decorativeScene = (nlocal, time) => {
  let d = sdCircle(0.02, rep2(nlocal, 0.2));
  d = d.min(sdRect(vec2(0.005, 0.1), rep1(nlocal, 0.2)));
  d = d.max(sdBoxSquare(0.2, nlocal).negate()); // opS: carve central square
  d = d.min(sdRing(0.08, 0.09, nlocal));
  d = d.max(sdRect(vec2(0.11, 0.03), rotate2D(nlocal, time)).negate()); // opS slot
  return d;
};

// The shared analytic scene, in absolute desktop pixels. Returns a signed
// distance: positive in empty (marchable) space, negative inside any occluder
// or outside the union of all window rects. `sceneDetailU` (0/1) toggles the
// decorative field so a plain "just my light + occluder" look is available.
export function buildSceneSDF(u, timeU, sceneDetailU) {
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

      const nlocal = local.div(rect.w.max(1));
      const deco = decorativeScene(nlocal, timeU).mul(rect.w);
      best.assign(
        select(and(alive, sceneDetailU.greaterThan(0.5)), best.min(deco), best)
      );

      const od = u.occluderData.element(i);
      const osize = u.occluderSize.element(i);
      const oLocal = rotate2D(worldPos.sub(od.xy), od.z.negate());
      const occ = occluderSDF(od.w, oLocal, osize);
      best.assign(
        select(and(alive, od.w.greaterThan(-0.5)), best.min(occ), best)
      );
    });

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
