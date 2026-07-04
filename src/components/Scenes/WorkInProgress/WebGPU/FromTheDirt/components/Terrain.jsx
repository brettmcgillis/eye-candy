/* eslint-disable camelcase */
import {
  float,
  mix,
  mx_noise_float,
  positionGeometry,
  positionWorld,
  smoothstep,
  texture,
  transformNormalToView,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

const SEGMENTS = 320;

// Heightfield-displaced ground plane. The letters are "subtracted" by the
// carve baked into the heightfield; walls and pit floors are shaded as
// topsoil over horizontal sediment strata (absolute world-Y bands, like real
// geology), while the untouched top surface stays meadow green.
function Terrain({ cloudShade, config, heightField }) {
  const uniforms = useMemo(
    () => ({
      grassColorA: uniform(new THREE.Color(config.grassColorA)),
      grassColorB: uniform(new THREE.Color(config.grassColorB)),
      strataDark: uniform(new THREE.Color(config.strataDark)),
      strataLight: uniform(new THREE.Color(config.strataLight)),
      strataScale: uniform(config.strataScale),
      topsoilColor: uniform(new THREE.Color(config.topsoilColor)),
      topsoilDepth: uniform(config.topsoilDepth),
      waterLine: uniform(config.waterLevel),
    }),
    []
  );

  useEffect(() => {
    uniforms.grassColorA.value.set(config.grassColorA);
    uniforms.grassColorB.value.set(config.grassColorB);
    uniforms.strataDark.value.set(config.strataDark);
    uniforms.strataLight.value.set(config.strataLight);
    uniforms.topsoilColor.value.set(config.topsoilColor);
    uniforms.strataScale.value = config.strataScale;
    uniforms.topsoilDepth.value = config.topsoilDepth;
    uniforms.waterLine.value = config.waterLevel;
  }, [
    config.grassColorA,
    config.grassColorB,
    config.strataDark,
    config.strataLight,
    config.strataScale,
    config.topsoilColor,
    config.topsoilDepth,
    config.waterLevel,
    uniforms,
  ]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 0.95,
    });

    const field = texture(heightField.texture, uv());

    // Plane local z becomes world y after the -90° x rotation.
    mat.positionNode = positionGeometry.add(vec3(0, 0, field.r));

    // Per-pixel normal from heightfield finite differences (local space).
    const texel = 1 / heightField.resolution;
    const worldStep = (2 * heightField.worldSize) / heightField.resolution;
    const hL = texture(heightField.texture, uv().sub(vec2(texel, 0))).r;
    const hR = texture(heightField.texture, uv().add(vec2(texel, 0))).r;
    const hD = texture(heightField.texture, uv().sub(vec2(0, texel))).r;
    const hU = texture(heightField.texture, uv().add(vec2(0, texel))).r;
    mat.normalNode = transformNormalToView(
      vec3(hL.sub(hR), hD.sub(hU), float(worldStep)).normalize()
    );

    const carve = field.g;
    const hill = field.b;
    const worldY = positionWorld.y;
    const depthBelow = hill.sub(worldY).max(0);

    // Meadow top: two greens blended by broad noise.
    const meadowNoise = mx_noise_float(
      vec3(positionWorld.x.mul(0.4), 0, positionWorld.z.mul(0.4))
    )
      .mul(0.5)
      .add(0.5);
    const meadow = mix(uniforms.grassColorA, uniforms.grassColorB, meadowNoise);

    // Sediment strata: horizontal bands in absolute world Y with a noisy
    // wobble, darker seams between bands, per-band tint variation.
    const wobble = mx_noise_float(positionWorld.mul(vec3(0.5, 1.5, 0.5))).mul(
      0.3
    );
    const band = worldY.mul(uniforms.strataScale).add(wobble);
    const bandIndex = band.floor();
    const bandHash = bandIndex.mul(12.9898).sin().mul(43758.547).fract();
    const bandPos = band.fract();
    const seam = smoothstep(0.0, 0.12, bandPos)
      .mul(smoothstep(1.0, 0.88, bandPos))
      .mul(0.25)
      .add(0.75);
    const strata = mix(uniforms.strataLight, uniforms.strataDark, bandHash).mul(
      seam
    );

    // Topsoil hugs the surface; strata take over with depth.
    const topsoilBlend = smoothstep(
      uniforms.topsoilDepth,
      uniforms.topsoilDepth.mul(0.4),
      depthBelow
    );
    const soil = mix(strata, uniforms.topsoilColor, topsoilBlend);

    // Anything below the original surface (walls, pit floor) shows soil.
    const wallBlend = smoothstep(0.03, 0.25, depthBelow).max(
      smoothstep(0.85, 1.0, carve)
    );
    const grain = mx_noise_float(positionWorld.mul(18)).mul(0.08).add(0.96);
    const damp = smoothstep(
      uniforms.waterLine.add(0.35),
      uniforms.waterLine.sub(0.1),
      worldY
    );

    const base = mix(meadow, soil, wallBlend)
      .mul(float(1).sub(damp.mul(0.45)))
      .mul(grain);

    mat.colorNode = base.mul(cloudShade(positionWorld.xz));

    return mat;
  }, [
    cloudShade,
    heightField.resolution,
    heightField.texture,
    heightField.worldSize,
    uniforms,
  ]);

  const geometry = useMemo(
    () =>
      new THREE.PlaneGeometry(
        heightField.worldSize,
        heightField.worldSize,
        SEGMENTS,
        SEGMENTS
      ),
    [heightField.worldSize]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      castShadow={config.terrainCastShadow}
      geometry={geometry}
      material={material}
      receiveShadow
      rotation-x={-Math.PI / 2}
    />
  );
}

export default memo(Terrain);
