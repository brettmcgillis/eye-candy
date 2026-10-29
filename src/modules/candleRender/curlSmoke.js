/* eslint-disable no-bitwise */
import { curlNoise } from 'three/addons/tsl/math/curlNoise.js';
import {
  Fn,
  If,
  cos,
  exp,
  float,
  hash,
  instanceIndex,
  instancedArray,
  max,
  mix,
  mx_noise_float as mxNoise,
  positionLocal,
  select,
  sin,
  smoothstep,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createClayMaterial } from './styleMaterials';

// Cartoon draws a few particles as puffs, clay one ball per CLAY_STRIDE.
export const PUFF_SHARE = 0.01;
// A cartoon puff pops at this share of its life rather than dwindling to
// a speck.
export const PUFF_POP = 0.55;
export const CLAY_STRIDE = 64;
// How far the noise pattern drifts before it wraps, and the y it starts
// from: with the plume's ~17 units of height the sample stays in the window
// curlNoise works in.
const NOISE_PERIOD = 40;
const NOISE_Y = 45;

// three's TSL `hash` (PCG) on the CPU, so a plot sizes particles exactly as
// the GPU drew them.
function pcg(seed) {
  const state = (Math.imul(seed >>> 0, 747796405) + 2891336453) >>> 0;
  const word =
    Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>>
    0;
  return (((word >>> 22) ^ word) >>> 0) / 2 ** 32;
}

const smoothstepJs = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const pow2 = (n) => 2 ** Math.round(Math.log2(Math.max(1024, n)));

// Bitonic network as (k, j) pairs over `count` keys.
function sortSchedule(count) {
  const passes = [];
  for (let k = 2; k <= count; k *= 2) {
    for (let j = k / 2; j >= 1; j /= 2) passes.push([k, j]);
  }
  return passes;
}

