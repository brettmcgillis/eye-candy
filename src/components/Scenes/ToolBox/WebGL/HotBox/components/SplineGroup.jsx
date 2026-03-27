import * as THREE from 'three';

import React, { useCallback, useMemo } from 'react';

import SmokeParticles from '../../../../../elements/smoke/SmokeParticles';
import SmokeVolumeMesh from '../../../../../elements/smoke/SmokeVolumeMesh';
import VolumetricSmokeParticles from '../../../../../elements/smoke/VolumetricSmokeParticles';
import SplineLine from '../../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../../elements/spline/SplinePoints';
import VolumetricFire from '../../../../../elements/volumetricFire/VolumetricFire';
import VolumetricFire2 from '../../../../../elements/volumetricFire/VolumetricFire2';

function FireFromSpline({ points, config, showVolume }) {
  const fireControlPoints = useMemo(
    () =>
      points.map((pt) => ({
        pos: pt.position.clone(),
        scale: new THREE.Vector3(
          config.fireWidth * (pt.scale?.x ?? 1),
          pt.scale?.y ?? 1,
          config.fireDepth * (pt.scale?.z ?? 1)
        ),
        rot: new THREE.Quaternion().setFromEuler(pt.rotation),
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
      showVolume={showVolume}
    />
  );
}

function Fire2FromSpline({ points, config, showVolume }) {
  const curvePoints = useMemo(
    () =>
      points.map((pt) => ({
        pos: pt.position.clone(),
        scale: new THREE.Vector3(
          config.fireWidth * (pt.scale?.x ?? 1),
          pt.scale?.y ?? 1,
          config.fireDepth * (pt.scale?.z ?? 1)
        ),
        rot: pt.rotation.clone(),
      })),
    [points, config.fireWidth, config.fireDepth]
  );

  return (
    <VolumetricFire2
      curvePoints={curvePoints}
      width={config.fireWidth}
      depth={config.fireDepth}
      sliceSpacing={config.fireSliceSpacing}
      magnitude={config.fireMagnitude}
      lacunarity={config.fireLacunarity}
      gain={config.fireGain}
      tintColor={config.fireTintColor}
      saturation={config.fireSaturation}
      brightness={config.fireBrightness}
      curveAutoRotate={config.fire2AutoRotate}
      curveAutoTaper={config.fire2AutoTaper}
      curveTaperAmount={config.fire2TaperAmount}
      showCurve={config.fire2ShowCurve}
      showVolume={showVolume}
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

  const positions = useMemo(() => points.map((pt) => pt.position), [points]);
  const rotations = useMemo(() => points.map((pt) => pt.rotation), [points]);
  const scales = useMemo(() => points.map((pt) => pt.scale), [points]);

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
  const { fireType = 'Classic' } = splineConfig;

  return (
    <>
      <SplinePoints
        points={points}
        setPoints={setPoints}
        visible={splineConfig.showHelpers}
        mode={config.pointMode}
      />

      <SplineLine
        points={positions}
        tension={splineConfig.tension}
        closed={splineConfig.closed}
        curveType="catmullrom"
        color="#aaaaaa"
        visible={splineConfig.showSpline}
        arcSegments={splineConfig.arcSegments}
      />

      {isSmoke &&
        config.showSmoke &&
        (smokeType === 'Particle' || smokeType === 'Both') && (
          <SmokeParticles
            points={positions}
            pointRotations={rotations}
            pointScales={scales}
            config={mergedConfig}
            attractorsRef={attractorsRef}
          />
        )}

      {isSmoke &&
        config.showSmoke &&
        (smokeType === 'Volumetric' || smokeType === 'Both') && (
          <VolumetricSmokeParticles
            points={positions}
            pointRotations={rotations}
            pointScales={scales}
            config={mergedConfig}
            attractorsRef={attractorsRef}
          />
        )}

      {isSmoke && config.showSmokeVolume && (
        <SmokeVolumeMesh
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          tension={splineConfig.tension}
          closed={splineConfig.closed}
          spread={
            Math.max(config.spawnSpread ?? 0, config.volSpread ?? 0) || 120
          }
        />
      )}

      {/* Fire rendering — gated by global toggle + per-spline type */}
      {isFire &&
        config.showFire &&
        (fireType === 'Classic' || fireType === 'Both') && (
          <FireFromSpline
            points={points}
            config={config}
            showVolume={config.showFireVolume}
          />
        )}

      {isFire &&
        config.showFire &&
        (fireType === 'Curve' || fireType === 'Both') && (
          <Fire2FromSpline
            points={points}
            config={config}
            showVolume={config.showFireVolume}
          />
        )}
    </>
  );
}
