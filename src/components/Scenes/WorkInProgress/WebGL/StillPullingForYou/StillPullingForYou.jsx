import * as THREE from 'three';

import React, { useCallback, useMemo, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import STILL_PULLING_FOR_YOU_SMOKE from '../../../../../presets/smoke/stillPullingForYouSmoke';
import NurbsWaterColumn from '../../../../elements/water/NurbsWaterColumn';
import WaterColorEffect from '../../../../postprocessing/webGL/waterColorEffect/WaterColorEffect';
import FloatingTugboat from './components/FloatingTugboat';
import Seafloor from './components/Seafloor';
import SinkingTugboat from './components/SinkingTugboat';
import SmokeSplineGroup from './components/SmokeSplineGroup';
import useStillPullingForYouControls, {
  DEFAULT_SPLINE_CONFIG,
} from './hooks/useStillPullingForYouControls';

const DEFAULT_PRESET = STILL_PULLING_FOR_YOU_SMOKE['Still Pulling For You'];

function toRuntimeSplinePoints(preset) {
  let sourceSplines = [];
  if (Array.isArray(preset?.splines)) {
    sourceSplines = preset.splines;
  } else if (preset?.points) {
    sourceSplines = [preset];
  }

  return sourceSplines.map((spline) =>
    spline.points.map((pt) => ({
      position: pt.position.clone(),
      rotation: pt.rotation ? pt.rotation.clone() : new THREE.Euler(0, 0, 0),
      scale: pt.scale ? pt.scale.clone() : new THREE.Vector3(1, 1, 1),
    }))
  );
}

function toRuntimeSplineConfigs(preset) {
  let sourceSplines = [];
  if (Array.isArray(preset?.splines)) {
    sourceSplines = preset.splines;
  } else if (preset?.points) {
    sourceSplines = [preset];
  }

  const configKeys = Object.keys(DEFAULT_SPLINE_CONFIG);
  return sourceSplines.map((spline) => {
    const cfg = { ...DEFAULT_SPLINE_CONFIG };
    configKeys.forEach((key) => {
      if (key in spline) cfg[key] = spline[key];
    });
    return cfg;
  });
}

// ── Main Scene ──────────────────────────────────────────────────────────────
export default function StillPullingForYou() {
  const [splines, setSplines] = useState(() =>
    toRuntimeSplinePoints(DEFAULT_PRESET)
  );

  const [initialSplineConfigs] = useState(() =>
    toRuntimeSplineConfigs(DEFAULT_PRESET)
  );

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  const config = useStillPullingForYouControls(
    splines,
    setSplines,
    initialSplineConfigs
  );

  const boatPosition = [
    config.boatPosition.x,
    config.boatPosition.y,
    config.boatPosition.z,
  ];
  const boatRotation = [
    config.boatRotation.x,
    config.boatRotation.y,
    config.boatRotation.z,
  ];
  const isOrbit = config.cameraMode === 'Orbit';
  const isFloating = config.boatMode === 'Floating';

  // Responsive camera: pull back on narrow (mobile) viewports
  const size = useThree((state) => state.size);
  const cameraPosition = useMemo(() => {
    const aspect = size.width / size.height;
    const scale = Math.max(1, 1 / aspect);
    return [4.5 * scale, 3.5 * scale, 6 * scale];
  }, [size.width, size.height]);

  const lightConfig = {
    lightDebug: config.lightDebug,
    headlightVisible: config.headlightVisible,
    headlightX: config.headlightX,
    headlightY: config.headlightY,
    headlightZ: config.headlightZ,
    headlightIntensity: config.headlightIntensity,
    headlightDistance: config.headlightDistance,
    headlightColor: config.headlightColor,
    cabinVisible: config.cabinVisible,
    cabinX: config.cabinX,
    cabinY: config.cabinY,
    cabinZ: config.cabinZ,
    cabinIntensity: config.cabinIntensity,
    cabinDistance: config.cabinDistance,
    cabinColor: config.cabinColor,
    headlightMode: config.headlightMode,
    cabinMode: config.cabinMode,
  };

  return (
    <>
      {/* Background */}
      <color attach="background" args={[config.backgroundColor]} />

      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={50}
        onUpdate={(c) => c.lookAt(0, 0, 0)}
      />
      {isOrbit && (
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.1}
        />
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
      {config.boatVisible && isFloating && (
        <FloatingTugboat
          position={boatPosition}
          rotation={boatRotation}
          scale={config.boatScale}
          floatDraft={config.floatDraft}
          waveHeight={config.waveHeight}
          waveChoppiness={config.waveChoppiness}
          waveSpeed={config.waveSpeed}
          tiltDamping={config.tiltDamping}
          lightConfig={lightConfig}
        />
      )}
      {config.boatVisible && !isFloating && (
        <SinkingTugboat
          position={boatPosition}
          rotation={boatRotation}
          scale={config.boatScale}
          lightConfig={lightConfig}
        />
      )}

      {/* Smoke splines — editable */}
      {config.smokeVisible && (
        <>
          {/* eslint-disable react/no-array-index-key */}
          {splines.map((points, index) => (
            <SmokeSplineGroup
              key={index}
              index={index}
              points={points}
              splineConfig={config.splineConfigs[index] ?? {}}
              editSplines={config.editSplines}
              setSplinePoints={setSplinePoints}
            />
          ))}
          {/* eslint-enable react/no-array-index-key */}
        </>
      )}

      {/* Bumpy seafloor beneath the water */}
      <Seafloor
        visible={config.seafloorVisible}
        color={config.seafloorColor}
        bumpHeight={config.bumpHeight}
        bumpFrequency={config.bumpFrequency}
        bumpDetail={config.bumpDetail}
      />

      {/* NURBS water column */}
      {config.waterVisible && (
        <NurbsWaterColumn
          width={config.waterWidth}
          depth={config.waterDepth}
          height={config.waterHeight}
          segments={config.waterSegments}
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
          showEdges={config.waterShowEdges}
          edgeColor={config.waterEdgeColor}
          edgeOpacity={config.waterEdgeOpacity}
        />
      )}
      {/* Post Processing */}
      {config.painterlyEnabled && (
        <WaterColorEffect
          radius={config.painterlyRadius}
          alpha={config.painterlyAlpha}
          quantizeLevels={config.painterlyQuantize}
          saturation={config.painterlySaturation}
          paperStrength={config.painterlyPaper}
          outlineEnabled={config.outlineEnabled}
          outlineStrength={config.outlineStrength}
          outlineThreshold={config.outlineThreshold}
          outlineSoftness={config.outlineSoftness}
          hatchingEnabled={config.hatchingEnabled}
          hatchScale={config.hatchScale}
          hatchIntensity={config.hatchIntensity}
          hatchThickness={config.hatchThickness}
          hatchRotation={config.hatchRotation}
          bloomEnabled={config.bloomEnabled}
          bloomIntensity={config.bloomIntensity}
        />
      )}
      {!config.painterlyEnabled && config.bloomEnabled && (
        <EffectComposer disableNormalPass>
          <Bloom
            intensity={config.bloomIntensity}
            luminanceThreshold={config.bloomLuminanceThreshold}
            luminanceSmoothing={config.bloomLuminanceSmoothing}
            mipmapBlur
            radius={config.bloomRadius}
          />
        </EffectComposer>
      )}
    </>
  );
}
