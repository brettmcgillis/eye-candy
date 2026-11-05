import React, { memo, useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { snoise } from 'three/addons/tsl/math/curlNoise.js';
import {
  Fn,
  cameraPosition,
  float,
  hash,
  instanceIndex,
  instancedArray,
  mix,
  mod,
  positionGeometry,
  uint,
  uniform,
  varyingProperty,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createBladeGeometry from '../utils/grassGeometry';
import { herdPush, herdShadow } from '../utils/herdField';
import {
  blendToOne,
  fieldHeight,
  fieldNormal,
  fieldWind,
  terrainUv,
} from '../utils/noiseField';

const TWO_PI = Math.PI * 2;
const ROOT_SINK = 0.05;
const MAX_LEAN = 0.95;
const FIELD_GRID = 96;
const SUN = vec3(1).normalize();

const COLORS = ['dryColor', 'rootColor', 'tipColor'];

const uniformValues = (config) => ({
  ao: config.grassAo,
  bend: config.grassBend,
  bladeHeight: config.grassBladeHeight,
  bladeWidth: config.grassBladeWidth,
  dryAmount: config.grassDryAmount,
  dryColor: config.grassDryColor,
  edgeFade: config.grassEdgeFade,
  facing: config.grassFacing,
  farWiden: config.grassFarWiden,
  flutter: config.grassFlutter,
  heightJitter: config.grassHeightJitter,
  lightWrap: config.grassLightWrap,
  maxHeight: config.terrainMaxHeight,
  noiseScale: config.terrainNoiseScale,
  patchContrast: config.grassPatchContrast,
  patchHeight: config.grassPatchHeight,
  patchScale: config.grassPatchScale,
  range: config.terrainExtent * 0.4,
  rootColor: config.grassRootColor,
  seed: config.terrainSeed,
  sheen: config.grassSheen,
  tipColor: config.grassTipColor,
  variation: config.grassVariation,
  windStrength: config.grassWindStrength,
});

function createUniforms(config) {
  const values = Object.entries(uniformValues(config)).map(([key, value]) => [
    key,
    uniform(COLORS.includes(key) ? new THREE.Color(value) : value),
  ]);

  return { ...Object.fromEntries(values), clock: uniform(0) };
}

function syncUniforms(uniforms, config) {
  Object.entries(uniformValues(config)).forEach(([key, value]) => {
    const target = uniforms[key];
    if (COLORS.includes(key)) target.value.set(value);
    else target.value = value;
  });
}

function sampleGrid(grid, uv) {
  const p = uv.clamp(0, 1).mul(FIELD_GRID - 1);
  const lo = p.floor().min(FIELD_GRID - 2);
  const f = p.sub(lo);
  const at = (dx, dy) =>
    grid.element(uint(lo.y.add(dy).mul(FIELD_GRID).add(lo.x.add(dx))));

  return mix(mix(at(0, 0), at(1, 0), f.x), mix(at(0, 1), at(1, 1), f.x), f.y);
}

// The field noise is smooth, so it is sampled once per grid node; per blade
// it was 1.4M simplex evaluations a frame.
function buildField({ count, dayNight, herd, scrollUniform, seed, travel, u }) {
  const side = Math.ceil(Math.sqrt(count));
  const grid = instancedArray(FIELD_GRID * FIELD_GRID, 'vec4');
  const roots = instancedArray(count, 'vec4');
  const motion = instancedArray(count, 'vec4');
  const tone = instancedArray(count, 'vec4');
  const salt = (k) => instanceIndex.add(uint(seed * 7919 + k));

  const gridKernel = Fn(() => {
    const uv = vec2(
      float(instanceIndex.mod(uint(FIELD_GRID))),
      float(instanceIndex.div(uint(FIELD_GRID)))
    ).div(FIELD_GRID - 1);
    const normal = fieldNormal(uv, u.noiseScale, travel, u.seed);
    const lit = blendToOne(
      normal.dot(vec3(1.0).normalize()).max(0.0),
      u.lightWrap
    ).mul(dayNight.lightIntensity);
    const wind = fieldWind(uv, u.noiseScale, travel);
    const patch = snoise(
      vec3(
        uv.x.mul(u.noiseScale).mul(u.patchScale),
        uv.y.mul(u.noiseScale).add(travel).mul(u.patchScale),
        u.seed.add(17)
      )
    );
    grid.element(instanceIndex).assign(vec4(lit, wind, patch));
  })().compute(FIELD_GRID * FIELD_GRID);

  const kernel = Fn(() => {
    const { range } = u;
    const cell = range.mul(2).div(side);
    const col = float(instanceIndex.mod(uint(side)));
    const row = float(instanceIndex.div(uint(side)));

    const x = col
      .add(hash(salt(11)))
      .mul(cell)
      .sub(range);
    const z = mod(
      row
        .add(hash(salt(23)))
        .mul(cell)
        .add(scrollUniform),
      range.mul(2)
    ).sub(range);
    const flat = vec3(x, 0, z);
    const uv = terrainUv(flat, range);

    const ground = fieldHeight(uv, u.noiseScale, travel, u.seed)
      .mul(u.maxHeight)
      .sub(ROOT_SINK);
    const field = sampleGrid(grid, uv);
    const lit = field.x;
    const wind = field.yz;
    const patch = field.w;

    const edge = x
      .abs()
      .smoothstep(range, range.sub(u.edgeFade))
      .mul(z.abs().smoothstep(range, range.sub(u.edgeFade)));
    const height = u.bladeHeight
      .mul(hash(salt(37)).sub(0.5).mul(2).mul(u.heightJitter).add(1))
      .mul(patch.mul(u.patchHeight).add(1))
      .mul(edge);

    const root = vec3(x, ground, z);
    const push = herdPush(root, float(1), herd);
    const phase = hash(salt(41)).mul(TWO_PI);
    const flutter = vec2(
      u.clock.mul(3.1).add(phase).sin(),
      u.clock.mul(2.3).add(phase.mul(1.7)).cos()
    ).mul(u.flutter.mul(0.15));
    const lean = wind.mul(u.windStrength).add(flutter).mul(height).add(push.xz);

    roots.element(instanceIndex).assign(vec4(root, height));
    motion.element(instanceIndex).assign(vec4(lean, push.y.negate(), lit));
    tone
      .element(instanceIndex)
      .assign(
        vec4(
          patch,
          wind.length().clamp(0, 1),
          herdShadow(root, herd),
          hash(salt(53))
        )
      );
  })().compute(count);

  const shaded = varyingProperty('vec3', 'vGrassColor');

  const blade = Fn(() => {
    const r = roots.element(instanceIndex);
    const m = motion.element(instanceIndex);
    const tn = tone.element(instanceIndex);
    const height = r.w.max(1e-4);
    const rnd = tn.w;
    const t = positionGeometry.y;

    const yaw = hash(salt(31)).mul(TWO_PI);
    const facing = vec2(yaw.cos(), yaw.sin());
    const across = vec3(facing.y.negate(), 0, facing.x);

    // Lean is a fraction of blade length so pressed blades lie down, not stretch.
    const leanLength = m.xy.length();
    const leanDir = m.xy.div(leanLength.max(1e-4));
    const curl = u.bend.mul(rnd.add(0.5));
    const tilt = leanLength.div(height).add(m.z).add(curl.mul(0.4));
    const lie = tilt.clamp(0, MAX_LEAN);
    const reach = leanDir
      .mul(leanLength.div(height).add(m.z))
      .add(facing.mul(curl.mul(0.4)));
    const reachDir = reach.div(reach.length().max(1e-4));
    const tipXZ = reachDir.mul(lie).mul(height);
    const tipY = float(1).sub(lie.mul(lie)).sqrt().mul(height);

    const ctrl = vec3(tipXZ.x.mul(0.25), tipY.mul(0.8), tipXZ.y.mul(0.25));
    const tip = vec3(tipXZ.x, tipY, tipXZ.y);
    const spine = ctrl
      .mul(float(1).sub(t).mul(t).mul(2))
      .add(tip.mul(t.mul(t)));
    const tangent = ctrl.mul(float(2).sub(t.mul(4))).add(tip.mul(t.mul(2)));
    const normal = across.cross(tangent).normalize();

    // Sub-pixel distant blades let the ground show through.
    const distance = r.xz.sub(cameraPosition.xz).length();
    const widen = distance.div(u.farWiden).max(1);
    const width = u.bladeWidth.mul(rnd.mul(0.6).add(0.7)).mul(widen);

    const patch = tn.x.mul(0.5).add(0.5);
    const tipColor = mix(
      u.tipColor,
      u.dryColor,
      patch.smoothstep(0.35, 0.95).mul(u.dryAmount)
    );
    const gradient = mix(u.rootColor, tipColor, t.smoothstep(0, 1));
    const hue = mix(
      vec3(1),
      mix(vec3(1.1, 1.03, 0.75), vec3(0.8, 0.97, 1.05), hash(salt(61))),
      u.variation
    );
    const shade = mix(
      float(1).sub(u.patchContrast),
      float(1).add(u.patchContrast),
      patch
    ).mul(rnd.sub(0.5).mul(u.variation).add(1));
    const face = mix(
      float(1).sub(u.facing),
      float(1).add(u.facing.mul(0.4)),
      normal.dot(SUN).abs()
    );
    const ao = mix(u.ao, float(1), t);
    const sheen = tipColor.mul(tn.y.mul(t).mul(u.sheen));

    shaded.assign(
      gradient
        .mul(hue)
        .mul(shade)
        .mul(face)
        .mul(ao)
        .add(sheen)
        .mul(m.w)
        .sub(tn.z)
    );

    return r.xyz.add(spine).add(across.mul(positionGeometry.x.mul(width)));
  });

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  material.positionNode = blade();
  material.colorNode = shaded;

  return { gridKernel, kernel, material };
}

function Grass({ config, dayNight, herd, scrollUniform, travelUniform }) {
  const { grassCount, grassSeed } = config;
  const gl = useThree((state) => state.gl);

  const u = useMemo(() => createUniforms(config), []);
  syncUniforms(u, config);

  const geometry = useMemo(() => createBladeGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const count = Math.round(grassCount);
  const { gridKernel, kernel, material } = useMemo(
    () =>
      buildField({
        count,
        dayNight,
        herd,
        scrollUniform,
        seed: grassSeed,
        travel: travelUniform,
        u,
      }),
    [count, dayNight, grassSeed, herd, scrollUniform, travelUniform, u]
  );
  useEffect(() => () => material.dispose(), [material]);

  geometry.instanceCount = count;

  useFrame((state) => {
    u.clock.value = state.clock.elapsedTime;
    gl.compute(gridKernel);
    gl.compute(kernel);
  });

  return (
    <mesh
      key={`${count}-${grassSeed}`}
      frustumCulled={false}
      geometry={geometry}
      material={material}
    />
  );
}

export default memo(Grass);
