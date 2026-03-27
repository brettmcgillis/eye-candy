import React, { useMemo } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import STILL_PULLING_FOR_YOU_SMOKE from '../../../../../presets/smoke/stillPullingForYouSmoke';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import NurbsWaterColumn from '../../../../elements/water/NurbsWaterColumn';
import FloatingTugboat from './components/FloatingTugboat';
import Seafloor from './components/Seafloor';
import SinkingTugboat from './components/SinkingTugboat';
import useStillPullingForYouControls from './hooks/useStillPullingForYouControls';

// ── Main Scene ──────────────────────────────────────────────────────────────
export default function StillPullingForYou() {
  const config = useStillPullingForYouControls();

  const preset = useMemo(
    () => STILL_PULLING_FOR_YOU_SMOKE['Still Pulling For You'],
    []
  );

  const smokeSplines = useMemo(() => preset?.splines ?? [], [preset]);

  const globalSmokeConfig = useMemo(
    () => ({
      particleColor: config.particleColor,
      opacity: config.smokeOpacity,
      particleSize: config.particleSize,
      particleCount: config.particleCount,
      flowSpeed: config.flowSpeed,
      springK: config.springK,
      damping: config.damping,
      turbulence: config.turbulence,
      fadeRate: config.fadeRate,
      growth: config.growth,
      fadeExponent: config.fadeExponent,
    }),
    [
      config.particleColor,
      config.smokeOpacity,
      config.particleSize,
      config.particleCount,
      config.flowSpeed,
      config.springK,
      config.damping,
      config.turbulence,
      config.fadeRate,
      config.growth,
      config.fadeExponent,
    ]
  );

  const boatPosition = [config.boatX, config.boatY, config.boatZ];
  const boatRotation = [config.boatRotX, config.boatRotY, config.boatRotZ];
  const isOrbit = config.cameraMode === 'Orbit';
  const isFloating = config.boatMode === 'Floating';

  return (
    <>
      {/* Background */}
      <color attach="background" args={[config.backgroundColor]} />

      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[3, 2.5, 4]}
        fov={50}
        onUpdate={(c) => c.lookAt(0, 0, 0)}
      />
      {isOrbit && (
        <OrbitControls target={[0, 0, 0]} enableDamping dampingFactor={0.1} />
      )}

      {/* Lighting */}
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={config.mainLightIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <directionalLight
        position={[-3, 4, -2]}
        intensity={config.fillLightIntensity}
      />

      {/* Tugboat */}
      {isFloating ? (
        <FloatingTugboat
          scale={config.boatScale}
          floatDraft={config.floatDraft}
          waveHeight={config.waveHeight}
          waveChoppiness={config.waveChoppiness}
          waveSpeed={config.waveSpeed}
        />
      ) : (
        <SinkingTugboat
          position={boatPosition}
          rotation={boatRotation}
          scale={config.boatScale}
        />
      )}

      {/* Smoke splines from preset */}
      {config.smokeVisible &&
        smokeSplines.map((spline) => (
          <group
            key={spline.name}
            position={[
              config.smokeOffsetX,
              config.smokeOffsetY,
              config.smokeOffsetZ,
            ]}
          >
            <SmokeParticles points={spline.points} config={globalSmokeConfig} />
          </group>
        ))}

      {/* Bumpy seafloor beneath the water */}
      <Seafloor
        visible={config.seafloorVisible}
        color={config.seafloorColor}
        bumpHeight={config.bumpHeight}
        bumpFrequency={config.bumpFrequency}
        bumpDetail={config.bumpDetail}
      />

      {/* NURBS water column */}
      <NurbsWaterColumn
        width={4.0}
        depth={4.0}
        height={2.0}
        topColor={config.waterTopColor}
        bottomColor={config.waterBottomColor}
        opacity={config.waterOpacity}
        transmission={config.waterTransmission}
        roughness={config.waterRoughness}
        ior={config.waterIor}
        thickness={config.waterThickness}
        waveHeight={config.waveHeight}
        waveChoppiness={config.waveChoppiness}
        waveSpeed={config.waveSpeed}
        showEdges={false}
      />
    </>
  );
}
