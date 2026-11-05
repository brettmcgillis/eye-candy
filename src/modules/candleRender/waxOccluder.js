import { If, float, max, min, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { FAR } from '@modules/fireSim';

function cylinderSpan(o, d, radius) {
  const a = d.x.mul(d.x).add(d.z.mul(d.z)).max(1e-8);
  const b = o.x.mul(d.x).add(o.z.mul(d.z));
  const c = o.x.mul(o.x).add(o.z.mul(o.z)).sub(radius.mul(radius));
  const disc = b.mul(b).sub(a.mul(c));
  const root = disc.max(0).sqrt();
  const enter = b.negate().sub(root).div(a);
  const leave = b.negate().add(root).div(a);
  const hit = disc.greaterThan(0);
  return {
    enter: hit.select(enter, float(FAR)),
    leave: hit.select(leave, float(-FAR)),
  };
}

function slabSpan(o, d, lo, hi) {
  const dy = d.y.abs().lessThan(1e-6).select(float(1e-6), d.y);
  const a = lo.sub(o.y).div(dy);
  const b = hi.sub(o.y).div(dy);
  return { enter: min(a, b), leave: max(a, b) };
}

const both = (p, q) => ({
  enter: max(p.enter, q.enter),
  leave: min(p.leave, q.leave),
});

// Where the camera ray first enters the wax, in the same `t` the flame's
// march uses (the candle matrix is rigid). The candle is a cylinder of its
// widest body radius between the rims, less a crater pocket at each end: a
// ray in through a crater mouth meets wax only where it leaves the pocket,
// through the pool or the wall. Analytic, so wax far outside the flame's
// box still hides it — the bottom flame behind the candle's lower end, say.
// `viewportLinearDepth` reads 0 or garbage headlessly, so the candle cannot
// use the fire sim's depth occluder.
export default function createWaxOccluder() {
  const u = {
    candleMatrix: uniform(new THREE.Matrix4()),
    innerR: uniform(0),
    outerR: uniform(0),
    poolY: uniform(0),
    rimY: uniform(-100),
  };
  const occluder = (eye, dir) => {
    const o = u.candleMatrix.mul(vec4(eye, 1)).xyz;
    const d = u.candleMatrix.mul(vec4(dir, 0)).xyz;
    const body = both(
      cylinderSpan(o, d, u.outerR),
      slabSpan(o, d, u.rimY.negate(), u.rimY)
    );
    const pocket = cylinderSpan(o, d, u.innerR);
    const top = both(pocket, slabSpan(o, d, u.poolY, u.rimY));
    const bottom = both(
      pocket,
      slabSpan(o, d, u.rimY.negate(), u.poolY.negate())
    );
    const entry = max(body.enter, 0).toVar();
    If(entry.greaterThanEqual(top.enter).and(entry.lessThan(top.leave)), () => {
      entry.assign(top.leave);
    });
    If(
      entry.greaterThanEqual(bottom.enter).and(entry.lessThan(bottom.leave)),
      () => {
        entry.assign(bottom.leave);
      }
    );
    return entry.lessThan(body.leave).select(entry, float(FAR));
  };
  return { occluder, uniforms: u };
}
