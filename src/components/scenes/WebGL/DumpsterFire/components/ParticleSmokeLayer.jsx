import React from 'react';

import SmokeParticles from '@elements/smoke/SmokeParticles';
import SmokeVolumeMesh from '@elements/smoke/SmokeVolumeMesh';
import VolumetricSmokeParticles from '@elements/smoke/VolumetricSmokeParticles';
import SplineLine from '@elements/spline/SplineLine';
import SplinePoints from '@elements/spline/SplinePoints';

import { SCENE_ROOT_POSITION } from '../utils/sceneData';

export default function ParticleSmokeLayer({
  splines,
  splineConfigs,
  showEffects,
  editSplines,
  setParticleSmokePoints,
  attractorsRef,
}) {
  if (!splines.length) {
    return null;
  }

  return (
    <group
      position={SCENE_ROOT_POSITION}
      name="dumpster-fire-particle-smoke-layer"
    >
      {splines.map((spline, index) => {
        const splineConfig = splineConfigs[index] ?? {};
        const isVisible = splineConfig.visible ?? true;
        const smokeType = splineConfig.smokeType ?? 'Particle';
        const systemAttractorsRef =
          splineConfig.enableAttractors === false ? null : attractorsRef;
        const points = spline.points ?? [];
        const positions = points.map((point) => point.position);
        const rotations = points.map((point) => point.rotation);
        const scales = points.map((point) => point.scale);
        const showParticleSmoke =
          showEffects &&
          isVisible &&
          (smokeType === 'Particle' || smokeType === 'Both');
        const showVolumetricSmoke =
          showEffects &&
          isVisible &&
          (smokeType === 'Volumetric' || smokeType === 'Both');
        const smokeColor =
          splineConfig.particleColor ?? splineConfig.volColor ?? '#a08b7f';
        const mergedConfig = {
          ...splineConfig,
          pointMode: spline.pointMode ?? 'translate',
        };

        return (
          <group
            key={`${splineConfig.name ?? 'particle-smoke'}-${(
              spline.pos ?? []
            ).join('-')}`}
            position={spline.pos}
            rotation={spline.rot}
            scale={spline.scale}
          >
            {showParticleSmoke ? (
              <SmokeParticles
                key={`${splineConfig.name ?? 'particle-smoke'}-${(
                  spline.pos ?? []
                ).join('-')}-${
                  mergedConfig.prefillOnStart === false ? 'queued' : 'prefilled'
                }`}
                points={positions}
                pointRotations={rotations}
                pointScales={scales}
                config={mergedConfig}
                attractorsRef={systemAttractorsRef}
              />
            ) : null}

            {showVolumetricSmoke ? (
              <VolumetricSmokeParticles
                points={positions}
                pointRotations={rotations}
                pointScales={scales}
                config={mergedConfig}
                attractorsRef={systemAttractorsRef}
              />
            ) : null}

            {showEffects && isVisible && splineConfig.showSmokeVolume ? (
              <SmokeVolumeMesh
                points={positions}
                pointRotations={rotations}
                pointScales={scales}
                tension={splineConfig.tension}
                closed={splineConfig.closed}
                spread={
                  Math.max(
                    splineConfig.spawnSpread ?? 0,
                    splineConfig.volSpread ?? 0
                  ) || 120
                }
              />
            ) : null}

            <SplineLine
              points={positions}
              tension={splineConfig.tension}
              closed={splineConfig.closed}
              curveType="catmullrom"
              color={smokeColor}
              visible={editSplines && isVisible && splineConfig.showSpline}
              arcSegments={splineConfig.arcSegments}
            />

            <SplinePoints
              points={points}
              setPoints={(updater) => setParticleSmokePoints(index, updater)}
              visible={editSplines && isVisible && splineConfig.showHelpers}
              mode={spline.pointMode ?? 'translate'}
              pointSize={0.15}
            />
          </group>
        );
      })}
    </group>
  );
}
