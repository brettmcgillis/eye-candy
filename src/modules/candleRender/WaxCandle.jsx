import React, { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  attribute,
  color,
  float,
  mix,
  mx_noise_float as mxNoise,
  positionLocal,
  saturation,
  smoothstep,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildWax } from '@modules/candle';

import {
  createClayMaterial,
  createOutlineMaterial,
  createToonWaxMaterial,
} from './styleMaterials';

const GLOW_COLOR = new THREE.Color('#ff8a3a');
const EMBER_COLOR = new THREE.Color('#ff5a1a');

function waxGeometry(form) {
  const wax = buildWax(form);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(wax.position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(wax.normal, 3));
  geometry.setAttribute('glow', new THREE.BufferAttribute(wax.glow, 1));
  geometry.setAttribute('pool', new THREE.BufferAttribute(wax.pool, 1));
  geometry.setIndex(new THREE.BufferAttribute(wax.index, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

// Wax lit from inside: the baked `glow` (flame light that would pass
// through thin wax) burns warm with the flame, the crater's pool goes glossy
// while it is molten, and a faint marbling breaks up the flat colour.
function createWaxMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  const glow = attribute('glow', 'float');
  const pool = attribute('pool', 'float');
  const marble = mxNoise(positionLocal.mul(vec3(9, 2.2, 9)))
    .mul(0.5)
    .add(0.5);
  material.colorNode = mix(
    u.wax.mul(marble.mul(0.12).add(0.92)),
    u.wax.mul(vec3(0.95, 0.86, 0.72)),
    pool.mul(0.5)
  );
  material.roughnessNode = mix(u.roughness, float(0.06), pool.mul(u.melt));
  material.emissiveNode = color(GLOW_COLOR)
    .mul(u.wax.add(0.35))
    .mul(glow.mul(u.translucency).mul(u.light).mul(1.1))
    .add(u.wax.mul(u.light).mul(0.035));
  return material;
}

// The wick as a tube: charred black, its last stretch glowing as an ember.
function wickGeometry(wick) {
  const curve = new THREE.CatmullRomCurve3(
    wick.points.map((p) => new THREE.Vector3(...p))
  );
  return new THREE.TubeGeometry(curve, 24, wick.thickness, 7, false);
}

function createWickMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial({
    color: '#120d0a',
    roughness: 1,
  });
  const along = uv().x;
  const fray = mxNoise(positionLocal.mul(180)).mul(0.5).add(0.5);
  material.emissiveNode = color(EMBER_COLOR).mul(
    smoothstep(0.55, 1, along)
      .pow(2)
      .mul(u.ember)
      .mul(fray.mul(0.6).add(0.6))
      .mul(5)
  );
  return material;
}

function createMushroomMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial({
    color: '#0b0908',
    roughness: 1,
  });
  const speckle = smoothstep(
    0.55,
    0.8,
    mxNoise(positionLocal.mul(260)).mul(0.5).add(0.5)
  );
  material.emissiveNode = color(EMBER_COLOR).mul(speckle.mul(u.ember).mul(3));
  return material;
}

function End({ form, materials, mirrored, wickGeom }) {
  const { mushroom, tip } = form.wick;
  return (
    <group rotation={mirrored ? [0, 0, Math.PI] : [0, 0, 0]}>
      <mesh geometry={wickGeom} material={materials.wick} />
      {mushroom > 0 ? (
        <mesh material={materials.mushroom} position={tip} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[mushroom, 12, 8]} />
        </mesh>
      ) : null}
    </group>
  );
}

// The candle in candle space under its tilt: one wax mesh (both ends, the
// bottom the top turned half a turn) and a wick at each end. `drive`
// carries the flame's light and the ember glow each frame.
export default function WaxCandle({
  config,
  drive,
  form,
  placement,
  solidsRef,
}) {
  const u = useMemo(
    () => ({
      bands: uniform(3),
      ember: uniform(1),
      flameBottom: uniform(new THREE.Vector3()),
      flameTop: uniform(new THREE.Vector3()),
      ink: uniform(new THREE.Color('#1a1013')),
      light: uniform(1),
      outline: uniform(0.018),
      prints: uniform(0.5),
      radius: uniform(0.4),
      melt: uniform(1),
      roughness: uniform(0.45),
      translucency: uniform(0.8),
      wax: uniform(new THREE.Color('#f4ecdc')),
    }),
    []
  );
  const { look } = config;
  const materials = useMemo(() => {
    if (look === 'cartoon') {
      const ink = new THREE.MeshBasicNodeMaterial();
      ink.colorNode = u.ink;
      return {
        mushroom: ink,
        outline: createOutlineMaterial(u),
        wax: createToonWaxMaterial(u),
        wick: ink,
      };
    }
    if (look === 'clay') {
      return {
        mushroom: createClayMaterial(u, u.ink, { scale: 3 }),
        wax: createClayMaterial(u, saturation(u.wax, float(1.1))),
        wick: createClayMaterial(u, u.ink, { scale: 3 }),
      };
    }
    return {
      mushroom: createMushroomMaterial(u),
      wax: createWaxMaterial(u),
      wick: createWickMaterial(u),
    };
  }, [look, u]);
  const geometry = useMemo(() => waxGeometry(form), [form]);
  const wickGeom = useMemo(() => wickGeometry(form.wick), [form]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => wickGeom.dispose(), [wickGeom]);
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials]
  );

  u.wax.value.set(
    config.look === 'realistic' ? config.waxColor : config.styleWax
  );
  u.roughness.value = config.waxRoughness;
  u.translucency.value = config.waxTranslucency;
  u.bands.value = config.toonBands;
  u.outline.value = config.toonOutline;
  u.ink.value.set(config.toonInk);
  u.prints.value = config.clayPrints;
  u.radius.value = form.radius;
  u.flameTop.value.set(...placement.top.flameCentre);
  u.flameBottom.value.set(...placement.bottom.flameCentre);

  useFrame(() => {
    const flame = drive.lit * drive.signal.light;
    u.light.value = flame * (config.flameIntensity ?? 1);
    u.ember.value = Math.max(drive.ember, drive.lit);
    u.melt.value = drive.lit;
  }, -1);

  return (
    <group
      ref={solidsRef}
      rotation={[0, 0, ((config.tilt ?? 0) * Math.PI) / 180]}
      userData={{ plotObject: 'candle' }}
    >
      <mesh
        castShadow
        geometry={geometry}
        material={materials.wax}
        receiveShadow
        userData={{ wax: true }}
      />
      {materials.outline ? (
        <mesh
          geometry={geometry}
          material={materials.outline}
          userData={{ plot: false }}
        />
      ) : null}
      <End form={form} materials={materials} wickGeom={wickGeom} />
      <End form={form} materials={materials} mirrored wickGeom={wickGeom} />
    </group>
  );
}
