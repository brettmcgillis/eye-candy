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
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import { getSplineWorldPoints } from '../../../../elements/splineGroup/splineDefaults';
import NurbsWaterColumn from '../../../../elements/water/NurbsWaterColumn';
import useNurbsWaterInteractionRuntime from '../../../../elements/water/waterInteraction';
import BloomFX from '../../../../postprocessing/webGPU/bloom/Bloom';
import CursorAttractor from './components/CursorAttractor';
import FlagCloth from './components/FlagCloth';
import FloatingTugboat from './components/FloatingTugboat';
import Seafloor from './components/Seafloor';
import SinkingTugboat from './components/SinkingTugboat';
import useRuntimeSmokeSplines from './hooks/useRuntimeSmokeSplines';
import useSceneControls, {
  DEFAULT_SPLINE_CONFIG,
} from './hooks/useSceneControls';

const SPLINE_GROUP_CONFIG = { pointMode: 'translate' };

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

  return sourceSplines.map((spline) => getSplineWorldPoints(spline));
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
    if (spline.type === 'Particle' || spline.type === 'Volumetric') {
      cfg.type = 'Smoke';
      cfg.smokeType = spline.type;
    }
    return cfg;
  });
}

// ── Main Scene ──────────────────────────────────────────────────────────────
export default function StillPullingForYouGPU() {
  const [splines, setSplines] = useState(() =>
    toRuntimeSplinePoints(DEFAULT_PRESET)
  );
  const attractorsRef = useRef([]);
  const flagAnchorRef = useRef();
  const flagClothRef = useRef();
  const smokeAnchorRef = useRef();
  const [flagPaused, setFlagPaused] = useState(false);

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
  const cursorAttractorFallbackPosition = useMemo(
    () => [boatPosition[0], -10, boatPosition[2]],
    [boatPosition[0], boatPosition[2]]
  );
  const isOrbit = config.cameraMode === 'Orbit';
  const isFloating = config.boatMode === 'Floating';
  const showFlagCloth = config.boatVisible && config.flagVisible;
  const waterInteraction = useNurbsWaterInteractionRuntime({
    depth: config.waterDepth,
    enabled: config.interactionEnabled,
    radius: config.interactionRadius,
    resolution: config.interactionResolution,
    rippleDepth: config.interactionDepth,
    viscosity: config.interactionViscosity,
    width: config.waterWidth,
  });

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

  const flagMountVersion = useMemo(
    () =>
      [
        config.preset,
        config.boatMode,
        config.boatScale,
        config.flagReverseWidth ? 'rev' : 'fwd',
      ].join('-'),
    [config.boatMode, config.boatScale, config.flagReverseWidth, config.preset]
  );

  useEffect(() => {
    setFlagPaused(false);
    if (!showFlagCloth) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      flagClothRef.current?.resetSim();
      if (!config.flagFreezeAfterMs) {
        setFlagPaused(config.flagPaused);
      }
    });

    if (config.flagFreezeAfterMs > 0) {
      const timeoutId = window.setTimeout(() => {
        setFlagPaused(true);
      }, config.flagFreezeAfterMs);

      return () => {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
      };
    }

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    config.flagFreezeAfterMs,
    config.flagPaused,
    flagMountVersion,
    showFlagCloth,
  ]);

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
          flagAnchorRef={flagAnchorRef}
          position={boatPosition}
          rotation={boatRotation}
          scale={config.boatScale}
          floatDraft={config.floatDraft}
          waveHeight={config.waveHeight}
          waveChoppiness={config.waveChoppiness}
          waveSpeed={config.waveSpeed}
          interactionRuntime={waterInteraction}
          tiltDamping={config.tiltDamping}
          lightConfig={lightConfig}
          showUpperDeckFlag={!showFlagCloth}
          smokeAnchorRef={smokeAnchorRef}
        />
      )}
      {config.boatVisible && !isFloating && (
        <SinkingTugboat
          flagAnchorRef={flagAnchorRef}
          position={boatPosition}
          rotation={boatRotation}
          scale={config.boatScale}
          lightConfig={lightConfig}
          showUpperDeckFlag={!showFlagCloth}
          smokeAnchorRef={smokeAnchorRef}
        />
      )}

      {showFlagCloth && (
        <FlagCloth
          ref={flagClothRef}
          key={[
            config.preset,
            config.boatMode,
            config.flagSegmentsX,
            config.flagSegmentsY,
            config.flagWidthScale,
            config.flagHeightScale,
          ].join('-')}
          flagAnchorRef={flagAnchorRef}
          mountVersion={flagMountVersion}
          widthScale={config.flagWidthScale}
          heightScale={config.flagHeightScale}
          reverseWidth={config.flagReverseWidth}
          segmentsX={config.flagSegmentsX}
          segmentsY={config.flagSegmentsY}
          color={config.flagColor}
          roughness={config.flagRoughness}
          metalness={config.flagMetalness}
          opacity={config.flagOpacity}
          gravity={config.flagGravity}
          wind={config.flagWind}
          windDirX={config.flagWindDirX}
          windDirZ={config.flagWindDirZ}
          stiffness={config.flagStiffness}
          dampening={config.flagDampening}
          maxVelocity={config.flagMaxVelocity}
          cursorCollider={config.flagCursorCollider}
          cursorRadius={config.flagCursorRadius}
          paused={flagPaused}
          waterContactEnabled={config.flagWaterContactEnabled}
          waterContactRadius={config.flagWaterContactRadius}
          waterContactPoints={config.flagWaterContactPoints}
          waterContactSpanStart={config.flagWaterContactSpanStart}
          waterContactSpanEnd={config.flagWaterContactSpanEnd}
          waterContactLift={config.flagWaterContactLift}
          interactionRuntime={waterInteraction}
          waveHeight={config.waveHeight}
          waveChoppiness={config.waveChoppiness}
          waveSpeed={config.waveSpeed}
        />
      )}

      <CursorAttractor
        attractorsRef={attractorsRef}
        enabled={config.cursorAttractorEnabled}
        mode={config.cursorAttractorMode}
        radius={config.cursorAttractorRadius}
        strength={config.cursorAttractorStrength}
        visible={config.showCursorAttractor}
        planeZ={boatPosition[2]}
        fallbackPosition={cursorAttractorFallbackPosition}
      />

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
            <SplineGroup
              key={index}
              index={index}
              points={pts}
              config={SPLINE_GROUP_CONFIG}
              splineConfig={{
                ...(config.splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG),
                showSpline: config.editSplines,
                showHelpers: config.editSplines,
              }}
              attractorsRef={attractorsRef}
              setSplinePoints={setSplinePoints}
              allowedTypes="smoke"
              splineColor="#ff4444"
              pointSize={0.15}
            />
          ))}
          {/* eslint-enable react/no-array-index-key */}
        </>
      )}

      {/* Water column — TSL MeshPhysicalNodeMaterial */}
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
          interactionRuntime={waterInteraction}
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
