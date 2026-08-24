import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import createTerrainMaterial from '../utils/terrainMaterial';
import {
  CHUNK_SIZE,
  chunkCoord,
  chunkKey,
  ringChunks,
} from '../utils/worldgen';
import Fireflies from './Fireflies';
import FlowerChunk from './FlowerChunk';
import GrassChunk from './GrassChunk';
import SettingChunk from './SettingChunk';
import TerrainChunk from './TerrainChunk';
import TreeChunk from './TreeChunk';

// Streams the endless world as a square ring of chunks around the ghost.
// Chunks are keyed by their grid coordinate, so crossing a border only
// mounts the new leading row and unmounts the trailing one — everything in
// between survives untouched. New chunks are *revealed one per frame*
// (center-out) instead of all at once: geometry building + grass scatter
// for a whole row in a single frame is what caused the visible stutter on
// chunk crossings. The grass distance fade in bladeMaterial hides the
// staggered arrivals — blades grow in from zero past the fade line.
function World({ config, tracker, world }) {
  const [center, setCenter] = useState({ cx: 0, cz: 0 });
  const [revealed, setRevealed] = useState(() => new Set());
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  const chunks = useMemo(
    () => ringChunks(center.cx, center.cz, config.chunkRadius),
    [center.cx, center.cz, config.chunkRadius]
  );

  useFrame(() => {
    const cx = chunkCoord(tracker.position.x);
    const cz = chunkCoord(tracker.position.z);
    if (cx !== center.cx || cz !== center.cz) {
      setCenter({ cx, cz });
      return;
    }

    // Reveal the nearest not-yet-mounted chunk, one per frame.
    const { current } = revealedRef;
    const next = chunks.find(
      (chunk) => !current.has(chunkKey(chunk.cx, chunk.cz))
    );
    if (next) {
      const grown = new Set(current);
      grown.add(chunkKey(next.cx, next.cz));
      // Drop keys that left the ring so the set doesn't grow unbounded.
      const live = new Set(chunks.map((c) => chunkKey(c.cx, c.cz)));
      grown.forEach((key) => {
        if (!live.has(key)) grown.delete(key);
      });
      setRevealed(grown);
    }
  });

  const terrainUniforms = useMemo(
    () => ({
      groundColor: uniform(new THREE.Color(config.groundColor)),
      groundColorAlt: uniform(new THREE.Color(config.groundColorAlt)),
      pathColor: uniform(new THREE.Color(config.pathColor)),
      shoreColor: uniform(new THREE.Color(config.shoreColor)),
    }),
    []
  );

  useEffect(() => {
    terrainUniforms.groundColor.value.set(config.groundColor);
    terrainUniforms.groundColorAlt.value.set(config.groundColorAlt);
    terrainUniforms.pathColor.value.set(config.pathColor);
    terrainUniforms.shoreColor.value.set(config.shoreColor);
  }, [
    config.groundColor,
    config.groundColorAlt,
    config.pathColor,
    config.shoreColor,
    terrainUniforms,
  ]);

  const terrainMaterial = useMemo(
    () => createTerrainMaterial(terrainUniforms),
    [terrainUniforms]
  );
  useEffect(() => () => terrainMaterial.dispose(), [terrainMaterial]);

  const grassUniforms = useMemo(
    () => ({
      backlightStrength: uniform(config.backlightStrength),
      bladeBend: uniform(config.bladeBend),
      bladeHeight: uniform(config.bladeHeight),
      bladeWidth: uniform(config.bladeWidth),
      fadeEnd: uniform(60),
      fadeStart: uniform(40),
      ghostPosition: tracker.ghostPosition,
      moonColor: uniform(new THREE.Color(config.moonLightColor)),
      moonDir: uniform(new THREE.Vector3(0, -1, 0)),
      rootColor: uniform(new THREE.Color(config.grassRootColor)),
      tipColor: uniform(new THREE.Color(config.grassTipColor)),
      touchRadius: uniform(config.touchRadius),
      touchStrength: uniform(config.touchStrength),
      windAngle: uniform(0),
      windDir: uniform(new THREE.Vector2(config.windDirX, config.windDirZ)),
      windScale: uniform(config.windScale),
      windSpeed: uniform(config.windSpeed),
      windStrength: uniform(config.windStrength),
    }),
    []
  );

  useEffect(() => {
    grassUniforms.backlightStrength.value = config.backlightStrength;
    grassUniforms.bladeBend.value = config.bladeBend;
    grassUniforms.bladeHeight.value = config.bladeHeight;
    grassUniforms.bladeWidth.value = config.bladeWidth;
    grassUniforms.moonColor.value.set(config.moonLightColor);
    grassUniforms.rootColor.value.set(config.grassRootColor);
    grassUniforms.tipColor.value.set(config.grassTipColor);
    grassUniforms.touchRadius.value = config.touchRadius;
    grassUniforms.touchStrength.value = config.touchStrength;
    grassUniforms.windDir.value
      .set(config.windDirX, config.windDirZ)
      .normalize();
    grassUniforms.windAngle.value = Math.atan2(
      grassUniforms.windDir.value.y,
      grassUniforms.windDir.value.x
    );
    grassUniforms.windScale.value = config.windScale;
    grassUniforms.windSpeed.value = config.windSpeed;
    grassUniforms.windStrength.value = config.windStrength;

    // Blades vanish just inside the loaded grass ring so chunk streaming
    // stays hidden behind the fade.
    const grassExtent =
      (Math.min(config.grassChunkRadius, config.chunkRadius) + 0.5) *
      CHUNK_SIZE;
    grassUniforms.fadeStart.value = grassExtent * 0.6;
    grassUniforms.fadeEnd.value = grassExtent * 0.95;

    // Direction moonlight travels (moon position -> scene), matching
    // SkyRig's moon placement, for the translucency term.
    const azimuth = (config.moonAzimuth * Math.PI) / 180;
    const elevation = (config.moonElevation * Math.PI) / 180;
    grassUniforms.moonDir.value
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
    config.chunkRadius,
    config.grassChunkRadius,
    config.moonAzimuth,
    config.moonElevation,
    config.moonLightColor,
    config.grassRootColor,
    config.grassTipColor,
    config.touchRadius,
    config.touchStrength,
    config.windDirX,
    config.windDirZ,
    config.windScale,
    config.windSpeed,
    config.windStrength,
    grassUniforms,
  ]);

  // Grass only populates the inner ring — beyond that the fog and darkness
  // swallow the detail anyway, and blade count is the perf budget's biggest
  // line item.
  const grassRadius = Math.min(config.grassChunkRadius, config.chunkRadius);

  return (
    <group>
      {chunks
        .filter(({ cx, cz }) => revealed.has(chunkKey(cx, cz)))
        .map(({ cx, cz, dist }) => (
          <React.Fragment key={`${cx}:${cz}`}>
            <TerrainChunk
              cx={cx}
              cz={cz}
              material={terrainMaterial}
              segments={config.terrainSegments}
              world={world}
            />
            {dist <= grassRadius && (
              <GrassChunk
                bladeCount={Math.floor(
                  config.bladesPerChunk *
                    (dist === 0 ? 1 : config.grassRingDensity)
                )}
                clumpSize={config.clumpSize}
                cx={cx}
                cz={cz}
                uniforms={grassUniforms}
                world={world}
              />
            )}
            {dist <= grassRadius && config.flowersPerChunk > 0 && (
              <FlowerChunk
                config={config}
                cx={cx}
                cz={cz}
                tracker={tracker}
                world={world}
              />
            )}
            {config.treesEnabled && (
              <TreeChunk config={config} cx={cx} cz={cz} world={world} />
            )}
            {config.settingsEnabled && (
              <SettingChunk config={config} cx={cx} cz={cz} world={world} />
            )}
          </React.Fragment>
        ))}
      {config.firefliesEnabled && (
        <Fireflies
          center={center}
          config={config}
          tracker={tracker}
          world={world}
        />
      )}
    </group>
  );
}

export default memo(World);
