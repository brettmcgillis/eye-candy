import { hash01 } from './signals';

const DEG = Math.PI / 180;
// Wander meanders: each leg swings SWING degrees to alternate sides of a
// course that itself drifts up to DRIFT degrees a leg, and runs between
// LEG_RANGE of the leg seconds. Alternate sides and a slow course never
// close a loop, so the view keeps going somewhere new.
const SWING = [25, 65];
const DRIFT = 18;
const LEG_RANGE = [0.6, 1.5];

// Where the view is over the field at `t`, in cells (x right, y up). The
// panel moves across the screen along `scrollHeading`; with turns it runs a
// leg of `scrollLeg` seconds, then eases into the next heading over
// `scrollTurnSeconds` (square: a right angle the same way every leg, so four
// legs close the loop; wander: a meander, see above).
export default function createRoute(config) {
  const speed = config.scrollSpeed;
  const base = Math.max(config.scrollLeg, 0.5);
  const wander = config.scrollTurns === 'wander';
  const salt = Math.imul(config.seed + 7, 2246822519);
  const roll = (k, n, [lo, hi]) => lo + (hi - lo) * hash01(salt, k * 4 + n);
  const side = hash01(salt, 1) < 0.5 ? -1 : 1;

  // ∫ (1 - smooth(x / ease)) dx from 0 to s: the old velocity's share.
  function along(leg, s) {
    const { at, ease, u, v } = leg;
    let c = 0;
    if (ease > 0) {
      const a = Math.min(s / ease, 1);
      c = Math.min(s, ease) - ease * (a ** 3 - a ** 4 / 2);
    }
    return [
      at[0] + v[0] * s + (u[0] - v[0]) * c,
      at[1] + v[1] * s + (u[1] - v[1]) * c,
    ];
  }
  // Leg k: its velocity, how long it runs, when it starts and where.
  const legs = [];
  let course = config.scrollHeading * DEG;
  const legAt = (k) => {
    while (legs.length <= k) {
      const j = legs.length;
      let heading = course + (j * Math.PI) / 2;
      let seconds = base;
      if (wander) {
        course += roll(j, 0, [-DRIFT, DRIFT]) * DEG;
        heading = course + (j % 2 ? side : -side) * roll(j, 1, SWING) * DEG;
        seconds = base * roll(j, 2, LEG_RANGE);
      }
      const v = [-speed * Math.cos(heading), -speed * Math.sin(heading)];
      const prev = legs[j - 1];
      const leg = { seconds, start: 0, at: [0, 0], u: prev?.v ?? v, v };
      leg.ease = Math.min(config.scrollTurnSeconds, seconds);
      if (prev) {
        leg.start = prev.start + prev.seconds;
        leg.at = along(prev, prev.seconds);
      }
      legs.push(leg);
    }
    return legs[k];
  };
  // The leg running at `t`, searched from the last one found.
  let hint = 0;
  const legOf = (t) => {
    let k = hint;
    while (k > 0 && legAt(k).start > t) k -= 1;
    while (legAt(k).start + legAt(k).seconds <= t) k += 1;
    hint = k;
    return legAt(k);
  };

  return function scrollPosition(t) {
    if (config.scrollTurns === 'none') {
      const { v } = legAt(0);
      return [v[0] * t, v[1] * t];
    }
    if (t <= 0) return along(legAt(0), t);
    const leg = legOf(t);
    return along(leg, t - leg.start);
  };
}
