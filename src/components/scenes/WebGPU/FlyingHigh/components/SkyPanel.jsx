import React, { memo, useEffect, useMemo } from 'react';

import {
  Fn,
  float,
  mix,
  mx_fractal_noise_float as mxFractal,
  mx_noise_float as mxNoise,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import useBakedTexture from '../hooks/useBakedTexture';

const BAKE_SIZE = [2048, 1024];

const noise = (p) => mxNoise(vec3(p, 0)).mul(0.5).add(0.5);
const fbm = (p, octaves = 5) =>
  mxFractal(vec3(p, 0), octaves, 2, 0.5).mul(0.5).add(0.5);

// A watercolour wash, as pigment colour and density: a domain-warped oval
// with soft, bled edges in some places and hard dried ones in others,
// pigment pooled dark just inside the rim and settled toward the bottom,
// uneven wet-in-wet blooms, and granulation in the paper's tooth.
function createWashMaterial(u) {
  const material = new THREE.MeshBasicNodeMaterial({
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  material.colorNode = Fn(() => {
    const p = uv();
    const d = p.sub(0.5).mul(2).length();
    const q = vec2(fbm(p.mul(3)), fbm(p.mul(3).add(vec2(5.2, 1.3))));
    const warp = fbm(p.mul(3).add(q.mul(2.5)));
    const streak = noise(vec2(p.x.mul(2.5).add(warp), p.y.mul(16)))
      .sub(0.5)
      .mul(0.08)
      .mul(u.brush);
    const rimAt = float(0.8).add(warp.sub(0.5).mul(u.warp).mul(2)).add(streak);
    const hard = smoothstep(0.42, 0.58, noise(p.mul(4).add(q)));
    const soft = mix(u.softness, u.softness.mul(0.12), hard);
    const body = float(1).sub(smoothstep(rimAt.sub(soft), rimAt, d));
    const bleed = float(1)
      .sub(smoothstep(rimAt, rimAt.add(u.softness.mul(0.8)), d))
      .mul(float(1).sub(hard))
      .mul(u.bleed);
    const inset = rimAt.sub(d);
    const pooled = smoothstep(0.09, 0, inset).mul(body).mul(u.edgeDark);
    const settled = smoothstep(0.75, 0.15, p.y).mul(u.pooling).mul(0.35);
    const blooms = mix(0.78, 1.12, fbm(p.mul(2.2).add(q.mul(1.5)), 3));
    const tooth = noise(p.mul(vec2(260, 130)))
      .sub(0.5)
      .mul(u.grain)
      .mul(10);
    const pigment = float(1)
      .add(pooled)
      .add(settled)
      .mul(blooms)
      .add(tooth)
      .max(0);
    const density = body.add(bleed).clamp(0, 1).mul(pigment).mul(u.strength);
    const colour = u.color.mul(float(1).sub(pigment.sub(1).mul(0.45)));
    return vec4(colour, density.clamp(0, 1));
  })();
  return material;
}

function SkyPanel({ sky }) {
  const u = useMemo(
    () => ({
      bleed: uniform(0),
      brush: uniform(1),
      color: uniform(new THREE.Color()),
      edgeDark: uniform(0),
      grain: uniform(0),
      pooling: uniform(0),
      softness: uniform(0.2),
      strength: uniform(1),
      warp: uniform(0.1),
    }),
    []
  );
  const wash = useMemo(() => createWashMaterial(u), [u]);
  useEffect(() => () => wash.dispose(), [wash]);

  u.bleed.value = sky.bleedAmount;
  u.brush.value = sky.brushStrength;
  u.color.value.set(sky.color);
  u.edgeDark.value = sky.edgeDarkening;
  u.grain.value = sky.grainAmount;
  u.pooling.value = sky.poolingStrength;
  u.softness.value = sky.edgeSoftness;
  u.strength.value = sky.strength;
  u.warp.value = sky.warpStrength;

  const baked = useBakedTexture(
    wash,
    BAKE_SIZE,
    [
      sky.bleedAmount,
      sky.brushStrength,
      sky.color,
      sky.edgeDarkening,
      sky.edgeSoftness,
      sky.grainAmount,
      sky.poolingStrength,
      sky.strength,
      sky.warpStrength,
    ].join()
  );
  const material = useMemo(() => {
    const sample = texture(baked, uv());
    return new THREE.MeshBasicNodeMaterial({
      colorNode: sample.rgb,
      depthWrite: false,
      opacityNode: sample.a,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    });
  }, [baked]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} position={sky.position} renderOrder={-10}>
      <planeGeometry args={[sky.width, sky.height]} />
    </mesh>
  );
}

export default memo(SkyPanel);
