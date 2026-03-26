import * as THREE from 'three';

import React, { useCallback, useMemo } from 'react';

import SmokeParticles from '../../../../../elements/smoke/SmokeParticles';
import VolumetricSmokeParticles from '../../../../../elements/smoke/VolumetricSmokeParticles';
import SplineLine from '../../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../../elements/spline/SplinePoints';
import VolumetricFire from '../../../../../elements/volumetricFire/VolumetricFire';

function FireFromSpline({ points, config }) {
  const fireControlPoints = useMemo(
    () =>
      points.map((p) => ({
        pos: p.clone(),
        scale: new THREE.Vector3(config.fireWidth, 1, config.fireDepth),
        rot: new THREE.Quaternion(),
      })),
    [points, config.fireWidth, config.fireDepth]
  );

  return (
    <VolumetricFire
      controlPoints={fireControlPoints}
      sliceSpacing={config.fireSliceSpacing}
      magnitude={config.fireMagnitude}
      lacunarity={config.fireLacunarity}
      gain={config.fireGain}
      tintColor={config.fireTintColor}
      saturation={config.fireSaturation}
      brightness={config.fireBrightness}
      animated={config.fireAnimated}
      animSpeed={config.fireAnimSpeed}
    />
  );
}

export default function HotBoxSplineGroup({
  index,
  points,
  config,
  splineConfig,
  attractorsRef,
  setSplinePoints,
}) {
  const setPoints = useCallback(
    (updater) => setSplinePoints(index, updater),
    [index, setSplinePoints]
  );

  // Merge per-spline settings into config for smoke components
  const mergedConfig = useMemo(
    () => ({
      ...config,
      tension: splineConfig.tension,
      closed: splineConfig.closed,
      arcSegments: splineConfig.arcSegments,
    }),
    [
      config,
      splineConfig.tension,
      splineConfig.closed,
      splineConfig.arcSegments,
    ]
  );

  if (!splineConfig.visible) return null;

  const isFire = splineConfig.type === 'Fire';
  const isSmoke = splineConfig.type === 'Smoke';
  const { smokeType = 'Both' } = splineConfig;

  return (
    <>
      <SplinePoints
        points={points}
        setPoints={setPoints}
        visible={splineConfig.showHelpers}
      />

      <SplineLine
        points={points}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="catmullrom"
        color="#aaaaaa"
        visible={splineConfig.showSpline}
        arcSegments={splineConfig.arcSegments}
      />

      {/* Smoke rendering — gated by global toggle + per-spline type & smokeType */}
      {isSmoke &&
        config.showSmoke &&
        (smokeType === 'Particle' || smokeType === 'Both') && (
          <SmokeParticles
            points={points}
            config={mergedConfig}
            attractorsRef={attractorsRef}
          />
        )}

      {isSmoke &&
        config.showSmoke &&
        (smokeType === 'Volumetric' || smokeType === 'Both') && (
          <VolumetricSmokeParticles
            points={points}
            config={mergedConfig}
            attractorsRef={attractorsRef}
          />
        )}

      {/* Fire rendering — gated by global toggle + per-spline type */}
      {isFire && config.showFire && (
        <FireFromSpline points={points} config={config} />
      )}
    </>
  );
}
