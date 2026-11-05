import { getSplineWorldPoints } from '@elements/SplineGroup/splineDefaults';
import { MAX_EMITTERS } from '@modules/fireSim';
import splinePath from '@utils/splinePath';

const GUIDE_SAMPLES = 48;

// An authored spline's centre line in world space, equally spaced.
export function splineWorldPath(spline, samples = GUIDE_SAMPLES) {
  return splinePath(
    getSplineWorldPoints(spline).map((point) => point.position),
    { closed: spline.closed, samples, tension: spline.tension ?? 0.5 }
  );
}

// The sim box round every fire spline (padded, with headroom above for the
// flames to rise into), and each spline as an emitter along its first
// `emitLength` and a guide along all of it, both in box space.
export function fireLayout(
  splines,
  {
    emitLength,
    emitRadius,
    guideRadius,
    guideSpeed,
    guideTaper,
    headroom,
    padding,
  }
) {
  const paths = splines
    .slice(0, MAX_EMITTERS)
    .map((spline) => ({ path: splineWorldPath(spline), spline }))
    .filter(({ path }) => path.length > 1);
  if (!paths.length) return null;

  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  paths.forEach(({ path }) =>
    path.forEach((p) =>
      p.forEach((v, k) => {
        lo[k] = Math.min(lo[k], v);
        hi[k] = Math.max(hi[k], v);
      })
    )
  );
  const pad = padding + guideRadius;
  const min = lo.map((v) => v - pad);
  const max = hi.map((v, k) => v + pad + (k === 1 ? headroom : 0));
  const centre = min.map((v, k) => (v + max[k]) / 2);
  const size = min.map((v, k) => max[k] - v);
  const local = (p) => p.map((v, k) => v - centre[k]);

  return {
    centre,
    size,
    emitters: paths.map(({ path, spline }) => ({
      a: local(path[0]),
      b: local(path[Math.round(emitLength * (path.length - 1))]),
      radius: emitRadius * (spline.simScale ?? 1),
      strength: spline.simStrength ?? 1,
    })),
    guides: paths.map(({ path, spline }) => ({
      points: path.map(local),
      radius: guideRadius,
      speed: guideSpeed,
      strength: spline.simGuide ?? 1,
      taper: guideTaper,
    })),
  };
}
