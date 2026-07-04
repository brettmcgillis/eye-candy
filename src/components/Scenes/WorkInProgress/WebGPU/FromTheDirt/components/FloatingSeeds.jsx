import {
  float,
  hash,
  instanceIndex,
  smoothstep,
  texture,
  time,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

// Floating seeds / dandelion fluff drifting through the sunny afternoon.
// Entirely GPU-side: every seed derives its home position, phase, and bob
// from hash(instanceIndex), rides the wind (wrapping across the meadow), and
// hovers above the real ground by sampling the shared heightfield.
function FloatingSeeds({ cloudShade, config, heightField }) {
  const uniforms = useMemo(
    () => ({
      seedSize: uniform(config.seedSize),
      sunColor: uniform(new THREE.Color(config.sunColor)),
      windDir: uniform(new THREE.Vector2(config.windDirX, config.windDirZ)),
      windSpeed: uniform(config.windSpeed),
    }),
    []
  );

  useEffect(() => {
    uniforms.seedSize.value = config.seedSize;
    uniforms.sunColor.value.set(config.sunColor);
    uniforms.windDir.value.set(config.windDirX, config.windDirZ).normalize();
    uniforms.windSpeed.value = config.windSpeed;
  }, [
    config.seedSize,
    config.sunColor,
    config.windDirX,
    config.windDirZ,
    config.windSpeed,
    uniforms,
  ]);

  const material = useMemo(() => {
    const mat = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      transparent: true,
    });

    const size = float(heightField.worldSize);
    const half = size.mul(0.5);
    const idx = float(instanceIndex);

    const homeX = hash(idx.add(1.7)).mul(size);
    const homeZ = hash(idx.add(9.3)).mul(size).sub(half);
    const phase = hash(idx.add(4.1)).mul(6.28318);
    const hover = hash(idx.add(7.7)).mul(1.1).add(0.35);

    // Drift with the wind and wrap across the meadow; a slow sine wander
    // keeps paths from being straight lines.
    const drift = time.mul(uniforms.windSpeed).mul(0.55);
    const wander = time.mul(0.3).add(phase).sin().mul(0.8);
    const x = homeX
      .add(uniforms.windDir.x.mul(drift))
      .add(wander.mul(uniforms.windDir.y))
      .mod(size)
      .sub(half);
    const z = homeZ
      .add(uniforms.windDir.y.mul(drift))
      .add(wander.mul(uniforms.windDir.x).negate())
      .add(half)
      .mod(size)
      .sub(half);

    // Hover above the actual ground (carved height from the heightfield),
    // with a gentle bob.
    const fieldUv = vec2(x.div(size).add(0.5), float(0.5).sub(z.div(size)));
    const ground = texture(heightField.texture, fieldUv).r;
    const bob = time.mul(0.9).add(phase).sin().mul(0.18);
    const y = ground.add(hover).add(bob);

    mat.positionNode = vec3(x, y, z);
    mat.scaleNode = uniforms.seedSize.mul(
      hash(idx.add(2.9)).mul(0.7).add(0.65)
    );

    // Soft glowing mote: radial falloff + a slow twinkle, warmed by the sun
    // color and dimmed under passing clouds.
    const d = uv().sub(0.5).length();
    const twinkle = time.mul(2.3).add(phase).sin().mul(0.25).add(0.75);
    mat.opacityNode = smoothstep(0.5, 0.1, d).mul(twinkle).mul(0.85);
    mat.colorNode = uniforms.sunColor
      .mul(vec3(1.05, 1.0, 0.9))
      .mul(cloudShade(vec2(x, z)).mul(0.5).add(0.5));

    return mat;
  }, [cloudShade, heightField.texture, heightField.worldSize, uniforms]);

  const mesh = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const instanced = new THREE.InstancedMesh(
      geometry,
      material,
      config.seedCount
    );
    instanced.frustumCulled = false;
    return instanced;
  }, [config.seedCount, material]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
    },
    [mesh]
  );
  useEffect(() => () => material.dispose(), [material]);

  return <primitive object={mesh} />;
}

export default memo(FloatingSeeds);
