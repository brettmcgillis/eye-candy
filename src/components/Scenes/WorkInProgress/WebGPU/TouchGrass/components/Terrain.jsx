/* eslint-disable camelcase */
import {
  attribute,
  float,
  mix,
  mx_noise_float,
  positionGeometry,
  positionWorld,
  smoothstep,
  time,
  texture,
  transformNormalToView,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { fbm2 } from '../utils/noise2d';
import renderTextMask from '../utils/textMask';

const SEGMENTS = 320;
const WALL_SEGMENTS = 192;
const ENDLESS_TILE_RADIUS = 2;
const OUTER_SEGMENTS = 120;

function smoothstepCpu(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

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

function buildOuterTerrainGeometry({
  carveSampler,
  chunkSize,
  hillAmplitude,
  hillFrequency,
  offsetX,
  offsetZ,
  pitFloor,
  seed,
  segments,
}) {
  const geometry = new THREE.PlaneGeometry(
    chunkSize,
    chunkSize,
    segments,
    segments
  );
  const positions = geometry.attributes.position;
  const carveAttr = new Float32Array(positions.count);
  const hillAttr = new Float32Array(positions.count);

  for (let i = 0; i < positions.count; i += 1) {
    const localX = positions.getX(i);
    const localY = positions.getY(i);
    const worldX = localX + offsetX;
    const worldZ = -localY + offsetZ;
    const hill =
      fbm2(worldX * hillFrequency, worldZ * hillFrequency, {
        seed,
        octaves: 4,
      }) * hillAmplitude;
    const carve = carveSampler ? carveSampler(worldX, worldZ) : 0;
    const height = hill + (pitFloor - hill) * carve;
    positions.setZ(i, height);
    carveAttr[i] = carve;
    hillAttr[i] = hill;
  }

  positions.needsUpdate = true;
  geometry.setAttribute(
    'outerCarve',
    new THREE.Float32BufferAttribute(carveAttr, 1)
  );
  geometry.setAttribute(
    'outerHill',
    new THREE.Float32BufferAttribute(hillAttr, 1)
  );
  geometry.computeVertexNormals();
  return geometry;
}

// Heightfield-displaced ground plane. The letters are "subtracted" by the
// carve baked into the heightfield; walls and pit floors are shaded as
// topsoil over horizontal sediment strata (absolute world-Y bands, like real
// geology), while the untouched top surface stays meadow green.
function Terrain({ cloudShade, config, heightField }) {
  const showChunkWalls = (config.terrainEdgeMode ?? 'chunk') === 'chunk';

  const endlessCarveSampler = useMemo(() => {
    if (showChunkWalls) {
      return null;
    }

    // Match carve projection to the full loaded endless footprint so text can
    // continue naturally into surrounding chunks.
    const spanChunks = ENDLESS_TILE_RADIUS * 2 + 1;
    const worldSpan = heightField.worldSize * spanChunks;
    const endlessTextScale = (config.textScale ?? 1) / spanChunks;

    const textMask = renderTextMask({
      edgeSoftness: config.edgeSoftness,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      letterSpacing: config.letterSpacing,
      text: config.text,
      textRotation: config.textRotation,
      textScale: endlessTextScale,
    });

    return (worldX, worldZ) => {
      const u = worldX / worldSpan + 0.5;
      const v = 0.5 - worldZ / worldSpan;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        return 0;
      }
      const mask = textMask.sample(u, 1 - v);
      return smoothstepCpu(0.3, 0.7, mask);
    };
  }, [
    config.edgeSoftness,
    config.fontFamily,
    config.fontWeight,
    config.letterSpacing,
    config.terrainEdgeMode,
    config.text,
    config.textRotation,
    config.textScale,
    heightField.worldSize,
    showChunkWalls,
  ]);

  const uniforms = useMemo(
    () => ({
      grassColorA: uniform(new THREE.Color(config.grassColorA)),
      grassColorB: uniform(new THREE.Color(config.grassColorB)),
      strataDark: uniform(new THREE.Color(config.strataDark)),
      strataLight: uniform(new THREE.Color(config.strataLight)),
      strataPebbleStrength: uniform(config.strataPebbleStrength ?? 1),
      strataScale: uniform(config.strataScale),
      strataWarpStrength: uniform(config.strataWarpStrength ?? 1),
      terrainPulseAmplitude: uniform(config.terrainPulseAmplitude ?? 0),
      terrainPulseScale: uniform(config.terrainPulseScale ?? 0.25),
      terrainPulseSpeed: uniform(config.terrainPulseSpeed ?? 0.35),
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
    uniforms.terrainPulseAmplitude.value = config.terrainPulseAmplitude ?? 0;
    uniforms.terrainPulseScale.value = config.terrainPulseScale ?? 0.25;
    uniforms.terrainPulseSpeed.value = config.terrainPulseSpeed ?? 0.35;
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
    config.terrainPulseAmplitude,
    config.terrainPulseScale,
    config.terrainPulseSpeed,
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
    const pulse = mx_noise_float(
      vec3(
        positionGeometry.x.mul(uniforms.terrainPulseScale),
        positionGeometry.y.mul(uniforms.terrainPulseScale),
        time.mul(uniforms.terrainPulseSpeed.mul(config.globalMotionSpeed ?? 1))
      )
    )
      .sub(0.5)
      .mul(uniforms.terrainPulseAmplitude);

    // Plane local z becomes world y after the -90° x rotation.
    mat.positionNode = positionGeometry.add(vec3(0, 0, field.r.add(pulse)));

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

  const endlessOuterMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 0.95,
    });

    const pulse = mx_noise_float(
      vec3(
        positionGeometry.x.mul(uniforms.terrainPulseScale),
        positionGeometry.y.mul(uniforms.terrainPulseScale),
        time.mul(uniforms.terrainPulseSpeed.mul(config.globalMotionSpeed ?? 1))
      )
    )
      .sub(0.5)
      .mul(uniforms.terrainPulseAmplitude);
    mat.positionNode = positionGeometry.add(vec3(0, 0, pulse));

    const hill = attribute('outerHill');
    const carve = attribute('outerCarve');
    const worldY = positionWorld.y;
    const depthBelow = hill.sub(worldY).max(0);

    const meadowNoise = mx_noise_float(
      vec3(positionWorld.x.mul(0.4), 0, positionWorld.z.mul(0.4))
    )
      .mul(0.5)
      .add(0.5);
    const meadow = mix(uniforms.grassColorA, uniforms.grassColorB, meadowNoise);

    const contourBand = positionWorld.y
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

    const topsoilBlend = smoothstep(
      uniforms.topsoilDepth,
      uniforms.topsoilDepth.mul(0.4),
      depthBelow
    );
    const soil = mix(strata, uniforms.topsoilColor, topsoilBlend);
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
  }, [cloudShade, config.globalMotionSpeed, uniforms]);

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

  const terrainTileOffsets = useMemo(() => {
    if (showChunkWalls) {
      return [[0, 0]];
    }

    const offsets = [];
    for (let z = -ENDLESS_TILE_RADIUS; z <= ENDLESS_TILE_RADIUS; z += 1) {
      for (let x = -ENDLESS_TILE_RADIUS; x <= ENDLESS_TILE_RADIUS; x += 1) {
        offsets.push([x * heightField.worldSize, z * heightField.worldSize]);
      }
    }
    return offsets;
  }, [heightField.worldSize, showChunkWalls]);

  const endlessOuterChunks = useMemo(() => {
    if (showChunkWalls) {
      return [];
    }

    const chunks = [];
    terrainTileOffsets.forEach(([x, z]) => {
      if (x === 0 && z === 0) {
        return;
      }

      chunks.push({
        geometry: buildOuterTerrainGeometry({
          carveSampler: endlessCarveSampler,
          chunkSize: heightField.worldSize,
          hillAmplitude: config.hillAmplitude,
          hillFrequency: config.hillFrequency,
          offsetX: x,
          offsetZ: z,
          pitFloor: config.waterLevel - config.pitDepth,
          seed: config.seed,
          segments: OUTER_SEGMENTS,
        }),
        key: `${x}:${z}`,
        position: [x, 0, z],
      });
    });

    return chunks;
  }, [
    config.hillAmplitude,
    config.hillFrequency,
    config.pitDepth,
    config.seed,
    config.waterLevel,
    endlessCarveSampler,
    heightField.worldSize,
    showChunkWalls,
    terrainTileOffsets,
  ]);

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
    if (!showChunkWalls) {
      return null;
    }

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
    config.terrainEdgeMode,
    config.waterLevel,
    heightField.sampleHeight,
    heightField.worldSize,
    showChunkWalls,
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => endlessOuterMaterial.dispose(), [endlessOuterMaterial]);
  useEffect(
    () => () => {
      endlessOuterChunks.forEach((chunk) => chunk.geometry.dispose());
    },
    [endlessOuterChunks]
  );
  useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);
  useEffect(
    () => () => {
      if (!wallGeometries) {
        return;
      }
      wallGeometries.front.dispose();
      wallGeometries.back.dispose();
      wallGeometries.left.dispose();
      wallGeometries.right.dispose();
    },
    [wallGeometries]
  );

  return (
    <group>
      {terrainTileOffsets.map(([x, z]) => {
        const isCenterTile = x === 0 && z === 0;
        if (!isCenterTile) {
          return null;
        }

        return (
          <mesh
            key={`${x}:${z}`}
            castShadow={config.terrainCastShadow}
            geometry={geometry}
            material={material}
            position={[x, 0, z]}
            receiveShadow
            rotation-x={-Math.PI / 2}
          />
        );
      })}
      {!showChunkWalls &&
        endlessOuterChunks.map((chunk) => (
          <mesh
            key={chunk.key}
            castShadow={config.terrainCastShadow}
            geometry={chunk.geometry}
            material={endlessOuterMaterial}
            position={chunk.position}
            receiveShadow
            rotation-x={-Math.PI / 2}
          />
        ))}
      {showChunkWalls && wallGeometries && (
        <>
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
        </>
      )}
    </group>
  );
}

export default memo(Terrain);
