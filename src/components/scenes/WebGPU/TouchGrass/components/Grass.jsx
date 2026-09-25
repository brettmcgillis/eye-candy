import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { uniform } from 'three/tsl';

import {
  Grass as GrassField,
  createGrassUniforms,
  scatterGrid,
  scatterRejection,
  setBacklightDirection,
  setGrassUniforms,
  setWindDirection,
} from '@elements/Grass';

import {
  GRASS_EDGE_OVERDRAW,
  MAX_BLADES,
  estimateHeroGrassCoverage,
  meadowSampler,
  outerMeadowSampler,
} from '../utils/grass';
import createPulseLift from '../utils/grassPulse';
import renderTextMask from '../utils/textMask';

const ENDLESS_TILE_RADIUS = 2;
const OUTER_GRASS_PER_TILE_MAX = 150000;

function Grass({ cloudShade, config, heightField, touchPosition }) {
  const showChunkMode = (config.terrainEdgeMode ?? 'chunk') === 'chunk';
  const [heroPlacedCount, setHeroPlacedCount] = useState(config.grassCount);
  const motion = config.globalMotionSpeed ?? 1;

  const uniforms = useMemo(
    () => createGrassUniforms({ touchPosition }),
    [touchPosition]
  );
  const pulseUniforms = useMemo(
    () => ({
      terrainPulseAmplitude: uniform(0),
      terrainPulseScale: uniform(0.25),
      terrainPulseSpeed: uniform(0.35),
    }),
    []
  );

  useEffect(() => {
    setGrassUniforms(uniforms, {
      backlightColor: config.sunColor,
      backlightStrength: config.backlightStrength,
      bladeBend: config.bladeBend,
      bladeHeight: config.bladeHeight,
      bladeWidth: config.bladeWidth,
      rootColor: config.rootColor,
      tipColor: config.tipColor,
      touchRadius: config.touchRadius ?? 1.4,
      touchStrength: config.touchStrength ?? 0.8,
      windScale: config.windScale,
      windSpeed: config.windSpeed * motion,
      windStrength: config.windStrength,
    });
    setWindDirection(uniforms, config.windDirX, config.windDirZ);
    setBacklightDirection(uniforms, config.sunAzimuth, config.sunElevation);
    setGrassUniforms(pulseUniforms, {
      terrainPulseAmplitude: config.terrainPulseAmplitude ?? 0,
      terrainPulseScale: config.terrainPulseScale ?? 0.25,
      terrainPulseSpeed: (config.terrainPulseSpeed ?? 0.35) * motion,
    });
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
    config.touchRadius,
    config.touchStrength,
    config.windDirX,
    config.windDirZ,
    config.windScale,
    config.windSpeed,
    config.windStrength,
    motion,
    pulseUniforms,
    uniforms,
  ]);

  const heroMaterial = useMemo(
    () => ({
      gradient: 'smooth',
      lift: createPulseLift(pulseUniforms),
      shade: (position) => cloudShade(position.xz),
      touch: true,
      wind: 'sway',
    }),
    [cloudShade, pulseUniforms]
  );

  const heroScatter = useCallback(
    (store) =>
      setHeroPlacedCount(
        scatterRejection(store, {
          clumpPull: config.clumpPull,
          clumpSize: config.clumpSize,
          count: config.grassCount,
          half: heightField.worldSize * GRASS_EDGE_OVERDRAW,
          sample: meadowSampler(heightField),
          seed: config.seed,
        })
      ),
    [
      config.clumpPull,
      config.clumpSize,
      config.grassCount,
      config.seed,
      heightField,
    ]
  );

  const endlessCarveSampler = useMemo(() => {
    if (showChunkMode) {
      return null;
    }

    // Match carve projection to the full loaded endless footprint so text can
    // continue naturally into surrounding chunks.
    const spanChunks = ENDLESS_TILE_RADIUS * 2 + 1;
    const worldSpan = heightField.worldSize * spanChunks;
    const textMask = renderTextMask({
      edgeSoftness: config.edgeSoftness,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      letterSpacing: config.letterSpacing,
      text: config.text,
      textRotation: config.textRotation,
      textScale: (config.textScale ?? 1) / spanChunks,
    });

    return (worldX, worldZ) => {
      const u = worldX / worldSpan + 0.5;
      const v = 0.5 - worldZ / worldSpan;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        return 0;
      }
      return textMask.sampleCarveWithXTilt(u, 1 - v, config.textTiltX ?? 0);
    };
  }, [
    config.edgeSoftness,
    config.fontFamily,
    config.fontWeight,
    config.letterSpacing,
    config.text,
    config.textRotation,
    config.textTiltX,
    config.textScale,
    heightField.worldSize,
    showChunkMode,
  ]);

  const heroGrassCoverage = useMemo(
    () => estimateHeroGrassCoverage(heightField),
    [heightField]
  );

  const outerTiles = useMemo(() => {
    if (showChunkMode) {
      return [];
    }
    const tiles = [];
    for (let z = -ENDLESS_TILE_RADIUS; z <= ENDLESS_TILE_RADIUS; z += 1) {
      for (let x = -ENDLESS_TILE_RADIUS; x <= ENDLESS_TILE_RADIUS; x += 1) {
        if (x !== 0 || z !== 0) {
          const offsetX = x * heightField.worldSize;
          const offsetZ = z * heightField.worldSize;
          tiles.push({
            key: `${offsetX}:${offsetZ}`,
            material: {
              ...heroMaterial,
              chunkOffsetX: offsetX,
              chunkOffsetZ: offsetZ,
            },
            offsetX,
            offsetZ,
          });
        }
      }
    }
    return tiles;
  }, [heightField.worldSize, heroMaterial, showChunkMode]);

  const outerPerTileCount = useMemo(() => {
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
    return Math.max(
      800,
      Math.min(
        outerPerTileCap,
        Math.floor(heroEquivalentFullTileCount * outerDensity)
      )
    );
  }, [
    config.endlessGrassDensity,
    config.endlessGrassPerTileCap,
    config.endlessTileDensityRatio,
    config.grassCount,
    heroGrassCoverage,
    heroPlacedCount,
  ]);

  const outerScatters = useMemo(() => {
    const sample = outerMeadowSampler(
      {
        hillAmplitude: config.hillAmplitude,
        hillFrequency: config.hillFrequency,
        pitDepth: config.pitDepth,
        seed: config.seed,
        waterLevel: config.waterLevel,
      },
      endlessCarveSampler
    );
    return outerTiles.map(
      ({ offsetX, offsetZ }) =>
        (store) =>
          scatterGrid(store, {
            centerX: offsetX,
            centerZ: offsetZ,
            clumpSize: config.clumpSize ?? 0.2,
            count: outerPerTileCount,
            sample,
            seed: config.seed,
            size: heightField.worldSize,
          })
    );
  }, [
    config.clumpSize,
    config.hillAmplitude,
    config.hillFrequency,
    config.pitDepth,
    config.seed,
    config.waterLevel,
    endlessCarveSampler,
    heightField.worldSize,
    outerPerTileCount,
    outerTiles,
  ]);

  return (
    <group>
      <GrassField
        material={heroMaterial}
        maxCount={MAX_BLADES}
        scatter={heroScatter}
        uniforms={uniforms}
      />
      {outerTiles.map((tile, index) => (
        <GrassField
          key={tile.key}
          material={tile.material}
          maxCount={MAX_BLADES}
          position={[tile.offsetX, 0, tile.offsetZ]}
          scatter={outerScatters[index]}
          uniforms={uniforms}
        />
      ))}
    </group>
  );
}

export default memo(Grass);
