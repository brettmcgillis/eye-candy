import React, { useEffect, useMemo, useRef } from 'react';

import {
  Environment,
  Float,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import getColorsInRange from '../../../../../utils/colors';
import { radians } from '../../../../../utils/math';
import { useSkullControls } from '../../../../elements/skull/SkullControls';
import { GridHelper, PolarGridHelper } from '../../../../rigging/GridHelper';
import HaloDisplay from './components/HaloDisplay';
import SceneCloud from './components/SceneCloud';
import SceneFemur from './components/SceneFemur';
import SceneSkull from './components/SceneSkull';
import useHaloAnimation from './useHaloAnimation';
import useSceneControls from './hooks/useSceneControls';
import { HALO_PRESET_ORDER, PRESETS } from './presets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRingsConfig(c) {
  const width = c.ringsOuterRadius - c.ringsInnerRadius;

  if (c.ringsStyle === 'gradient') {
    const gradientColors = getColorsInRange(
      c.ringsStart,
      c.ringsEnd,
      c.ringsSteps
    ).map((v) => ({ width: width / c.ringsSteps, color: v }));
    return { innerRadius: c.ringsInnerRadius, rings: gradientColors };
  }

  const colors = [
    { width: c.ringsLg, color: c.ringsSilver },
    { width: c.ringsSm, color: c.ringsBlack },
    { width: c.ringsMed, color: c.ringsWhite },
    { width: c.ringsXl, color: c.ringsBlack },
    { width: c.ringsXl, color: c.ringsBlue },
    { width: c.ringsXl, color: c.ringsLightblue },
    { width: c.ringsSm, color: c.ringsBlack },
    { width: c.ringsLg, color: c.ringsSilver },
  ];
  const totalWidthRatio = colors.reduce((t, r) => t + r.width, 0);
  const rings = colors.map((r) => ({
    ...r,
    width: Math.round(((r.width / totalWidthRatio) * width) * 100) / 100,
  }));
  return { innerRadius: c.ringsInnerRadius, rings };
}

