import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import createBladeMaterial from '../utils/bladeMaterial';
import { createGrassStore, scatterBlades } from '../utils/grass';

// Full-field instanced grass. Placement is CPU-scattered onto the shared
// heightfield (blades hug the terrain, avoid the carved letters, and cluster
// into clumps); all motion and shading live in the TSL blade material.
function Grass({ cloudShade, config, heightField }) {
  const store = useMemo(() => createGrassStore(), []);

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
    uniforms.windDir.value.set(config.windDirX, config.windDirZ).normalize();
    uniforms.windScale.value = config.windScale;
    uniforms.windSpeed.value = config.windSpeed * (config.globalMotionSpeed ?? 1);
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
    scatterBlades(store, {
      clumpPull: config.clumpPull,
      clumpSize: config.clumpSize,
      count: config.grassCount,
      heightField,
      seed: config.seed,
    });
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

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => store.geometry.dispose(), [store]);

  return (
    <mesh frustumCulled={false} geometry={store.geometry} material={material} />
  );
}

export default memo(Grass);
