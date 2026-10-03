/* eslint-disable camelcase, no-param-reassign */
import {
  abs,
  attribute,
  clamp,
  float,
  floor,
  max,
  mix,
  mod,
  mx_fractal_noise_float,
  mx_noise_float,
  normalLocal,
  positionLocal,
  smoothstep,
  step,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { CUT_CODE_BASE } from './solids';
import { bumpNormal, burialHeight, castPattern, rainStreaks } from './surface';

const EFFLORESCENCE = vec3(0.9, 0.89, 0.85);
const RUST = vec3(0.42, 0.22, 0.09);

const COLORS = {
  concreteColor: '#8f8b83',
  grimeColor: '#2c2822',
  maquetteColor: '#e6e2da',
  mossColor: '#4b5a2a',
  windowColor: '#07080a',
};
const NUMBERS = {
  age: 0.7,
  boardForm: 0.6,
  boardWidth: 0.15,
  concreteVariation: 0.5,
  efflorescence: 0.25,
  moss: 0.5,
  mossClimb: 8,
  pourLift: 1.5,
  rust: 0.25,
  splash: 0.6,
  streakLength: 20,
  streaks: 0.7,
  tieHoles: 0.6,
};

export function createConcreteUniforms() {
  return {
    ...Object.fromEntries(
      Object.entries(COLORS).map(([key, hex]) => [
        key,
        uniform(new THREE.Color(hex)),
      ])
    ),
    ...Object.fromEntries(
      Object.entries(NUMBERS).map(([key, value]) => [key, uniform(value)])
    ),
    burialAmount: uniform(0),
    burialAngle: uniform(0),
    burialSpan: uniform(50),
    groundY: uniform(0),
    look: uniform(0),
    modelScale: uniform(1),
  };
}

export function applyConcrete(uniforms, config) {
  Object.keys(COLORS).forEach((key) => uniforms[key].value.set(config[key]));
  Object.keys(NUMBERS).forEach((key) => {
    uniforms[key].value = config[key];
  });
  uniforms.look.value = config.look === 'maquette' ? 1 : 0;
  uniforms.burialAmount.value = (config.burial ?? 0) * config.structureHeight;
  uniforms.burialAngle.value = ((config.burialAngle ?? 0) * Math.PI) / 180;
  uniforms.burialSpan.value = config.footprint * 0.8;
}

// Board-formed concrete that has stood in the rain for fifty years, or the
// plaster model of it. Everything is in the geometry's metres, so the model
// on the plinth weathers exactly like the full-size structure.
export function createConcreteMaterial(uniforms) {
  const weather = attribute('aWeather', 'vec4');
  const p = positionLocal;
  const n = normalLocal;
  const top = weather.x;
  const seed = weather.z;
  const code = weather.w;

  const isCut = step(CUT_CODE_BASE - 0.5, code);
  const cutIndex = max(code.sub(CUT_CODE_BASE), 0);
  const back = step(0.5, mod(cutIndex, 2)).mul(isCut);
  const cutRole = floor(cutIndex.div(2));
  const glazed = back.mul(
    step(cutRole, 0.5).add(step(abs(cutRole.sub(2)), 0.5))
  );

  const wall = smoothstep(0.85, 0.5, abs(n.y));
  const up = smoothstep(0.55, 0.95, n.y);
  const down = smoothstep(0.55, 0.95, n.y.negate());
  const tangent = vec2(n.z.negate().add(1e-5), n.x).normalize();
  const u = mix(p.x.add(p.z.mul(0.37)), vec2(p.x, p.z).dot(tangent), wall);

  const cast = castPattern({ p, seed, u, uniforms });
  const { runs, streak } = rainStreaks({ p, seed, top, u, uniforms });

  const ground = uniforms.groundY.add(burialHeight(p, uniforms));
  const above = p.y.sub(ground);
  const macro = mx_fractal_noise_float(p.mul(0.03), 3).mul(0.5).add(0.5);
  const speckle = mx_noise_float(p.mul(9));

  const tone = float(1)
    .add(cast.liftTone.mul(uniforms.concreteVariation).mul(0.14))
    .add(cast.boardTone.mul(uniforms.concreteVariation).mul(0.08))
    .sub(cast.seam.mul(0.3).mul(wall))
    .sub(cast.hole.mul(0.55).mul(wall))
    .add(speckle.mul(0.04))
    .sub(macro.mul(uniforms.age).mul(0.18));
  let albedo = uniforms.concreteColor.mul(tone);

  const splash = smoothstep(2.8, 0, above)
    .mul(uniforms.splash)
    .mul(mx_noise_float(p.mul(0.7)).mul(0.4).add(0.7));
  const dirt = clamp(
    max(streak, runs)
      .mul(wall)
      .add(down.mul(0.65).mul(uniforms.age))
      .add(up.mul(0.75).mul(uniforms.age))
      .add(splash.mul(wall))
      .add(isCut.mul(0.55).mul(uniforms.age)),
    0,
    1
  );
  albedo = mix(albedo, uniforms.grimeColor, dirt.mul(0.85));

  const bloom = smoothstep(0.9, 0, cast.belowJoint)
    .mul(smoothstep(0.1, 0.6, mx_noise_float(vec2(u.mul(0.4), p.y.mul(0.9)))))
    .mul(uniforms.efflorescence)
    .mul(wall);
  albedo = mix(albedo, EFFLORESCENCE, bloom.mul(0.55));
  albedo = mix(albedo, RUST, cast.run.mul(uniforms.rust).mul(wall).mul(0.8));

  const north = smoothstep(0, -1, n.z).mul(wall);
  const climb = smoothstep(uniforms.mossClimb, 0, above).mul(wall);
  const mossBias = up
    .add(climb.mul(0.8))
    .add(north.mul(0.25))
    .add(isCut.mul(0.2))
    .add(streak.mul(0.35));
  const mossNoise = mx_fractal_noise_float(p.mul(0.16), 4).mul(0.5).add(0.5);
  const moss = smoothstep(
    float(1.05).sub(uniforms.moss),
    float(1.25).sub(uniforms.moss),
    mossBias.mul(0.6).add(mossNoise.mul(0.7))
  ).mul(back.oneMinus());
  const mossTint = uniforms.mossColor.mul(
    mx_noise_float(p.mul(1.3)).mul(0.3).add(0.85)
  );
  albedo = mix(albedo, mossTint, moss);
  albedo = mix(albedo, uniforms.windowColor, glazed);

  const roughness = mix(
    mix(float(0.93).sub(streak.mul(0.12)), 1, moss),
    0.12,
    glazed
  );

  const plaster = mix(
    uniforms.maquetteColor.mul(speckle.mul(0.02).add(1)),
    uniforms.maquetteColor.mul(0.55),
    glazed
  );

  // Relief is metres on the geometry but the bump differentiates it against
  // view-space position, so a scaled model scales its relief too.
  const relief = cast.grain
    .mul(0.0012)
    .sub(cast.seam.mul(0.004))
    .sub(cast.hole.mul(0.01))
    .mul(wall)
    .add(speckle.mul(0.0015))
    .add(moss.mul(mossNoise).mul(0.02))
    .mul(uniforms.look.oneMinus())
    .mul(uniforms.modelScale);

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.colorNode = mix(albedo, plaster, uniforms.look);
  material.roughnessNode = mix(
    roughness,
    mix(0.85, 0.4, glazed),
    uniforms.look
  );
  material.normalNode = bumpNormal(relief);
  return material;
}