function buildNetworkConfig(c) {
  return {
    shape: 'ring',
    innerDiameter: 3,
    outerDiameter: 7,
    height: 0.2,
    networkWidth: 7,
    networkHeight: 3,
    networkDepth: 7,
    particleCount: c.networkParticleCount,
    maxParticleCount: 1000,
    minConnections: 1,
    maxConnections: 8,
    minDistance: 0.2,
    maxDistance: c.networkMaxDistance,
    pointColor: c.networkPointColor,
    lineColor: c.networkLineColor,
    pointSize: c.networkPointSize,
    pointBlending: 'normal',
    pointsToneMapped: false,
    pointsTransparent: true,
    pointsOpacity: 1,
    lineWidth: 1,
    linesToneMapped: false,
    linesTransparent: true,
    linesOpacity: 1,
    lineBlending: 'normal',
    timeScale: c.networkTimeScale,
    angularSpeed: c.networkAngularSpeed,
    radialSpeed: 1,
    verticalSpeed: 1,
    systemRotation: 1,
  };
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export default function AllMyThoughtsAreSoCumulus() {
  const { controls: c, setControls, controlsSnapshotRef } = useSceneControls();

  // Keep snapshot current for the Leva copy button
  controlsSnapshotRef.current = c;

  // Skull bone-visibility controls (own Leva panel)
  const skullControls = useSkullControls({
    controlName: 'Skull Settings',
    collapsed: true,
    cranium: {
      showRightParietal: false,
      showRightTemporal: false,
      showTeeth: false,
      showLeftParietal: false,
      showLeftTemporal: false,
    },
    mandible: { showMandible: false },
  });

  // Halo animation ref — attached to the outer group in HaloDisplay
  const haloAnimRef = useHaloAnimation({
    animate: c.animate,
    speed: c.speed,
    wobble: c.wobble,
    wobbleSpeed: c.wobbleSpeed,
    wobbleAngle: c.wobbleAngle,
  });

  // ---------------------------------------------------------------------------
  // Halo scroll mode — wheel cycles through presets
  // ---------------------------------------------------------------------------
  const presetIndexRef = useRef(HALO_PRESET_ORDER.indexOf(c.preset));

  useEffect(() => {
    presetIndexRef.current = HALO_PRESET_ORDER.indexOf(c.preset);
  }, [c.preset]);

  useEffect(() => {
    if (!c.haloScrollEnabled) return undefined;

    function handleWheel(e) {
      const dir = e.deltaY > 0 ? 1 : -1;
      presetIndexRef.current =
        (presetIndexRef.current + dir + HALO_PRESET_ORDER.length) %
        HALO_PRESET_ORDER.length;
      const nextPreset = HALO_PRESET_ORDER[presetIndexRef.current];
      setControls({ preset: nextPreset, ...PRESETS[nextPreset] });
    }

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [c.haloScrollEnabled, setControls]);

  // ---------------------------------------------------------------------------
  // Stable memoized props for memoized child components
  // ---------------------------------------------------------------------------

  const haloPos = useMemo(
    () => [c.haloPosition.x, c.haloPosition.y, c.haloPosition.z],
    [c.haloPosition.x, c.haloPosition.y, c.haloPosition.z]
  );
  const haloRot = useMemo(
    () => [
      radians(c.haloRotation.x),
      radians(c.haloRotation.y),
      radians(c.haloRotation.z),
    ],
    [c.haloRotation.x, c.haloRotation.y, c.haloRotation.z]
  );

  const ringsConfig = useMemo(() => buildRingsConfig(c), [
    c.ringsStyle,
    c.ringsInnerRadius,
    c.ringsOuterRadius,
    c.ringsStart,
    c.ringsEnd,
    c.ringsSteps,
    c.ringsSm,
    c.ringsMed,
    c.ringsLg,
    c.ringsXl,
    c.ringsSilver,
    c.ringsWhite,
    c.ringsBlack,
    c.ringsBlue,
    c.ringsLightblue,
  ]);

  const networkConfig = useMemo(() => buildNetworkConfig(c), [
    c.networkPointColor,
    c.networkLineColor,
    c.networkPointSize,
    c.networkParticleCount,
    c.networkMaxDistance,
    c.networkAngularSpeed,
    c.networkTimeScale,
  ]);

  const cloudPos = useMemo(
    () => [c.cloudPosition.x, c.cloudPosition.y, c.cloudPosition.z],
    [c.cloudPosition.x, c.cloudPosition.y, c.cloudPosition.z]
  );
  const cloudRot = useMemo(
    () => [
      radians(c.cloudRotation.x),
      radians(c.cloudRotation.y),
      radians(c.cloudRotation.z),
    ],
    [c.cloudRotation.x, c.cloudRotation.y, c.cloudRotation.z]
  );
  const cloudBounds = useMemo(
    () => [c.cloudBoundsX, c.cloudBoundsY, c.cloudBoundsZ],
    [c.cloudBoundsX, c.cloudBoundsY, c.cloudBoundsZ]
  );

  const skullPos = useMemo(
    () => [c.skullPosition.x, c.skullPosition.y, c.skullPosition.z],
    [c.skullPosition.x, c.skullPosition.y, c.skullPosition.z]
  );
  const skullRot = useMemo(
    () => [
      radians(c.skullRotation.x),
      radians(c.skullRotation.y),
      radians(c.skullRotation.z),
    ],
    [c.skullRotation.x, c.skullRotation.y, c.skullRotation.z]
  );

  const femurPos = useMemo(
    () => [c.femurPosition.x, c.femurPosition.y, c.femurPosition.z],
    [c.femurPosition.x, c.femurPosition.y, c.femurPosition.z]
  );
  const femurRot = useMemo(
    () => [
      radians(c.femurRotation.x),
      radians(c.femurRotation.y),
      radians(c.femurRotation.z),
    ],
    [c.femurRotation.x, c.femurRotation.y, c.femurRotation.z]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <PerspectiveCamera makeDefault position={[-1, -1, 3.5]} />

      <pointLight
        position={[c.plPosition.x, c.plPosition.y, c.plPosition.z]}
        decay={c.plDecay}
        distance={c.plDistance}
        intensity={c.plIntensity}
        castShadow={c.plCastShadow}
      />

      <GridHelper x y z visible={c.showGridHelper} />
      <PolarGridHelper x y z visible={c.showPolarGridHelper} />

      <OrbitControls
        autoRotate
        enableDamping
        enablePan
        enableRotate
        enableZoom
        autoRotateSpeed={c.autoRotateSpeed}
      />

      <Float speed={c.floatSpeed}>
        <HaloDisplay
          haloRef={haloAnimRef}
          haloType={c.haloType}
          position={haloPos}
          rotation={haloRot}
          scale={c.haloScale}
          visible={c.haloVisible}
          ringsConfig={ringsConfig}
          recordSideA={c.recordSideA}
          networkConfig={networkConfig}
          atomicNumber={c.atomicNumber}
          atomAnimateElectrons={c.atomAnimateElectrons}
          atomShellSpacing={c.atomShellSpacing}
        />

        <SceneSkull
          position={skullPos}
          rotation={skullRot}
          scale={c.skullScale}
          visible={c.skullVisible}
          {...skullControls}
        />

        <SceneCloud
          position={cloudPos}
          rotation={cloudRot}
          scale={c.cloudScale}
          visible={c.cloudVisible}
          seed={c.cloudSeed}
          segments={c.cloudSegments}
          volume={c.cloudVolume}
          opacity={c.cloudOpacity}
          fade={c.cloudFade}
          growth={c.cloudGrowth}
          speed={c.cloudSpeed}
          bounds={cloudBounds}
          color={c.cloudColor}
        />

        <SceneFemur
          position={femurPos}
          rotation={femurRot}
          scale={c.femurScale}
          visible={c.femurVisible}
        />
      </Float>

      <Environment
        preset="studio"
        environmentIntensity={c.environmentIntensity}
      />
    </>
  );
}
