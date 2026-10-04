/* eslint-disable camelcase, no-param-reassign */
import {
  abs,
  float,
  max,
  mix,
  mx_fractal_noise_float,
  sin,
  smoothstep,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  createPaletteLut,
  paletteColor,
  paletteCoordinate,
  writePaletteLut,
} from '@modules/apollianRender';

// The exhibit's surface, shared by the raster materials and the field march
// so an object reads the same whichever way it is drawn. Each material
// compiles its own shader with only the noise it needs: a uniform switch
// between them paid for every material's noise on every pixel.
const BASE = {
  brass: { albedo: '#c9a24a', clearcoat: 0, metal: 1, rough: 0.28 },
  bronze: { albedo: '#946238', clearcoat: 0, metal: 1, rough: 0.36 },
  ceramic: { albedo: '#f1ede5', clearcoat: 1, metal: 0, rough: 0.08 },
  marble: { albedo: '#ece8e1', clearcoat: 0.45, metal: 0, rough: 0.22 },
  painted: { albedo: '#b8b2a8', clearcoat: 0.15, metal: 0, rough: 0.5 },
  plaster: { albedo: '#e8e3d9', clearcoat: 0, metal: 0, rough: 0.88 },
  steel: { albedo: '#c8ccd2', clearcoat: 0, metal: 1, rough: 0.14 },
};

const color = (hex = '#000000') => uniform(new THREE.Color(hex));

export function createLookUniforms() {
  return {
    albedo: color(),
    clearcoat: uniform(0),
    colorWeights: uniform(new THREE.Vector3(1, 0, 0)),
    finish: uniform(0),
    metal: uniform(0),
    metalTint: color('#3d7a68'),
    paletteAmount: uniform(0),
    paletteRepeat: uniform(1),
    paletteReverse: uniform(0),
    paletteShift: uniform(0),
    paletteTexture: createPaletteLut(),
    rough: uniform(0.5),
    threadColor: color('#a8322b'),
    threadColor2: color('#1f2a44'),
    weathering: uniform(0.5),
  };
}

export function applyLook(u, config, stops) {
  const base = BASE[config.material];
  u.albedo.value.set(base.albedo);
  u.rough.value = base.rough;
  u.metal.value = base.metal;
  u.clearcoat.value = base.clearcoat;
  u.finish.value = config.finish;
  u.weathering.value = config.weathering;
  u.metalTint.value.set(config.metalTint);
  u.paletteAmount.value =
    config.material === 'painted'
      ? Math.max(config.paletteAmount, 0.85)
      : config.paletteAmount;
  u.paletteRepeat.value = config.paletteRepeat;
  u.paletteShift.value = config.paletteShift;
  u.paletteReverse.value = config.paletteReverse ? 1 : 0;
  u.colorWeights.value.set(
    config.colorStructure,
    config.colorHeight,
    config.colorRadius
  );
  u.threadColor.value.set(config.threadColor);
  u.threadColor2.value.set(config.threadColor2);
  const key = stops ? `${stops.join(',')}|${Boolean(config.paletteExact)}` : '';
  if (u.paletteKey !== key) {
    u.paletteKey = key;
    writePaletteLut(u.paletteTexture, stops, config.paletteExact);
  }
}

// The palette coordinate: structure (trap / path / surface parameter),
// height and radius in object space, by weight.
export function lookCoordinate(u, objectPoint, structure) {
  const w = u.colorWeights;
  const height = objectPoint.y.mul(0.5).add(0.5).clamp(0, 1);
  const radius = objectPoint.length().clamp(0, 1);
  const total = w.x.add(w.y).add(w.z).max(1e-6);
  const raw = structure
    .mul(w.x)
    .add(height.mul(w.y))
    .add(radius.mul(w.z))
    .div(total);
  return paletteCoordinate(raw, {
    paletteRepeat: u.paletteRepeat,
    paletteReverse: u.paletteReverse,
    paletteShift: u.paletteShift,
  });
}

// vec4(albedo, roughness) and vec2(metalness, clearcoat) at a point on the
// exhibit: `p` in object space (it carries the marble and the patina with
// the object), `n` the world normal.
export function surfaceLook(u, p, n, structure, material) {
  const base = vec3(u.albedo);
  const weather = u.weathering;
  const noiseAt = (scale, octaves) =>
    mx_fractal_noise_float(p.mul(scale), octaves, 2, 0.5).mul(0.5).add(0.5);
  let albedo = base;
  let { metal } = u;
  let { rough } = u;

  if (material === 'marble') {
    // Veins along a warped sine band.
    const warp = mx_fractal_noise_float(p.mul(1.7), 4, 2, 0.55);
    const band = abs(sin(p.x.mul(2.3).add(p.y.mul(1.1)).add(warp.mul(5))));
    const vein = float(1)
      .sub(smoothstep(0, 0.06, band))
      .mul(weather);
    albedo = mix(base, vec3(0.42, 0.44, 0.48), vein.mul(0.8)).mul(
      mix(float(0.95), float(1.02), warp.mul(0.5).add(0.5))
    );
  } else if (material === 'bronze' || material === 'brass') {
    // Green-blue patina pooled where the noise is high and on faces that
    // look down or sideways, polished where it is low.
    const noise = noiseAt(3.2, 3);
    const exposure = float(1).sub(max(n.y, 0)).mul(0.35);
    const patina = smoothstep(0.5, 0.78, noise.add(exposure))
      .mul(weather)
      .mul(material === 'brass' ? 0.6 : 1);
    albedo = mix(
      base.mul(mix(float(0.8), float(1), noise)),
      u.metalTint,
      patina
    );
    metal = u.metal.mul(float(1).sub(patina));
    rough = mix(u.rough, float(0.85), patina);
  } else if (material === 'plaster') {
    // Faint grime in the noise.
    const noise = noiseAt(3.2, 3);
    albedo = base.mul(
      float(1).sub(smoothstep(0.55, 0.9, noise).mul(weather).mul(0.25))
    );
  }

  const tint = paletteColor(lookCoordinate(u, p, structure), u);
  return {
    albedo: mix(albedo, tint, u.paletteAmount),
    clearcoat: u.clearcoat,
    metal,
    rough: rough.sub(u.finish.mul(0.5)).clamp(0.03, 1),
  };
}

// Threads: cotton or silk in the authored colour, pulled toward the palette.
export function threadLook(u, colorNode, p, structure) {
  const tint = paletteColor(lookCoordinate(u, p, structure), u);
  return mix(colorNode, tint, u.paletteAmount);
}

// Narkowicz's ACES fit, applied per material so the backdrop stays as
// authored.
export const tonemap = (c) =>
  c
    .mul(c.mul(2.51).add(0.03))
    .div(c.mul(c.mul(2.43).add(0.59)).add(0.14))
    .clamp(0, 1);

export const toneOutput = (outputNode, exposure) =>
  vec4(tonemap(outputNode.rgb.mul(exposure)), outputNode.a);
