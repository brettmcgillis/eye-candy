/* eslint-disable no-continue */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useState } from 'react';

import createBladeMaterial from '../utils/bladeMaterial';
import { MAX_BLADES, createGrassStore, scatterBlades } from '../utils/grass';
import { fbm2, hash01 } from '../utils/noise2d';
import renderTextMask from '../utils/textMask';

const ENDLESS_TILE_RADIUS = 2;
const OUTER_GRASS_PER_TILE_MAX = 150000;

function smoothstepCpu(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function estimateHeroGrassCoverage(heightField, sampleGrid = 72) {
  const threshold = 0.3;
  const half = heightField.worldSize * 0.5;
  const step = heightField.worldSize / sampleGrid;
  let accepted = 0;
  let total = 0;

  for (let z = 0; z < sampleGrid; z += 1) {
    for (let x = 0; x < sampleGrid; x += 1) {
      const sx = -half + (x + 0.5) * step;
      const sz = -half + (z + 0.5) * step;
      if (heightField.sampleCarve(sx, sz) < threshold) {
        accepted += 1;
      }
      total += 1;
    }
  }

  return total > 0 ? accepted / total : 1;
}

function scatterOuterBlades(
  store,
  { chunkOffsetX, chunkOffsetZ, config, count, sampleOuterCarve, worldSize }
) {
  const { clumpAttribute, dataAttribute, geometry, offsetAttribute } = store;
  const offsets = offsetAttribute.array;
  const data = dataAttribute.array;
  const clump = clumpAttribute.array;
  const placedMax = Math.min(count, MAX_BLADES);
  const half = worldSize * 0.5;
  const minX = chunkOffsetX - half;
  const maxX = chunkOffsetX + half;
  const minZ = chunkOffsetZ - half;
  const maxZ = chunkOffsetZ + half;

  // World-space jittered grid: deterministic and seam-free across chunks.
  const cellSize = Math.max(worldSize / Math.sqrt(placedMax), 0.05);
  const minCellX = Math.floor(minX / cellSize) - 1;
  const maxCellX = Math.ceil(maxX / cellSize) + 1;
  const minCellZ = Math.floor(minZ / cellSize) - 1;
  const maxCellZ = Math.ceil(maxZ / cellSize) + 1;

  let placed = 0;
  for (let cz = minCellZ; cz <= maxCellZ && placed < placedMax; cz += 1) {
    for (let cx = minCellX; cx <= maxCellX && placed < placedMax; cx += 1) {
      const jitterX = hash01(cx, cz, config.seed + 101);
      const jitterZ = hash01(cx, cz, config.seed + 211);
      const worldX = (cx + jitterX) * cellSize;
      const worldZ = (cz + jitterZ) * cellSize;

      if (worldX < minX || worldX > maxX || worldZ < minZ || worldZ > maxZ) {
        continue;
      }

      const x = worldX - chunkOffsetX;
      const z = worldZ - chunkOffsetZ;
      const hill =
        fbm2(worldX * config.hillFrequency, worldZ * config.hillFrequency, {
          seed: config.seed,
          octaves: 4,
        }) * config.hillAmplitude;
      const carve = sampleOuterCarve ? sampleOuterCarve(worldX, worldZ) : 0;
      if (carve >= 0.3) {
        continue;
      }
      const pitFloor = config.waterLevel - config.pitDepth;
      const carvedHeight = hill + (pitFloor - hill) * carve;

      // Match hero chunk's clump-driven normal/tint shaping so endless
      // chunks don't read brighter from flatter clump normals.
      const clumpSize = Math.max(config.clumpSize ?? 0.2, 1e-3);
      const cellX = Math.floor(worldX / clumpSize);
      const cellZ = Math.floor(worldZ / clumpSize);
      const centerX =
        (cellX + 0.5 + (hash01(cellX, cellZ, config.seed + 11) - 0.5) * 0.8) *
        clumpSize;
      const centerZ =
        (cellZ + 0.5 + (hash01(cellX, cellZ, config.seed + 23) - 0.5) * 0.8) *
        clumpSize;
      const dx = centerX - worldX;
      const dz = centerZ - worldZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const closeness = Math.max(0, 1 - dist / clumpSize);
      const invDist = dist > 1e-5 ? 1 / dist : 0;

      const yaw = hash01(cx, cz, config.seed + 307) * Math.PI * 2;
      const scale = 0.7 + hash01(cx, cz, config.seed + 401) * 0.6;
      const seedA = hash01(cx, cz, config.seed + 503);
      const seedB = hash01(cx, cz, config.seed + 601);

      offsets[placed * 3] = x;
      offsets[placed * 3 + 1] = carvedHeight - 0.02;
      offsets[placed * 3 + 2] = z;
      data[placed * 4] = yaw;
      data[placed * 4 + 1] = scale;
      data[placed * 4 + 2] = seedA;
      data[placed * 4 + 3] = seedB;
      clump[placed * 4] = dx * invDist * closeness;
      clump[placed * 4 + 1] = dz * invDist * closeness;
      clump[placed * 4 + 2] = hash01(cellX, cellZ, config.seed + 701);
      clump[placed * 4 + 3] = hash01(cx, cz, config.seed + 809);

      placed += 1;
    }
  }

  offsetAttribute.needsUpdate = true;
  dataAttribute.needsUpdate = true;
  clumpAttribute.needsUpdate = true;
  geometry.instanceCount = placed;
}

// Full-field instanced grass. Placement is CPU-scattered onto the shared
// heightfield (blades hug the terrain, avoid the carved letters, and cluster
// into clumps); all motion and shading live in the TSL blade material.
function Grass({ cloudShade, config, heightField }) {
  const store = useMemo(() => createGrassStore(), []);
  const showChunkMode = (config.terrainEdgeMode ?? 'chunk') === 'chunk';
  const [heroPlacedCount, setHeroPlacedCount] = useState(config.grassCount);

  const uniforms = useMemo(
    () => ({
      backlightStrength: uniform(config.backlightStrength),
      bladeBend: uniform(config.bladeBend),
      bladeHeight: uniform(config.bladeHeight),
      bladeWidth: uniform(config.bladeWidth),
      rootColor: uniform(new THREE.Color(config.rootColor)),
      sunColor: uniform(new THREE.Color(config.sunColor)),
      sunDir: uniform(new THREE.Vector3(0, -1, 0)),
      tipColor: uniform(new THREE.Color(config.tipColor)),
      terrainPulseAmplitude: uniform(config.terrainPulseAmplitude ?? 0),
      terrainPulseScale: uniform(config.terrainPulseScale ?? 0.25),
      terrainPulseSpeed: uniform(config.terrainPulseSpeed ?? 0.35),
      windDir: uniform(new THREE.Vector2(config.windDirX, config.windDirZ)),
      windScale: uniform(config.windScale),
      windSpeed: uniform(config.windSpeed),
      windStrength: uniform(config.windStrength),
    }),
    []
  );

  useEffect(() => {
    uniforms.backlightStrength.value = config.backlightStrength;
    uniforms.bladeBend.value = config.bladeBend;
    uniforms.bladeHeight.value = config.bladeHeight;
    uniforms.bladeWidth.value = config.bladeWidth;
    uniforms.rootColor.value.set(config.rootColor);
    uniforms.sunColor.value.set(config.sunColor);
    uniforms.tipColor.value.set(config.tipColor);
    uniforms.terrainPulseAmplitude.value = config.terrainPulseAmplitude ?? 0;
    uniforms.terrainPulseScale.value = config.terrainPulseScale ?? 0.25;
    uniforms.terrainPulseSpeed.value =
      (config.terrainPulseSpeed ?? 0.35) * (config.globalMotionSpeed ?? 1);
    uniforms.windDir.value.set(config.windDirX, config.windDirZ).normalize();
    uniforms.windScale.value = config.windScale;
    uniforms.windSpeed.value =
      config.windSpeed * (config.globalMotionSpeed ?? 1);
    uniforms.windStrength.value = config.windStrength;

    // Direction sunlight travels (sun position -> scene origin), matching
    // SkyRig's sun placement, for the translucency term.
    const azimuth = (config.sunAzimuth * Math.PI) / 180;
    const elevation = (config.sunElevation * Math.PI) / 180;
    uniforms.sunDir.value
      .set(
        -Math.sin(azimuth) * Math.cos(elevation),
        -Math.sin(elevation),
        -Math.cos(azimuth) * Math.cos(elevation)
      )
      .normalize();
  }, [
    config.backlightStrength,
    config.bladeBend,
    config.bladeHeight,
    config.bladeWidth,
    config.rootColor,
    config.sunAzimuth,
    config.sunColor,
    config.sunElevation,
    config.terrainPulseAmplitude,
    config.terrainPulseScale,
    config.terrainPulseSpeed,
    config.tipColor,
    config.windDirX,
    config.windDirZ,
    config.globalMotionSpeed,
    config.windScale,
    config.windSpeed,
    config.windStrength,
    uniforms,
  ]);

  useEffect(() => {
    const placed = scatterBlades(store, {
      clumpPull: config.clumpPull,
      clumpSize: config.clumpSize,
      count: config.grassCount,
      heightField,
      seed: config.seed,
    });
    setHeroPlacedCount(placed);
  }, [
    config.clumpPull,
    config.clumpSize,
    config.grassCount,
    config.seed,
    heightField,
    store,
  ]);

  const material = useMemo(
    () => createBladeMaterial({ cloudShade, store, uniforms }),
    [cloudShade, store, uniforms]
  );

  const endlessCarveSampler = useMemo(() => {
    if (showChunkMode) {
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
    config.text,
    config.textRotation,
    config.textScale,
    config.terrainEdgeMode,
    heightField.worldSize,
    showChunkMode,
  ]);

  const heroGrassCoverage = useMemo(
    () => estimateHeroGrassCoverage(heightField),
    [heightField]
  );

  const endlessOuterTiles = useMemo(() => {
    if (showChunkMode) {
      return [];
    }

    const offsets = [];
    for (let z = -ENDLESS_TILE_RADIUS; z <= ENDLESS_TILE_RADIUS; z += 1) {
      for (let x = -ENDLESS_TILE_RADIUS; x <= ENDLESS_TILE_RADIUS; x += 1) {
        if (x === 0 && z === 0) {
          continue;
        }
        offsets.push([x * heightField.worldSize, z * heightField.worldSize]);
      }
    }

    const outerDensity =
      config.endlessTileDensityRatio ?? config.endlessGrassDensity ?? 1;
    const outerPerTileCap =
      config.endlessGrassPerTileCap ??
      config.grassCount ??
      OUTER_GRASS_PER_TILE_MAX;

    // Hero blades are packed only into non-carved area; outer chunks have no
    // carve, so scale up outer count by hero open-area coverage to match
    // perceived density and self-shadowing.
    const heroEquivalentFullTileCount = Math.floor(
      heroPlacedCount / Math.max(heroGrassCoverage, 0.05)
    );
    const outerPerTileCount = Math.max(
      800,
      Math.min(
        outerPerTileCap,
        Math.floor(heroEquivalentFullTileCount * outerDensity)
      )
    );

    return offsets.map(([x, z], index) => {
      const tileStore = createGrassStore();
      scatterOuterBlades(tileStore, {
        chunkOffsetX: x,
        chunkOffsetZ: z,
        config,
        count: outerPerTileCount,
        sampleOuterCarve: endlessCarveSampler,
        worldSize: heightField.worldSize,
      });

      const tileMaterial = createBladeMaterial({
        cloudShade,
        store: tileStore,
        uniforms,
      });

      return {
        key: `${index}:${x}:${z}`,
        material: tileMaterial,
        position: [x, 0, z],
        store: tileStore,
      };
    });
  }, [
    cloudShade,
    config.endlessGrassDensity,
    config.endlessGrassPerTileCap,
    config.grassCount,
    config.pitDepth,
    heroGrassCoverage,
    heroPlacedCount,
    config.hillAmplitude,
    config.hillFrequency,
    config.seed,
    config.terrainEdgeMode,
    config.waterLevel,
    endlessCarveSampler,
    heightField.worldSize,
    showChunkMode,
    uniforms,
  ]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => store.geometry.dispose(), [store]);
  useEffect(
    () => () => {
      endlessOuterTiles.forEach((tile) => {
        tile.material.dispose();
        tile.store.geometry.dispose();
      });
    },
    [endlessOuterTiles]
  );

  return (
    <group>
      <mesh
        frustumCulled={false}
        geometry={store.geometry}
        material={material}
      />
      {!showChunkMode &&
        endlessOuterTiles.map((tile) => (
          <mesh
            key={tile.key}
            frustumCulled={false}
            geometry={tile.store.geometry}
            material={tile.material}
            position={tile.position}
          />
        ))}
    </group>
  );
}

export default memo(Grass);
