import {
  Fn,
  If,
  atan,
  exp,
  float,
  hash,
  instanceIndex,
  instancedArray,
  mix,
  modelViewMatrix,
  mx_noise_vec3 as mxNoiseVec3,
  select,
  smoothstep,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Sparks thrown off a fire: born at a random vent (`at`, bursting along
// `out`), pushed up by the heat, carried off by the wind and stirred by
// turbulence, cooling from
// white-hot through orange to a dull red before they go out. Each is drawn
// as a short streak along its motion on screen. They write depth so the
// smoke composite keeps the ones in front of the smoke crisp.
export default function createEmbers({ count, vents }) {
  const state = instancedArray(count, 'vec4').setName('emberState');
  const motion = instancedArray(count, 'vec4').setName('emberMotion');
  const u = {
    buoyancy: uniform(3),
    dt: uniform(1 / 60),
    glow: uniform(6),
    life: uniform(2.5),
    seed: uniform(11, 'uint'),
    size: uniform(0.025),
    speed: uniform(2.5),
    streak: uniform(0.06),
    time: uniform(0),
    turbulence: uniform(2),
    wind: uniform(new THREE.Vector3(-1.5, 0, 0.4)),
  };
  const random = (n, salt) =>
    hash(
      n
        .mul(uint(8))
        .add(uint(salt))
        .add(u.seed.mul(uint(7919)))
    );
  const keyOf = (i, cycle) => i.add(uint(count).mul(cycle.toUint()));
  const lifeOf = (key) => u.life.mul(random(key, 3).mul(0.8).add(0.5));

  // The vent a key spawns at, picked from the lit ones baked in.
  const ventOf = (key) => {
    const pick = random(key, 5).mul(vents.length).floor();
    let at = vec3(...vents[0].at);
    let out = vec3(...vents[0].out);
    vents.forEach((vent, v) => {
      if (v === 0) return;
      const here = pick.equal(float(v));
      at = select(here, vec3(...vent.at), at);
      out = select(here, vec3(...vent.out), out);
    });
    return { at, out };
  };

  const init = Fn(() => {
    const i = instanceIndex;
    const stagger = float(i).div(count).mul(u.life).mul(1.5);
    state.element(i).assign(vec4(0, -100, 0, stagger.negate()));
    motion.element(i).assign(vec4(0));
  })()
    .compute(count)
    .setName('emberInit');

  const update = Fn(() => {
    const i = instanceIndex;
    const s = state.element(i).toVar();
    const m = motion.element(i).toVar();
    const age = s.w.add(u.dt).toVar();
    const cycle = m.w.toVar();
    If(age.greaterThan(lifeOf(keyOf(i, cycle))), () => {
      cycle.addAssign(1);
      age.assign(random(keyOf(i, cycle), 9).mul(u.dt).negate());
    });
    const key = keyOf(i, cycle);
    If(age.greaterThanEqual(0).and(age.lessThan(u.dt.mul(1.5))), () => {
      const { at, out } = ventOf(key);
      const jitter = vec3(
        random(key, 0).sub(0.5),
        random(key, 1).sub(0.5),
        random(key, 2).sub(0.5)
      );
      const v0 = out
        .normalize()
        .mul(u.speed.mul(random(key, 4).mul(0.8).add(0.4)))
        .add(jitter.mul(u.speed));
      s.assign(vec4(at.add(jitter.mul(0.35)), age));
      m.assign(vec4(v0, cycle));
    })
      .ElseIf(age.greaterThan(0), () => {
        const p = s.xyz;
        const drift = vec3(u.time.mul(0.3), u.time.mul(-0.9), u.time.mul(0.2));
        const stir = mxNoiseVec3(
          p.mul(1.4).add(drift).add(random(key, 6).mul(9))
        );
        const lift = vec3(0, u.buoyancy.mul(exp(age.mul(-0.6))), 0);
        const target = u.wind.add(stir.mul(u.turbulence)).add(lift);
        const v = mix(m.xyz, target, float(1).sub(exp(u.dt.mul(-1.6))));
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
    .setName('emberUpdate');

  const material = new THREE.SpriteNodeMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: true,
    toneMapped: false,
    transparent: true,
  });
  material.alphaTest = 0.4;
  const particle = state.element(instanceIndex);
  const m = motion.element(instanceIndex);
  const key = keyOf(instanceIndex, m.w);
  const share = particle.w.div(lifeOf(key)).clamp(0, 1);
  const velocityView = modelViewMatrix.mul(vec4(m.xyz, 0)).xyz;
  const speed = velocityView.xy.length();
  const size = u.size.mul(random(key, 7).mul(0.9).add(0.4));
  material.positionNode = particle.xyz;
  material.scaleNode = vec2(size, size.add(speed.mul(u.streak)));
  material.rotationNode = atan(velocityView.y, velocityView.x).sub(Math.PI / 2);

  const heat = float(1).sub(share).pow(1.4).toVarying('emberHeat');
  const alive = select(particle.w.greaterThan(0), float(1), float(0)).toVarying(
    'emberAlive'
  );
  const twinkle = random(key, 8)
    .mul(40)
    .add(u.time.mul(random(key, 10).mul(14).add(6)))
    .sin()
    .mul(0.35)
    .add(0.75)
    .toVarying('emberTwinkle');
  const q = uv().mul(2).sub(1);
  const disc = smoothstep(0.2, 1, q.dot(q)).oneMinus();
  const ramp = mix(
    mix(vec3(0.5, 0.05, 0.01), vec3(1, 0.35, 0.05), smoothstep(0, 0.45, heat)),
    vec3(1, 0.85, 0.55),
    smoothstep(0.55, 1, heat)
  );
  material.colorNode = ramp.mul(u.glow).mul(heat.add(0.15)).mul(twinkle);
  material.opacityNode = disc.mul(alive).mul(smoothstep(0, 0.08, heat));

  const mesh = new THREE.Sprite(material);
  mesh.count = count;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  let ready = false;
  return {
    mesh,
    uniforms: u,
    advance(renderer, delta) {
      if (!ready) {
        renderer.compute(init);
        ready = true;
      }
      u.dt.value = Math.min(Math.max(delta, 0), 1 / 15);
      u.time.value += u.dt.value;
      renderer.compute(update);
    },
    dispose() {
      material.dispose();
      init.dispose?.();
      update.dispose?.();
    },
  };
}
