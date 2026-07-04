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
const WALL_SEGMENTS = 192;

function buildFrontBackWallGeometry({
  half,
  sampleHeight,
  segments,
  wallBottom,
  z,
}) {
  const positions = [];

  for (let i = 0; i < segments; i += 1) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const x0 = -half + t0 * half * 2;
    const x1 = -half + t1 * half * 2;
    const y0 = sampleHeight(x0, z);
    const y1 = sampleHeight(x1, z);

    positions.push(
      x0,
      y0,
      z,
      x1,
      y1,
      z,
      x1,
      wallBottom,
      z,
      x0,
      y0,
      z,
      x1,
      wallBottom,
      z,
      x0,
      wallBottom,
      z
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.computeVertexNormals();
  return geometry;
}

function buildLeftRightWallGeometry({
  half,
  sampleHeight,
  segments,
  wallBottom,
  x,
}) {
  const positions = [];

  for (let i = 0; i < segments; i += 1) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const z0 = -half + t0 * half * 2;
    const z1 = -half + t1 * half * 2;
    const y0 = sampleHeight(x, z0);
    const y1 = sampleHeight(x, z1);

    positions.push(
      x,
      y0,
      z0,
      x,
      y1,
      z1,
      x,
      wallBottom,
      z1,
      x,
      y0,
      z0,
      x,
      wallBottom,
      z1,
      x,
      wallBottom,
      z0
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.computeVertexNormals();
  return geometry;
}

function getStrataBandPhase({
  depthReference,
  hillReference,
  worldPos,
  uniforms,
}) {
  const wobble = mx_noise_float(
    vec3(worldPos.x.mul(0.5), 0, worldPos.z.mul(0.5))
  ).mul(uniforms.strataWarpStrength.mul(0.3));
  const curveWarp = hillReference
    .mul(uniforms.strataWarpStrength.mul(0.45))
    .add(
      mx_noise_float(worldPos.mul(vec3(0.18, 0, 0.18))).mul(
        uniforms.strataWarpStrength.mul(0.22)
      )
    );

  const band = depthReference
    .mul(uniforms.strataScale)
    .add(wobble)
    .add(curveWarp);
  const bandIndex = band.floor();
  const bandHash = bandIndex.mul(12.9898).sin().mul(43758.547).fract();
  const bandPos = band.fract();
  const seam = smoothstep(0.0, 0.12, bandPos)
    .mul(smoothstep(1.0, 0.88, bandPos))
    .mul(0.25)
    .add(0.75);

  return { bandHash, bandIndex, seam };
}

function getStrataColor({ bandHash, bandIndex, seam, worldPos, uniforms }) {
  const strataMidWarm = mix(uniforms.strataDark, uniforms.strataLight, 0.35);
  const strataMidCool = mix(uniforms.strataDark, uniforms.strataLight, 0.7).mul(
    vec3(0.95, 0.98, 1.02)
  );

  const tone0 = mix(
    uniforms.strataDark,
    strataMidWarm,
    smoothstep(0, 0.33, bandHash)
  );
  const tone1 = mix(tone0, strataMidCool, smoothstep(0.33, 0.66, bandHash));
  const tone2 = mix(tone1, uniforms.strataLight, smoothstep(0.66, 1, bandHash));

  const pebbleField = mx_noise_float(
    worldPos.mul(vec3(22, 26, 22)).add(vec3(0, bandIndex.mul(0.23), 0))
  );
  const pebbleDark = smoothstep(0.78, 0.96, pebbleField).mul(
    uniforms.strataPebbleStrength.mul(0.2)
  );
  const pebbleBright = smoothstep(0.985, 1.0, pebbleField).mul(
    uniforms.strataPebbleStrength.mul(0.08)
  );
  const microGrain = mx_noise_float(worldPos.mul(vec3(48, 64, 48)))
    .sub(0.5)
    .mul(uniforms.strataPebbleStrength.mul(0.09));

  return tone2
    .mul(float(1).sub(pebbleDark))
    .add(vec3(pebbleBright, pebbleBright, pebbleBright))
    .add(vec3(microGrain, microGrain, microGrain))
    .mul(seam);
}

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
      strataPebbleStrength: uniform(config.strataPebbleStrength ?? 1),
      strataScale: uniform(config.strataScale),
      strataWarpStrength: uniform(config.strataWarpStrength ?? 1),
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
    uniforms.strataPebbleStrength.value = config.strataPebbleStrength ?? 1;
    uniforms.topsoilColor.value.set(config.topsoilColor);
    uniforms.strataScale.value = config.strataScale;
    uniforms.strataWarpStrength.value = config.strataWarpStrength ?? 1;
    uniforms.topsoilDepth.value = config.topsoilDepth;
    uniforms.waterLine.value = config.waterLevel;
  }, [
    config.grassColorA,
    config.grassColorB,
    config.strataDark,
    config.strataLight,
    config.strataPebbleStrength,
    config.strataScale,
    config.strataWarpStrength,
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

    // Exterior contour lines: subtle terrain-following rings so strata-like
    // linework is visible beyond the carved letters too.
    const contourBand = field.r
      .mul(uniforms.strataScale.mul(0.82))
      .add(mx_noise_float(positionWorld.mul(vec3(0.22, 0, 0.22))).mul(0.18));
    const contourPos = contourBand.fract();
    const contourLine = smoothstep(0.0, 0.07, contourPos)
      .mul(smoothstep(1.0, 0.93, contourPos))
      .mul(0.11);
    const contourTint = uniforms.topsoilColor.mul(contourLine.mul(0.35));
    const meadowContours = meadow
      .mul(float(1).sub(contourLine))
      .add(contourTint);

    const topBand = getStrataBandPhase({
      depthReference: depthBelow,
      hillReference: hill,
      worldPos: positionWorld,
      uniforms,
    });
    const strata = getStrataColor({
      bandHash: topBand.bandHash,
      bandIndex: topBand.bandIndex,
      seam: topBand.seam,
      worldPos: positionWorld,
      uniforms,
    });

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

    const base = mix(meadowContours, soil, wallBlend)
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

  const wallMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 0.92,
      side: THREE.DoubleSide,
    });

    const worldSize = float(heightField.worldSize);
    const fieldUv = vec2(
      positionWorld.x.div(worldSize).add(0.5),
      float(0.5).sub(positionWorld.z.div(worldSize))
    );
    const wallField = texture(heightField.texture, fieldUv);
    const wallHill = wallField.b;
    const wallY = positionWorld.y;
    const wallDepthBelow = wallHill.sub(wallY).max(0);

    const wallBand = getStrataBandPhase({
      depthReference: wallDepthBelow,
      hillReference: wallHill,
      worldPos: positionWorld,
      uniforms,
    });
    const strata = getStrataColor({
      bandHash: wallBand.bandHash,
      bandIndex: wallBand.bandIndex,
      seam: wallBand.seam,
      worldPos: positionWorld,
      uniforms,
    });

    const topsoilBlend = smoothstep(
      uniforms.topsoilDepth,
      uniforms.topsoilDepth.mul(0.4),
      wallDepthBelow
    );
    const soil = mix(strata, uniforms.topsoilColor, topsoilBlend);
    const damp = smoothstep(
      uniforms.waterLine.add(0.35),
      uniforms.waterLine.sub(0.1),
      wallY
    );
    const grain = mx_noise_float(positionWorld.mul(18)).mul(0.08).add(0.96);

    mat.colorNode = soil
      .mul(float(1).sub(damp.mul(0.45)))
      .mul(grain)
      .mul(cloudShade(positionWorld.xz));

    return mat;
  }, [cloudShade, heightField.texture, heightField.worldSize, uniforms]);

  const wallGeometries = useMemo(() => {
    const half = heightField.worldSize * 0.5;
    const wallBottom =
      config.waterLevel -
      config.pitDepth -
      Math.max(1.2, config.hillAmplitude * 0.85);

    return {
      back: buildFrontBackWallGeometry({
        half,
        sampleHeight: heightField.sampleHeight,
        segments: WALL_SEGMENTS,
        wallBottom,
        z: -half,
      }),
      front: buildFrontBackWallGeometry({
        half,
        sampleHeight: heightField.sampleHeight,
        segments: WALL_SEGMENTS,
        wallBottom,
        z: half,
      }),
      left: buildLeftRightWallGeometry({
        half,
        sampleHeight: heightField.sampleHeight,
        segments: WALL_SEGMENTS,
        wallBottom,
        x: -half,
      }),
      right: buildLeftRightWallGeometry({
        half,
        sampleHeight: heightField.sampleHeight,
        segments: WALL_SEGMENTS,
        wallBottom,
        x: half,
      }),
    };
  }, [
    config.hillAmplitude,
    config.pitDepth,
    config.waterLevel,
    heightField.sampleHeight,
    heightField.worldSize,
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);
  useEffect(
    () => () => {
      wallGeometries.front.dispose();
      wallGeometries.back.dispose();
      wallGeometries.left.dispose();
      wallGeometries.right.dispose();
    },
    [wallGeometries]
  );

  return (
    <group>
      <mesh
        castShadow={config.terrainCastShadow}
        geometry={geometry}
        material={material}
        receiveShadow
        rotation-x={-Math.PI / 2}
      />
      <mesh
        castShadow
        geometry={wallGeometries.front}
        material={wallMaterial}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={wallGeometries.back}
        material={wallMaterial}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={wallGeometries.left}
        material={wallMaterial}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={wallGeometries.right}
        material={wallMaterial}
        receiveShadow
      />
    </group>
  );
}

export default memo(Terrain);
