import * as THREE from 'three';

import React, { useCallback, useMemo } from 'react';

import SmokeParticles from '../smoke/SmokeParticles';
import SmokeVolumeMesh from '../smoke/SmokeVolumeMesh';
import VolumetricSmokeParticles from '../smoke/VolumetricSmokeParticles';
import SplineLine from '../spline/SplineLine';
import SplinePoints from '../spline/SplinePoints';
import CS184VolumetricFire from '../volumetricFire/CS184VolumetricFire';
import FireballVolume from '../volumetricFire/FireballVolume';
import VolumetricFire from '../volumetricFire/VolumetricFire';

// ─── Fire sub-renderers ───────────────────────────────────────────────────────

function FireFromSpline({ points, config, showVolume }) {
  const controlPoints = useMemo(
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
      controlPoints={controlPoints}
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

function CS184FireFromSpline({ points, config }) {
  const controlPoints = useMemo(
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
    <CS184VolumetricFire
      controlPoints={controlPoints}
      magnitude={config.cs184Magnitude}
      lacunarity={config.cs184Lacunarity}
      gain={config.cs184Gain}
      speed={config.cs184Speed}
      density={config.cs184Density}
      brightness={config.cs184Brightness}
      saturation={config.cs184Saturation}
      tintColor={config.cs184TintColor}
      coreColor={config.cs184CoreColor}
      borderColor={config.cs184BorderColor}
      smokeColor={config.cs184SmokeColor}
      emberDensity={config.cs184EmberDensity}
      emberSize={config.cs184EmberSize}
      emberColor={config.cs184EmberColor}
      steps={config.cs184Steps}
      stepSize={config.cs184StepSize}
      animated={config.cs184Animated}
      animSpeed={config.cs184AnimSpeed}
    />
  );
}

// Renders one FireballVolume per control point, sized by point scale.x.
function FireballFromSpline({ points, config }) {
  return (
    <>
      {points.map((pt, i) => (
        <FireballVolume
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          position={pt.position}
          radius={config.fireballRadius * (pt.scale?.x ?? 1)}
          rotSpeed={config.fireballRotSpeed}
          noiseScale={config.fireballNoiseScale}
          coreColor={config.fireballCoreColor}
          coreIntensity={config.fireballCoreIntensity}
          edgeColor={config.fireballEdgeColor}
          edgeIntensity={config.fireballEdgeIntensity}
          density={config.fireballDensity}
          steps={config.fireballSteps}
        />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Canonical shared SplineGroup used by SmokeTest, FireTest, and HotBox.
 *
 * Props:
 *   index          — spline index (used for TransformControls key)
 *   points         — array of { position, rotation, scale }
 *   config         — scene-level config (pointMode, etc.)
 *   splineConfig   — per-spline config (type, smokeType, fireType, all params)
 *   attractorsRef  — optional ref to attractors array
 *   setSplinePoints — (index, updater) => void
 */
export default function SplineGroup({
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

  const mergedConfig = useMemo(
    () => ({ ...config, ...splineConfig }),
    [config, splineConfig]
  );

  if (!splineConfig.visible) return null;

  const isFire = splineConfig.type === 'Fire';
  const isSmoke = splineConfig.type === 'Smoke';
  const { smokeType = 'Particle', fireType = 'Classic' } = splineConfig;

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

      {isSmoke && smokeType === 'Particle' && (
        <SmokeParticles
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          config={mergedConfig}
          attractorsRef={attractorsRef}
        />
      )}

      {isSmoke && smokeType === 'Volumetric' && (
        <VolumetricSmokeParticles
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          config={mergedConfig}
          attractorsRef={attractorsRef}
        />
      )}

      {isSmoke && splineConfig.showSmokeVolume && (
        <SmokeVolumeMesh
          points={positions}
          pointRotations={rotations}
          pointScales={scales}
          tension={splineConfig.tension}
          closed={splineConfig.closed}
          spread={
            Math.max(
              mergedConfig.spawnSpread ?? 0,
              mergedConfig.volSpread ?? 0
            ) || 120
          }
        />
      )}

      {isFire && fireType === 'Classic' && (
        <FireFromSpline
          points={points}
          config={mergedConfig}
          showVolume={splineConfig.showFireVolume}
        />
      )}

      {isFire && fireType === 'RayMarch' && (
        <CS184FireFromSpline points={points} config={mergedConfig} />
      )}

      {isFire && fireType === 'Fireball' && (
        <FireballFromSpline points={points} config={mergedConfig} />
      )}
    </>
  );
}
