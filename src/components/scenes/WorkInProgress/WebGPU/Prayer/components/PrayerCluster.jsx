import React, { memo, useEffect, useMemo } from 'react';

import createHandsMaterial from '../utils/createHandsMaterial';
import PrayerHands from './PrayerHands';

function resolveMaterial(selection, materials) {
  return materials[selection] || materials.clean;
}

// Compose the global hands orientation with a shell's own yaw.
function shellRotation(handsRotation, yaw) {
  const base = handsRotation || [0, 0, 0];
  return [base[0], base[1] + (yaw || 0), base[2]];
}

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

  const bloodFadeMaterial = useMemo(() => {
    return createHandsMaterial({
      baseColor: config.bloodFadeBaseColor,
      accentColor: config.bloodFadeAccentColor,
      amount: config.bloodFadeAmount,
      scale: config.bloodFadeScale,
      iterations: config.bloodFadeIterations,
      noise: config.bloodFadeNoise,
      noiseScale: config.bloodFadeNoiseScale,
      seed: config.bloodFadeSeed,
      metalness: config.bloodFadeMetalness,
      roughness: config.bloodFadeRoughness,
      gradientTipColor: config.bloodFadeTipColor,
      gradientWristColor: config.bloodFadeWristColor,
      gradientStart: config.bloodFadeGradientStart,
      gradientEnd: config.bloodFadeGradientEnd,
    });
  }, [
    config.bloodFadeAccentColor,
    config.bloodFadeAmount,
    config.bloodFadeBaseColor,
    config.bloodFadeGradientEnd,
    config.bloodFadeGradientStart,
    config.bloodFadeIterations,
    config.bloodFadeMetalness,
    config.bloodFadeNoise,
    config.bloodFadeNoiseScale,
    config.bloodFadeRoughness,
    config.bloodFadeScale,
    config.bloodFadeSeed,
    config.bloodFadeTipColor,
    config.bloodFadeWristColor,
  ]);

  useEffect(() => {
    return () => {
      cleanMaterial.dispose();
      oilMaterial.dispose();
      bloodMaterial.dispose();
      bloodFadeMaterial.dispose();
    };
  }, [bloodFadeMaterial, bloodMaterial, cleanMaterial, oilMaterial]);

  const materials = useMemo(() => {
    return {
      clean: cleanMaterial,
      oil: oilMaterial,
      blood: bloodMaterial,
      bloodFade: bloodFadeMaterial,
    };
  }, [bloodFadeMaterial, bloodMaterial, cleanMaterial, oilMaterial]);

  return (
    <group>
      {config.baseVisible && (
        <PrayerHands
          demographic={config.baseDemographic}
          pose={config.basePose}
          material={resolveMaterial(config.baseMaterial, materials)}
          withGradient={config.baseMaterial === 'bloodFade'}
          scale={config.baseScale}
          spread={config.baseSpread}
          spreadAxis={config.spreadAxis}
          position={config.basePosition}
          rotation={shellRotation(config.handsRotation, config.baseYaw)}
        />
      )}

      {config.middleVisible && (
        <PrayerHands
          demographic={config.middleDemographic}
          pose={config.middlePose}
          material={resolveMaterial(config.middleMaterial, materials)}
          withGradient={config.middleMaterial === 'bloodFade'}
          scale={config.middleScale}
          spread={config.middleSpread}
          spreadAxis={config.spreadAxis}
          position={config.middlePosition}
          rotation={shellRotation(config.handsRotation, config.middleYaw)}
        />
      )}

      {config.outerVisible && (
        <PrayerHands
          demographic={config.outerDemographic}
          pose={config.outerPose}
          material={resolveMaterial(config.outerMaterial, materials)}
          withGradient={config.outerMaterial === 'bloodFade'}
          scale={config.outerScale}
          spread={config.outerSpread}
          spreadAxis={config.spreadAxis}
          position={config.outerPosition}
          rotation={shellRotation(config.handsRotation, config.outerYaw)}
        />
      )}
    </group>
  );
}

export default memo(PrayerCluster);
