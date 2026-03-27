import { useControls } from 'leva';

import React, { useMemo } from 'react';

import { Environment, PerspectiveCamera } from '@react-three/drei';

import DUMPSTER_FIRE from '../../../../../presets/fire/dumpsterFire';
import { radians } from '../../../../../utils/math';
import Dumpster from '../../../../elements/dumpster/Dumpster';
import Smoke2D from '../../../../elements/smoke/Smoke2D';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import VolumetricSmokeParticles from '../../../../elements/smoke/VolumetricSmokeParticles';
import SplineLine from '../../../../elements/spline/SplineLine';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';

export default function DumpsterFire() {
  const { showSplines } = useControls(
    'Dumpster Fire',
    {
      showSplines: { label: 'Show Splines', value: false },
    },
    { collapsed: true }
  );

  const { fireSpline, volSmokeSpline, particleSmokeSpline } = useMemo(() => {
    const splines = DUMPSTER_FIRE.splines ?? [];
    return {
      fireSpline: splines.find((s) => s.name === 'Dumpster Core Fire'),
      volSmokeSpline: splines.find(
        (s) => s.name === 'Dumpster Plume Volumetric'
      ),
      particleSmokeSpline: splines.find(
        (s) => s.name === 'Dumpster Plume Particle'
      ),
    };
  }, []);
  const smokePoints = useMemo(
    () => volSmokeSpline?.points?.map((pt) => pt.position.clone()) ?? [],
    [volSmokeSpline]
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[1, 3, 14]} fov={50} />

      {/* White background */}
      <color attach="background" args={['#e8e8e8']} />
      <fog attach="fog" args={['#e8e8e8', 16, 35]} />

      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 3]} intensity={1.0} />

      {/* Dumpster — both lids open */}
      <Dumpster
        position={[-2, -1, 0]}
        rightLidRotation={-radians(521)}
        leftLidRotation={-radians(521)}
      />

      {/* Volumetric fire emerging from the dumpster opening */}
      <VolumetricFire
        position={fireSpline?.points?.[0]?.position?.toArray() ?? [-2, 0.5, 0]}
        width={fireSpline?.fireWidth ?? 0.9}
        height={fireSpline?.fireHeight ?? 1.2}
        depth={fireSpline?.fireDepth ?? 0.5}
        animated={fireSpline?.fireAnimated ?? true}
        animSpeed={fireSpline?.fireAnimSpeed ?? 0.5}
        brightness={fireSpline?.fireBrightness ?? 1.6}
        magnitude={fireSpline?.fireMagnitude ?? 1.4}
      />

      {/* Wispy 2D smoke at the fire source */}
      <Smoke2D
        position={[-1.6, 1.4, 0]}
        smoke={{ opacity: 0.3, height: 2.5, color: '#888', width: 0.35 }}
      />
      <Smoke2D
        position={[-2.3, 1.4, 0.1]}
        smoke={{ opacity: 0.25, height: 2.0, color: '#999', width: 0.3 }}
      />

      {/* Main smoke plume — two layers for depth and structure */}
      <VolumetricSmokeParticles points={smokePoints} config={volSmokeSpline} />
      <SmokeParticles points={smokePoints} config={particleSmokeSpline} />

      {/* Debug spline visualization */}
      <SplineLine
        points={smokePoints}
        tension={volSmokeSpline?.tension ?? 0.5}
        closed={volSmokeSpline?.closed ?? false}
        color="#ff4444"
        visible={showSplines}
        arcSegments={200}
      />

      <Environment preset="city" />
    </>
  );
}
