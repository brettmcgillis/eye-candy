import { Fn, Loop, and, float, select, vec2 } from 'three/tsl';

import {
  NO_HIT,
  buildOccluderSDF,
  rep1,
  rep2,
  rotate2D,
  sdBox,
  sdBoxSquare,
  sdCircle,
  sdRect,
  sdRing,
} from '@modules/radialShadow';

import { atlasSDF } from './occluderAtlas';
import { ATLAS_BASE, MAX_WINDOWS } from './radianceConstants';

// The CrossTalk-specific half of the radial shadow pipeline. The shared half —
// SDF primitives, the occluder shape chain, and marchShadow — was promoted to
// src/modules/radialShadow when You're Looking Radiant became a second
// consumer; docs/scene-conventions.md §6. What stays here is what only this
// scene has: the multi-window union scene and the decorative field.
//
// Despite the preset's "Radiance Cascades" name, the mechanism is NOT cascades
// — it's a per-light 1D radial distance-field shadow map: one pass marches
// every light's rays outward in all directions and stores the nearest-occluder
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

// Artwork ids past the analytic set are sampled out of the baked SDF atlas.
export const occluderSDF = buildOccluderSDF((shapeId, p, r) => {
  const half = r.mul(1.25);
  return atlasSDF(shapeId.sub(ATLAS_BASE), p, r, sdBox(vec2(half, half), p));
});

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
