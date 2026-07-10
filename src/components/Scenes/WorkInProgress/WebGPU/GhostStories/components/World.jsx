import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import createTerrainMaterial from '../utils/terrainMaterial';
import { chunkCoord, ringChunks } from '../utils/worldgen';
import Fireflies from './Fireflies';
import FlowerChunk from './FlowerChunk';
import GrassChunk from './GrassChunk';
import SettingChunk from './SettingChunk';
import TerrainChunk from './TerrainChunk';

// Streams the endless world as a square ring of chunks around the ghost.
// Chunks are keyed by their grid coordinate, so crossing a border only
// mounts the new leading row and unmounts the trailing one — everything
// in between survives untouched.
function World({ config, tracker, world }) {
  const [center, setCenter] = useState({ cx: 0, cz: 0 });

  useFrame(() => {
    const cx = chunkCoord(tracker.position.x);
    const cz = chunkCoord(tracker.position.z);
    if (cx !== center.cx || cz !== center.cz) {
      setCenter({ cx, cz });
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
      ghostPosition: tracker.ghostPosition,
      moonColor: uniform(new THREE.Color(config.moonLightColor)),
      moonDir: uniform(new THREE.Vector3(0, -1, 0)),
      rootColor: uniform(new THREE.Color(config.grassRootColor)),
      tipColor: uniform(new THREE.Color(config.grassTipColor)),
      touchRadius: uniform(config.touchRadius),
      touchStrength: uniform(config.touchStrength),
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
    grassUniforms.windScale.value = config.windScale;
    grassUniforms.windSpeed.value = config.windSpeed;
    grassUniforms.windStrength.value = config.windStrength;

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

  const chunks = useMemo(
    () => ringChunks(center.cx, center.cz, config.chunkRadius),
    [center.cx, center.cz, config.chunkRadius]
  );

  // Grass only populates the inner ring — beyond that the fog and darkness
  // swallow the detail anyway, and blade count is the perf budget's biggest
  // line item.
  const grassRadius = Math.min(config.grassChunkRadius, config.chunkRadius);

  return (
    <group>
      {chunks.map(({ cx, cz, dist }) => (
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
