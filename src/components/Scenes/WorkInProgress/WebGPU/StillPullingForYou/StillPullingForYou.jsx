import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import STILL_PULLING_FOR_YOU_SMOKE from '../../../../../presets/smoke/stillPullingForYouSmoke';
import NurbsWaterColumnGPU from '../../../../elements/water/NurbsWaterColumnGPU';
import BloomFX from '../../../../postprocessing/webGPU/bloom/Bloom';
import FloatingTugboat from './components/FloatingTugboat';
import Seafloor from './components/Seafloor';
import SinkingTugboat from './components/SinkingTugboat';
import SmokeSplineGroupGPU from './components/SmokeSplineGroupGPU';
import useRuntimeSmokeSplines from './hooks/useRuntimeSmokeSplines';
import useSceneControls, {
  DEFAULT_SPLINE_CONFIG,
} from './hooks/useSceneControls';

const DEFAULT_PRESET =
  STILL_PULLING_FOR_YOU_SMOKE['Still Pulling'] ||
  STILL_PULLING_FOR_YOU_SMOKE['Still Pulling For You'];

function getSmokePreset(presetName) {
  return STILL_PULLING_FOR_YOU_SMOKE[presetName] || DEFAULT_PRESET;
}

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
export default function StillPullingForYouGPU() {
  const [splines, setSplines] = useState(() =>
    toRuntimeSplinePoints(DEFAULT_PRESET)
  );
  const smokeAnchorRef = useRef();

  const [initialSplineConfigs] = useState(() =>
    toRuntimeSplineConfigs(DEFAULT_PRESET)
  );

  // setSplinePoints kept so the controls hook can wire spline editing; smoke
  // won't render but the controls panel remains functional for future use.
  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  const config = useSceneControls(splines, setSplines, initialSplineConfigs);

  useEffect(() => {
    setSplines(toRuntimeSplinePoints(getSmokePreset(config.preset)));
  }, [config.preset]);

  const renderSplines = useRuntimeSmokeSplines({
    splines,
    smokeAnchorRef,
    presetName: config.preset,
  });

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
    sparklesVisible: config.sparklesVisible,
    sparklesCount: config.sparklesCount,
    sparklesSize: config.sparklesSize,
    sparklesSpeed: config.sparklesSpeed,
    sparklesScale: config.sparklesScale,
    sparklesColor: config.sparklesColor,
    sparklesIntensity: config.sparklesIntensity,
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
          smokeAnchorRef={smokeAnchorRef}
        />
      )}
      {config.boatVisible && !isFloating && (
        <SinkingTugboat
          position={boatPosition}
          rotation={boatRotation}
          scale={config.boatScale}
          lightConfig={lightConfig}
          smokeAnchorRef={smokeAnchorRef}
        />
      )}

      {/* Seafloor — MeshStandardMaterial, WebGPU compatible */}
      <Seafloor
        visible={config.seafloorVisible}
        color={config.seafloorColor}
        bumpHeight={config.bumpHeight}
        bumpFrequency={config.bumpFrequency}
        bumpDetail={config.bumpDetail}
      />

      {/* Smoke splines — TSL PointsNodeMaterial */}
      {config.smokeVisible && (
        <>
          {/* eslint-disable react/no-array-index-key */}
          {renderSplines.map((pts, index) => (
            <SmokeSplineGroupGPU
              key={index}
              index={index}
              points={pts}
              splineConfig={
                config.splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG
              }
              editSplines={config.editSplines}
              setSplinePoints={setSplinePoints}
            />
          ))}
          {/* eslint-enable react/no-array-index-key */}
        </>
      )}

      {/* Water column — TSL MeshPhysicalNodeMaterial */}
      {config.waterVisible && (
        <NurbsWaterColumnGPU
          width={config.waterWidth}
          depth={config.waterDepth}
          height={config.waterHeight}
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
          edgeColor={config.waterEdgeColor}
          edgeOpacity={config.waterEdgeOpacity}
          showEdges={config.waterShowEdges}
        />
      )}

      {/* Post Processing — WebGPU-native bloom via TSL */}
      {config.bloomEnabled && (
        <BloomFX
          threshold={0.6}
          strength={config.bloomIntensity}
          radius={config.bloomRadius}
        />
      )}
    </>
  );
}
