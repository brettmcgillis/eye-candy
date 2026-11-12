import React, { memo, useEffect, useMemo } from 'react';

import {
  float,
  mix,
  mx_fractal_noise_float as mxFractal,
  mx_worley_noise_float as mxWorley,
  positionWorld,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const CENTRE = [-0.4, -4];

// The paper floor, scorched where the car burns: a soot stain under it,
// ragged at the edge and dragged downwind, flecked with ash.
function createGroundMaterial() {
  const u = {
    color: uniform(new THREE.Color()),
    roughness: uniform(0.95),
    scorch: uniform(1),
    scorchColor: uniform(new THREE.Color()),
    scorchSize: uniform(new THREE.Vector2(3.4, 2)),
    scorchTrail: uniform(new THREE.Vector2(-1.4, 0.3)),
  };
  const p = positionWorld.xz.sub(vec2(...CENTRE));
  const along = p
    .dot(u.scorchTrail.div(u.scorchTrail.length().max(1e-4)))
    .max(0);
  const reach = u.scorchSize.add(
    vec2(along.mul(u.scorchTrail.length()).mul(0.35), 0)
  );
  const r = p.div(reach).length();
  const ragged = mxFractal(
    vec3(positionWorld.x, 0, positionWorld.z).mul(0.9),
    4
  )
    .mul(0.35)
    .add(
      mxFractal(vec3(positionWorld.x, 3, positionWorld.z).mul(3.5), 3).mul(0.12)
    );
  const stain = smoothstep(0.35, 1.05, r.add(ragged)).oneMinus().mul(u.scorch);
  const core = smoothstep(0.1, 0.6, r.add(ragged.mul(0.5))).oneMinus();
  const ash = smoothstep(
    0,
    0.045,
    mxWorley(vec3(positionWorld.x, 0, positionWorld.z).mul(15))
  )
    .oneMinus()
    .mul(smoothstep(0.5, 1.15, r).oneMinus())
    .mul(0.3)
    .mul(u.scorch);
  const soot = stain.mul(core.mul(0.35).add(0.6)).add(ash).clamp(0, 1);

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.colorNode = mix(vec3(u.color), vec3(u.scorchColor), soot);
  material.roughnessNode = mix(u.roughness, float(1), soot);
  return { material, uniforms: u };
}

const xz = (v) => [v.x, v.y];

// A square of ground under the car to take its shadow and its scorch.
function Ground({ config }) {
  const { material, uniforms: u } = useMemo(createGroundMaterial, []);
  useEffect(() => () => material.dispose(), [material]);
  u.color.value.set(config.floorColor);
  u.roughness.value = config.floorRoughness;
  u.scorch.value = config.scorchAmount;
  u.scorchColor.value.set(config.scorchColor);
  u.scorchSize.value.set(...xz(config.scorchSize));
  u.scorchTrail.value.set(...xz(config.scorchTrail));

  return (
    <mesh
      material={material}
      position={[0, -0.01, -4]}
      receiveShadow
      rotation-x={-Math.PI / 2}
    >
      <planeGeometry args={[config.floorSize, config.floorSize]} />
    </mesh>
  );
}

export default memo(Ground);
