import React, { useEffect, useMemo, useRef } from 'react';

import {
  Environment,
  Float,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import getColorsInRange from '../../../../../utils/colors';
import { radians } from '../../../../../utils/math';
import { useSkullControls } from '../../../../elements/skull/SkullControls';
import { GridHelper, PolarGridHelper } from '../../../../rigging/GridHelper';
import HaloDisplay from './components/HaloDisplay';
import SceneCloud from './components/SceneCloud';
import SceneFemur from './components/SceneFemur';
import SceneSkull from './components/SceneSkull';
import useSceneControls from './hooks/useSceneControls';
import { HALO_PRESET_ORDER } from './presets';
import useHaloAnimation from './useHaloAnimation';

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
    width: Math.round((r.width / totalWidthRatio) * width * 100) / 100,
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
  // Halo scroll mode — time-based preset cycling
  // ---------------------------------------------------------------------------
  const presetIndexRef = useRef(HALO_PRESET_ORDER.indexOf(c.preset));
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    presetIndexRef.current = HALO_PRESET_ORDER.indexOf(c.preset);
  }, [c.preset]);

  useFrame(({ clock }) => {
    if (!c.haloScrollEnabled) return;

    const now = clock.elapsedTime;
    if (now - lastScrollTimeRef.current >= c.haloScrollInterval) {
      lastScrollTimeRef.current = now;
      presetIndexRef.current =
        (presetIndexRef.current + 1) % HALO_PRESET_ORDER.length;
      const nextPreset = HALO_PRESET_ORDER[presetIndexRef.current];
      setControls({ preset: nextPreset });
    }
  });

  // ---------------------------------------------------------------------------
  // Stable memoized props for memoized child components
  // ---------------------------------------------------------------------------

  // Get type-specific position, rotation, and visibility
  const getHaloPosition = (haloType) => {
    switch (haloType) {
      case 'rings':
        return c.ringsPosition;
      case 'record':
        return c.recordPosition;
      case 'network':
        return c.networkPosition;
      case 'atomic':
        return c.atomPosition;
      case 'plate':
        return c.platePosition;
      default:
        return { x: 0, y: 1.5, z: -1 };
    }
  };

  const getHaloRotation = (haloType) => {
    switch (haloType) {
      case 'rings':
        return c.ringsRotation;
      case 'record':
        return c.recordRotation;
      case 'network':
        return c.networkRotation;
      case 'atomic':
        return c.atomRotation;
      case 'plate':
        return c.plateRotation;
      default:
        return { x: 45, y: 0, z: 0 };
    }
  };

  const getHaloVisible = (haloType) => {
    switch (haloType) {
      case 'rings':
        return c.ringsVisible;
      case 'record':
        return c.recordVisible;
      case 'network':
        return c.networkVisible;
      case 'atomic':
        return c.atomVisible;
      case 'plate':
        return c.plateVisible;
      default:
        return true;
    }
  };

  const currentHaloPosition = getHaloPosition(c.haloType);
  const currentHaloRotation = getHaloRotation(c.haloType);
  const currentHaloVisible = getHaloVisible(c.haloType);

  const haloPos = useMemo(
    () => [currentHaloPosition.x, currentHaloPosition.y, currentHaloPosition.z],
    [currentHaloPosition.x, currentHaloPosition.y, currentHaloPosition.z]
  );
  const haloRot = useMemo(
    () => [
      radians(currentHaloRotation.x),
      radians(currentHaloRotation.y),
      radians(currentHaloRotation.z),
    ],
    [currentHaloRotation.x, currentHaloRotation.y, currentHaloRotation.z]
  );

  const haloScale = useMemo(() => {
    if (c.haloType === 'rings') return c.ringsScale ?? c.haloScale ?? 0.9;
    if (c.haloType === 'record') return c.recordScale ?? c.haloScale ?? 12;
    if (c.haloType === 'network') return c.networkScale ?? c.haloScale ?? 0.53;
    if (c.haloType === 'plate') return c.plateScale ?? c.haloScale ?? 0.18;
    if (c.haloType === 'atomic') return c.atomScale ?? c.haloScale ?? 1.05;
    return c.haloScale ?? 1;
  }, [
    c.haloType,
    c.ringsScale,
    c.recordScale,
    c.networkScale,
    c.plateScale,
    c.atomScale,
    c.haloScale,
  ]);

  const ringsConfig = useMemo(
    () => buildRingsConfig(c),
    [
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
    ]
  );

  const networkConfig = useMemo(
    () => buildNetworkConfig(c),
    [
      c.networkPointColor,
      c.networkLineColor,
      c.networkPointSize,
      c.networkParticleCount,
      c.networkMaxDistance,
      c.networkAngularSpeed,
      c.networkTimeScale,
    ]
  );

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
          scale={haloScale}
          visible={currentHaloVisible}
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
