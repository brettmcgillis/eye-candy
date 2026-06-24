import React, { memo, useEffect, useMemo } from 'react';

import createHandsMaterial from '../utils/createHandsMaterial';
import HandsPair from './HandsPair';

function PrayerCluster({ config }) {
  const cleanMaterial = useMemo(() => {
    return createHandsMaterial({
      baseColor: config.cleanBaseColor,
      accentColor: config.cleanAccentColor,
      amount: config.cleanAmount,
      scale: config.cleanScale,
      iterations: config.cleanIterations,
      noise: config.cleanNoise,
      noiseScale: config.cleanNoiseScale,
      seed: config.cleanSeed,
      metalness: config.cleanMetalness,
      roughness: config.cleanRoughness,
    });
  }, [
    config.cleanBaseColor,
    config.cleanAccentColor,
    config.cleanAmount,
    config.cleanScale,
    config.cleanIterations,
    config.cleanNoise,
    config.cleanNoiseScale,
    config.cleanSeed,
    config.cleanMetalness,
    config.cleanRoughness,
  ]);

  const oilMaterial = useMemo(() => {
    return createHandsMaterial({
      baseColor: config.oilBaseColor,
      accentColor: config.oilAccentColor,
      amount: config.oilAmount,
      scale: config.oilScale,
      iterations: config.oilIterations,
      noise: config.oilNoise,
      noiseScale: config.oilNoiseScale,
      seed: config.oilSeed,
      metalness: config.oilMetalness,
      roughness: config.oilRoughness,
    });
  }, [
    config.oilBaseColor,
    config.oilAccentColor,
    config.oilAmount,
    config.oilScale,
    config.oilIterations,
    config.oilNoise,
    config.oilNoiseScale,
    config.oilSeed,
    config.oilMetalness,
    config.oilRoughness,
  ]);

  const bloodMaterial = useMemo(() => {
    return createHandsMaterial({
      baseColor: config.bloodBaseColor,
      accentColor: config.bloodAccentColor,
      amount: config.bloodAmount,
      scale: config.bloodScale,
      iterations: config.bloodIterations,
      noise: config.bloodNoise,
      noiseScale: config.bloodNoiseScale,
      seed: config.bloodSeed,
      metalness: config.bloodMetalness,
      roughness: config.bloodRoughness,
    });
  }, [
    config.bloodBaseColor,
    config.bloodAccentColor,
    config.bloodAmount,
    config.bloodScale,
    config.bloodIterations,
    config.bloodNoise,
    config.bloodNoiseScale,
    config.bloodSeed,
    config.bloodMetalness,
    config.bloodRoughness,
  ]);

  useEffect(() => {
    return () => {
      cleanMaterial.dispose();
      oilMaterial.dispose();
      bloodMaterial.dispose();
    };
  }, [cleanMaterial, oilMaterial, bloodMaterial]);

  return (
    <group>
      <HandsPair
        material={cleanMaterial}
        scale={config.baseScale}
        spread={0}
        position={config.basePosition}
      />

      <HandsPair
        material={oilMaterial}
        scale={config.middleScale}
        spread={config.middleSpread}
        spreadAxis="z"
        position={config.middlePosition}
        rotation={[0, config.middleYaw, 0]}
      />

      <HandsPair
        material={bloodMaterial}
        scale={config.outerScale}
        spread={config.outerSpread}
        spreadAxis="z"
        position={config.outerPosition}
        rotation={[0, config.outerYaw, 0]}
      />
    </group>
  );
}

export default memo(PrayerCluster);