// Candle smoke the way the TouchDesigner pieces build it: many particles,
// each nearly transparent, opacity by age, carried up a laminar column that
// breaks into curl-noise eddies, sorted by distance from the camera every
// frame and alpha-blended back to front — so overlap builds dense folds.
// One simulation feeds both ends: the bottom end draws it turned half a
// turn about z round its own emitter, the candle's suicide-king symmetry.
export default function createCurlSmoke({
  count: requested,
  look = 'realistic',
}) {
  const count = pow2(requested);
  const total = count * 2;
  const state = instancedArray(count, 'vec4').setName('smokeState');
  const motion = instancedArray(count, 'vec4').setName('smokeMotion');
  const order = instancedArray(total, 'vec2').setName('smokeOrder');

  const u = {
    amount: uniform(1),
    color: uniform(new THREE.Color('#c4c4c4')),
    curl: uniform(1),
    curlScale: uniform(1.3),
    curlSpeed: uniform(0.15),
    dt: uniform(1 / 60),
    emitterBottom: uniform(new THREE.Vector3()),
    emitterTop: uniform(new THREE.Vector3()),
    eye: uniform(new THREE.Vector3()),
    flameBottom: uniform(new THREE.Vector3()),
    flameColor: uniform(new THREE.Color('#ffb060')),
    flameLight: uniform(1),
    flameTop: uniform(new THREE.Vector3()),
    laminar: uniform(0.7),
    life: uniform(6),
    offset: uniform(0),
    ink: uniform(new THREE.Color('#1a1013')),
    inkWidth: uniform(0.02),
    opacity: uniform(0.045),
    prints: uniform(0.5),
    phase: uniform(0),
    rise: uniform(0.55),
    seed: uniform(11),
    size: uniform(1),
    sortJ: uniform(1, 'uint'),
    sortK: uniform(2, 'uint'),
    spread: uniform(0.5),
    sway: uniform(0.4),
    time: uniform(0),
  };

  const random = (n, salt) =>
    hash(
      n
        .mul(uint(4))
        .add(uint(salt))
        .add(u.seed.toUint().mul(uint(7919)))
    );

  // A particle's life as a share of `life`, jittered per particle so the
  // stream never pulses.
  const lifeOf = (i) => u.life.mul(random(i, 3).mul(0.5).add(0.75));

  const init = Fn(() => {
    const i = instanceIndex;
    const stagger = float(i).div(count).mul(u.life).mul(1.25);
    state.element(i).assign(vec4(0, -100, 0, stagger.negate()));
    motion.element(i).assign(vec4(0, 0, 0, 0));
  })().compute(count);

  // The column's meander: where the stream's centre has drifted to at
  // height h, low-frequency in time and height.
  const meander = (h, t) =>
    vec3(
      sin(t.mul(0.55).sub(h.mul(2.3)).add(u.phase)),
      0,
      cos(t.mul(0.43).sub(h.mul(1.9)).add(u.phase.mul(1.7)))
    ).mul(u.sway.mul(0.06).mul(smoothstep(0, u.laminar.add(0.4), h)));

  const update = Fn(() => {
    const i = instanceIndex;
    const s = state.element(i).toVar();
    const m = motion.element(i).toVar();
    const age = s.w.add(u.dt).toVar();
    const cycle = m.w.toVar();
    const key = i.add(uint(count).mul(cycle.toUint()));

    If(age.greaterThan(lifeOf(key)), () => {
      cycle.addAssign(1);
      age.assign(random(key, 9).mul(u.dt));
    });
    const born = i.add(uint(count).mul(cycle.toUint()));

    If(age.greaterThanEqual(0).and(age.lessThan(u.dt.mul(1.5))), () => {
      const angle = random(born, 0).mul(Math.PI * 2);
      const radius = random(born, 1).sqrt().mul(0.006);
      const start = vec3(cos(angle).mul(radius), 0, sin(angle).mul(radius));
      const climb = vec3(0, u.rise.mul(0.7).mul(age), 0);
      s.assign(vec4(start.add(climb).add(meander(float(0), u.time)), age));
      m.assign(vec4(0, u.rise.mul(0.7), 0, cycle));
    })
      .ElseIf(age.greaterThan(0), () => {
        const p = s.xyz;
        const height = max(p.y, 0);
        const broken = smoothstep(
          u.laminar.mul(0.5),
          u.laminar.mul(1.5),
          height
        );
        // The pattern drifts up with the smoke, but curlNoise returns 0
        // outside roughly y in [-10, 90] and x, z in [-30, 150], so the
        // drift wraps: two copies half a period apart, cross-faded so one is
        // always mid-window while the other jumps back.
        const at = p.mul(u.curlScale).add(vec3(u.offset, NOISE_Y, 0));
        const turn = u.time.mul(u.curlSpeed).div(NOISE_PERIOD);
        const sampleAt = (phase) => {
          const along = turn.add(phase).fract();
          const drift = along.mul(NOISE_PERIOD);
          return {
            fade: float(0.5).sub(
              along
                .mul(Math.PI * 2)
                .cos()
                .mul(0.5)
            ),
            value: curlNoise(at.add(vec3(0, drift.negate(), drift.mul(0.3)))),
          };
        };
        const near = sampleAt(0);
        const far = sampleAt(0.5);
        const fadeFar = float(1).sub(near.fade);
        const field = near.value
          .mul(near.fade)
          .add(far.value.mul(fadeFar))
          .div(near.fade.mul(near.fade).add(fadeFar.mul(fadeFar)).sqrt());
        const eddy = field.mul(u.curl).mul(1.4).mul(broken);
        const centre = meander(height, u.time);
        const pull = centre
          .sub(vec3(p.x, 0, p.z))
          .mul(float(1).sub(broken))
          .mul(6);
        const wander = field
          .cross(vec3(0, 1, 0))
          .mul(u.spread.mul(0.25).mul(broken));
        const rise = u.rise.mul(float(1).sub(broken.mul(0.35)));
        const target = vec3(0, rise, 0).add(eddy).add(pull).add(wander).toVar();
        target.y.assign(max(target.y, u.rise.mul(0.15)));
        const v = mix(m.xyz, target, float(1).sub(exp(u.dt.mul(-2.5))));
        m.assign(vec4(v, cycle));
        s.assign(vec4(p.add(v.mul(u.dt)), age));
      })
      .Else(() => {
        s.w.assign(age);
        m.w.assign(cycle);
      });
    state.element(i).assign(s);
    motion.element(i).assign(m);
  })().compute(count);

  const worldOf = (index) => {
    const local = state.element(index.mod(uint(count))).xyz;
    const bottom = index.greaterThanEqual(uint(count));
    return select(
      bottom,
      u.emitterBottom.add(vec3(local.x.negate(), local.y.negate(), local.z)),
      u.emitterTop.add(local)
    );
  };

  const keys = Fn(() => {
    const i = instanceIndex;
    const distance = u.eye.sub(worldOf(i)).length();
    order.element(i).assign(vec2(distance.negate(), float(i)));
  })().compute(total);

  const sort = Fn(() => {
    const i = instanceIndex;
    const partner = i.bitXor(u.sortJ);
    If(partner.greaterThan(i), () => {
      const mine = order.element(i).toVar();
      const theirs = order.element(partner).toVar();
      const ascending = i.bitAnd(u.sortK).equal(uint(0));
      const swap = select(
        ascending,
        mine.x.greaterThan(theirs.x),
        mine.x.lessThan(theirs.x)
      );
      If(swap, () => {
        order.element(i).assign(theirs);
        order.element(partner).assign(mine);
      });
    });
  })().compute(total);
  const schedule = sortSchedule(total);

  const lifeShare = (particle) => {
    const age = state.element(particle).w;
    const key = particle.add(
      uint(count).mul(motion.element(particle).w.toUint())
    );
    return { age, key, share: age.div(lifeOf(key)).clamp(0, 1) };
  };
  // A laminar stream stays a thread; particles swell only once it breaks
  // into eddies.
  const brokenAt = (particle) =>
    smoothstep(
      u.laminar.mul(0.5),
      u.laminar.mul(1.6),
      max(state.element(particle).y, 0)
    );

  let mesh;
  if (look === 'clay') {
    // Plasticine smoke: one in CLAY_STRIDE particles as a lumpy clay ball,
    // growing as it rises and shrinking away at the end of its life.
    const balls = count / CLAY_STRIDE;
    const ball = instanceIndex.mod(uint(balls));
    const particle = ball.mul(uint(CLAY_STRIDE));
    const copy = instanceIndex.div(uint(balls));
    const { age, key, share } = lifeShare(particle);
    const broken = brokenAt(particle);
    const radius = u.size
      .mul(0.065)
      .mul(mix(0.35, share.mul(1.6).add(0.8), broken))
      .mul(random(key, 7).mul(0.6).add(0.7))
      .mul(smoothstep(0, 0.06, share))
      .mul(smoothstep(1, 0.7, share))
      .mul(select(age.greaterThan(0), u.amount.sqrt(), float(0)));
    const lump = mxNoise(positionLocal.mul(2.2).add(float(key).mul(0.37)))
      .mul(0.18)
      .add(1);
    const material = createClayMaterial(u, u.color.mul(0.92), { scale: 3 });
    material.positionNode = positionLocal
      .mul(radius.mul(lump))
      .add(worldOf(copy.mul(uint(count)).add(particle)));
    mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), material);
    mesh.count = balls * 2;
    mesh.castShadow = false;
  } else {
    const material = new THREE.SpriteNodeMaterial({
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
    });
    const drawn = order.element(instanceIndex).y.toUint();
    const particle = drawn.mod(uint(count));
    const { age, key, share } = lifeShare(particle);
    const broken = brokenAt(particle);
    const position = worldOf(drawn);
    material.positionNode = position;
    const r = uv().sub(0.5).length().mul(2);
    if (look === 'cartoon') {
      // Comic puffs: a few particles as flat discs with a crescent of
      // shadow, popping in and shrinking away. Ink discs a little larger go
      // down first and the fills over them, so the ink survives only round
      // the cloud's outline, not between its puffs.
      const puff = random(key, 11).lessThan(PUFF_SHARE);
      material.scaleNode = u.size
        .mul(0.11)
        .mul(mix(0.45, share.mul(0.9).add(0.7), broken))
        .mul(random(key, 7).mul(0.6).add(0.7))
        .mul(smoothstep(0, 0.05, share))
        .mul(select(share.lessThan(PUFF_POP), float(1), float(0)));
      const lit = uv().sub(vec2(0.4, 0.62)).length().lessThan(0.5);
      material.colorNode = u.color.mul(select(lit, float(1.08), float(0.76)));
      material.opacityNode = select(
        r.lessThan(1).and(puff).and(age.greaterThan(0)),
        float(1),
        float(0)
      );
      const ink = new THREE.SpriteNodeMaterial({
        blending: THREE.NormalBlending,
        depthWrite: false,
        transparent: true,
      });
      ink.positionNode = position;
      ink.scaleNode = material.scaleNode.add(
        u.inkWidth.mul(material.scaleNode.div(0.03).clamp(0, 1))
      );
      ink.colorNode = u.ink;
      ink.opacityNode = material.opacityNode;
      const inkSprite = new THREE.Sprite(ink);
      inkSprite.count = total;
      inkSprite.frustumCulled = false;
      inkSprite.renderOrder = 0;
      const fill = new THREE.Sprite(material);
      fill.count = total;
      fill.frustumCulled = false;
      fill.renderOrder = 1;
      mesh = new THREE.Group();
      mesh.add(inkSprite, fill);
    } else {
      // A thread while laminar; once broken a particle swells into haze,
      // and its opacity falls with its area, so a lone one never reads as
      // a dot.
      const swell = mix(0.08, share.mul(2.4).add(0.7), broken);
      material.scaleNode = u.size
        .mul(0.11)
        .mul(swell)
        .mul(random(key, 7).mul(0.6).add(0.7));
      const lightAt = (flame) =>
        float(1)
          .div(position.sub(flame).length().div(0.25).pow(2).add(1))
          .mul(0.5);
      material.colorNode = u.color
        .mul(0.6)
        .add(
          u.flameColor.mul(
            lightAt(u.flameTop).add(lightAt(u.flameBottom)).mul(u.flameLight)
          )
        )
        .toVarying('smokeColor');
      const alpha = u.opacity
        .mul(select(age.greaterThan(0), u.amount, float(0)))
        .mul(smoothstep(0, 0.08, share))
        .mul(mix(0.06, 1, broken))
        .mul(float(1).div(swell.mul(swell).mul(broken).mul(3).add(1)))
        .mul(float(1).sub(share).pow(1.4))
        .toVarying('smokeAlpha');
      material.opacityNode = alpha
        .mul(exp(r.mul(r).mul(-3.2)))
        .mul(smoothstep(1, 0.85, r));
    }
    if (!mesh) {
      mesh = new THREE.Sprite(material);
      mesh.count = total;
    }
  }
  mesh.frustumCulled = false;
  if (look === 'realistic') mesh.renderOrder = 3;
  mesh.userData.plot = false;

  let ready = false;

  return {
    count,
    look,
    mesh,
    sorted: look !== 'clay',
    uniforms: u,

    // Seeds the stream. The noise and the meander take small offsets made
    // from it: simplex noise loses precision far from the origin, and a
    // seed in the thousands left the stream a straight line.
    setSeed(seed) {
      const s = Math.abs(Math.round(seed)) % 100000;
      u.seed.value = s;
      u.offset.value = ((s * 0.6180339887) % 1) * 40;
      u.phase.value = ((s * 0.7548776662) % 1) * Math.PI * 2;
    },

    reset(renderer) {
      renderer.compute(init);
      u.time.value = 0;
      ready = true;
    },

    advance(renderer, delta) {
      if (!ready) this.reset(renderer);
      if (!(delta > 0)) return;
      // A stop-motion pose can be a long step; split it so the integration
      // stays stable.
      const steps = Math.ceil(Math.min(delta, 1 / 4) / (1 / 30));
      const dt = Math.min(delta, 1 / 4) / steps;
      u.dt.value = dt;
      for (let i = 0; i < steps; i += 1) {
        u.time.value += dt;
        renderer.compute(update);
      }
    },

    // Re-keys by distance from `eye` and runs the whole network.
    sort(renderer, eye) {
      u.eye.value.copy(eye);
      renderer.compute(keys);
      schedule.forEach(([k, j]) => {
        u.sortK.value = k;
        u.sortJ.value = j;
        renderer.compute(sort);
      });
    },

    // Live particles in world space with their opacity share, for the plot.
    async read(renderer) {
      const [s, m] = await Promise.all([
        renderer.getArrayBufferAsync(state.value),
        renderer.getArrayBufferAsync(motion.value),
      ]);
      return {
        count,
        motion: new Float32Array(m),
        state: new Float32Array(s),
      };
    },

    // The puffs (cartoon) or balls (clay) drawn now, as world centres and
    // radii — the same particles, sizes and copies the GPU drew.
    async readBalls(renderer) {
      const { motion: m, state: st } = await this.read(renderer);
      const draw = (n, salt) =>
        pcg((Math.imul(n, 4) + salt + Math.imul(u.seed.value, 7919)) >>> 0);
      const top = u.emitterTop.value.toArray();
      const bottom = u.emitterBottom.value.toArray();
      const balls = [];
      const stride = look === 'clay' ? CLAY_STRIDE : 1;
      for (let particle = 0; particle < count; particle += stride) {
        const age = st[particle * 4 + 3];
        const key = (particle + Math.imul(count, m[particle * 4 + 3])) >>> 0;
        const keep = look === 'clay' || draw(key, 11) < PUFF_SHARE;
        if (age > 0 && keep) {
          const share = Math.min(
            1,
            age / (u.life.value * (draw(key, 3) * 0.5 + 0.75))
          );
          const height = Math.max(st[particle * 4 + 1], 0);
          const broken = smoothstepJs(
            u.laminar.value * 0.5,
            u.laminar.value * 1.6,
            height
          );
          const jitter = draw(key, 7) * 0.6 + 0.7;
          const r =
            look === 'clay'
              ? u.size.value *
                0.065 *
                (0.35 + (share * 1.6 + 0.45) * broken) *
                jitter *
                smoothstepJs(0, 0.06, share) *
                Math.sqrt(u.amount.value) *
                smoothstepJs(1, 0.7, share)
              : (u.size.value *
                  0.11 *
                  (0.45 + (share * 0.9 + 0.25) * broken) *
                  jitter *
                  smoothstepJs(0, 0.05, share) *
                  (share < PUFF_POP ? 1 : 0)) /
                2;
          if (r > 1e-4) {
            const x = st[particle * 4];
            const y = st[particle * 4 + 1];
            const z = st[particle * 4 + 2];
            balls.push([top[0] + x, top[1] + y, top[2] + z, r]);
            balls.push([bottom[0] - x, bottom[1] - y, bottom[2] + z, r]);
          }
        }
      }
      return balls;
    },

    dispose() {
      mesh.traverse((object) => object.material?.dispose());
      if (look === 'clay') mesh.geometry.dispose();
    },
  };
}
