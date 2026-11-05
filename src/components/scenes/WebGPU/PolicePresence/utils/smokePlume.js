/* eslint-disable no-bitwise */
import {
  Fn,
  If,
  cameraViewMatrix,
  cos,
  exp,
  float,
  hash,
  instanceIndex,
  instancedArray,
  max,
  mix,
  mx_noise_vec3 as mxNoiseVec3,
  select,
  sin,
  smoothstep,
  texture,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createPuffTexture from './puffTexture';

const PREWARM_STEP = 1 / 20;

const pow2 = (n) => 2 ** Math.round(Math.log2(Math.max(256, n)));

function sortSchedule(count) {
  const passes = [];
  for (let k = 2; k <= count; k *= 2) {
    for (let j = k / 2; j >= 1; j /= 2) passes.push([k, j]);
  }
  return passes;
}

// Soot puffs rising off the cabin, slowing and swelling as they cool,
// sheared by a wind that grows with height. Each sort pass owns its (k, j)
// uniforms so update, keys and the whole bitonic network share one compute
// submit; a uniform shared across passes would only hold its last write.
export default function createSmokePlume({ count: requested }) {
  const count = pow2(requested);
  const state = instancedArray(count, 'vec4').setName('plumeState');
  const motion = instancedArray(count, 'vec4').setName('plumeMotion');
  const order = instancedArray(count, 'vec2').setName('plumeOrder');
  const puffs = createPuffTexture();

  const u = {
    ambient: uniform(0.6),
    ashColor: uniform(new THREE.Color('#5b5e64')),
    dt: uniform(1 / 60),
    emitCentre: uniform(new THREE.Vector3()),
    emitSize: uniform(new THREE.Vector3(1, 0.3, 0.6)),
    eye: uniform(new THREE.Vector3()),
    glow: uniform(1.5),
    glowColor: uniform(new THREE.Color('#ff7a26')),
    glowHeight: uniform(1.6),
    growth: uniform(3),
    life: uniform(9),
    lightDir: uniform(new THREE.Vector3(0, 1, 0)),
    opacity: uniform(0.5),
    rise: uniform(2),
    seed: uniform(7, 'uint'),
    shear: uniform(4),
    size: uniform(1),
    slowdown: uniform(0.4),
    sootColor: uniform(new THREE.Color('#161514')),
    spread: uniform(0.5),
    sun: uniform(0.7),
    thinning: uniform(1),
    time: uniform(0),
    turbScale: uniform(0.35),
    turbulence: uniform(1),
    wind: uniform(new THREE.Vector3()),
  };

  const random = (n, salt) =>
    hash(
      n
        .mul(uint(4))
        .add(uint(salt))
        .add(u.seed.mul(uint(7919)))
    );
  const lifeOf = (key) => u.life.mul(random(key, 3).mul(0.6).add(0.7));
  const keyOf = (i, cycle) => i.add(uint(count).mul(cycle.toUint()));

  const init = Fn(() => {
    const i = instanceIndex;
    const stagger = float(i).div(count).mul(u.life).mul(1.3);
    state.element(i).assign(vec4(0, -100, 0, stagger.negate()));
    motion.element(i).assign(vec4(0));
  })()
    .compute(count)
    .setName('plumeInit');

  const turbulenceAt = (p) => {
    const drift = vec3(u.time.mul(0.11), u.time.mul(-0.32), u.time.mul(0.07));
    const coarse = mxNoiseVec3(p.mul(u.turbScale).add(drift));
    const fine = mxNoiseVec3(
      p
        .mul(u.turbScale.mul(2.3))
        .add(drift.mul(1.7))
        .add(vec3(17.1, 3.7, 9.2))
    );
    return coarse.add(fine.mul(0.5));
  };

  const update = Fn(() => {
    const i = instanceIndex;
    const s = state.element(i).toVar();
    const m = motion.element(i).toVar();
    const age = s.w.add(u.dt).toVar();
    const cycle = m.w.toVar();

    If(age.greaterThan(lifeOf(keyOf(i, cycle))), () => {
      cycle.addAssign(1);
      age.assign(random(keyOf(i, cycle), 9).mul(u.dt));
    });
    const key = keyOf(i, cycle);

    If(age.greaterThanEqual(0).and(age.lessThan(u.dt.mul(1.5))), () => {
      const angle = random(key, 0).mul(Math.PI * 2);
      const reach = random(key, 1).sqrt();
      const lift = random(key, 2).mul(2).sub(1);
      const offset = vec3(
        cos(angle).mul(reach),
        lift,
        sin(angle).mul(reach)
      ).mul(u.emitSize);
      s.assign(vec4(u.emitCentre.add(offset), age));
      m.assign(vec4(0, u.rise.mul(0.6), 0, cycle));
    })
      .ElseIf(age.greaterThan(0), () => {
        const p = s.xyz;
        const share = age.div(lifeOf(key)).clamp(0, 1);
        const height = max(p.y.sub(u.emitCentre.y), 0);
        const rise = u.rise.mul(mix(float(1), u.slowdown, share));
        const wind = u.wind.mul(smoothstep(-0.5, u.shear, height));
        const heading = random(key, 4).mul(Math.PI * 2);
        const outward = vec3(cos(heading), 0, sin(heading)).mul(
          u.spread.mul(float(1).sub(share))
        );
        const stir = turbulenceAt(p).mul(u.turbulence.mul(share.add(0.3)));
        const target = vec3(0, rise, 0).add(wind).add(outward).add(stir);
        const v = mix(m.xyz, target, float(1).sub(exp(u.dt.mul(-1.8))));
        m.assign(vec4(v, cycle));
        s.assign(vec4(p.add(v.mul(u.dt)), age));
      })
      .Else(() => {
        s.w.assign(age);
        m.w.assign(cycle);
      });
    state.element(i).assign(s);
    motion.element(i).assign(m);
  })()
    .compute(count)
    .setName('plumeUpdate');

  const keys = Fn(() => {
    const i = instanceIndex;
    const distance = u.eye.sub(state.element(i).xyz).length();
    order.element(i).assign(vec2(distance.negate(), float(i)));
  })()
    .compute(count)
    .setName('plumeKeys');

  const sortPass = (k, j) => {
    const sortK = uniform(k, 'uint');
    const sortJ = uniform(j, 'uint');
    return Fn(() => {
      const i = instanceIndex;
      const partner = i.bitXor(sortJ);
      If(partner.greaterThan(i), () => {
        const mine = order.element(i).toVar();
        const theirs = order.element(partner).toVar();
        const ascending = i.bitAnd(sortK).equal(uint(0));
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
    })()
      .compute(count)
      .setName('plumeSort');
  };
  const frame = [
    update,
    keys,
    ...sortSchedule(count).map(([k, j]) => sortPass(k, j)),
  ];

  const material = new THREE.SpriteNodeMaterial({
    blending: THREE.NormalBlending,
    depthWrite: false,
    transparent: true,
  });
  const drawn = order.element(instanceIndex).y.toUint();
  const particle = state.element(drawn);
  const drawnKey = keyOf(drawn, motion.element(drawn).w);
  const age = particle.w;
  const share = age.div(lifeOf(drawnKey)).clamp(0, 1);
  material.positionNode = particle.xyz;
  material.scaleNode = u.size
    .mul(share.pow(0.7).mul(u.growth).add(0.35))
    .mul(random(drawnKey, 7).mul(0.6).add(0.7));

  const look = vec4(
    share,
    max(particle.y.sub(u.emitCentre.y), 0),
    random(drawnKey, 11)
      .mul(Math.PI * 2)
      .add(age.mul(random(drawnKey, 12).sub(0.5).mul(0.6))),
    random(drawnKey, 13).mul(4).floor()
  ).toVarying('plumeLook');
  const alive = select(age.greaterThan(0), float(1), float(0)).toVarying(
    'plumeAlive'
  );

  const q = uv().mul(2).sub(1);
  const turn = vec2(cos(look.z), sin(look.z));
  const spun = vec2(
    q.x.mul(turn.x).sub(q.y.mul(turn.y)),
    q.x.mul(turn.y).add(q.y.mul(turn.x))
  );
  const cell = vec2(look.w.mod(2), look.w.div(2).floor()).mul(0.5);
  const mask = texture(puffs, spun.mul(0.25).add(0.25).add(cell)).r;

  const normal = vec3(q, float(1).sub(q.dot(q)).max(0).sqrt());
  const light = cameraViewMatrix.mul(vec4(u.lightDir, 0)).xyz.normalize();
  const diffuse = normal.dot(light).mul(0.6).add(0.4).clamp(0, 1);
  const tone = mix(u.sootColor, u.ashColor, smoothstep(0.05, 0.85, look.x));
  const underside = smoothstep(-0.9, 0.7, q.y).oneMinus().mul(0.7).add(0.3);
  const fireLit = u.glowColor.mul(
    u.glow.mul(exp(look.y.div(u.glowHeight).negate())).mul(underside)
  );
  material.colorNode = tone.mul(u.ambient.add(u.sun.mul(diffuse))).add(fireLit);
  material.opacityNode = u.opacity
    .mul(mask)
    .mul(alive)
    .mul(smoothstep(0, 0.1, look.x))
    .mul(float(1).sub(look.x).pow(1.3))
    .div(look.x.mul(u.thinning).add(1));

  const mesh = new THREE.Sprite(material);
  mesh.count = count;
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;

  let ready = false;

  return {
    count,
    mesh,
    uniforms: u,

    reset(renderer) {
      u.dt.value = PREWARM_STEP;
      const steps = Math.ceil((u.life.value * 1.4) / PREWARM_STEP);
      renderer.compute([init, ...Array.from({ length: steps }, () => update)]);
      u.time.value = steps * PREWARM_STEP;
      ready = true;
    },

    advance(renderer, delta, eye) {
      if (!ready) this.reset(renderer);
      u.dt.value = Math.min(Math.max(delta, 0), 1 / 15);
      u.time.value += u.dt.value;
      u.eye.value.copy(eye);
      renderer.compute(frame);
    },

    dispose() {
      material.dispose();
      puffs.dispose();
      frame.concat(init).forEach((node) => node.dispose?.());
    },
  };
}
