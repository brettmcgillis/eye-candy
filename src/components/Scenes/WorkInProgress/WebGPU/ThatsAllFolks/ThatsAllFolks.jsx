import * as THREE from 'three';

import React, { useMemo } from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import THATS_ALL_FOLKS_SMOKE, {
  LEGACY_WORLD_TO_SCENE,
} from '../../../../../presets/smoke/thatsAllFolksSmoke';
import Magnum from '../../../../elements/magnum/Magnum';
import SmokeParticles from '../../../../elements/smoke/SmokeParticlesGPU';
import VolumetricSmokeParticles from '../../../../elements/smoke/VolumetricSmokeParticlesGPU';
import SplineLine from '../../../../elements/spline/SplineLine';
import BackdropRings from './components/BackdropRings';
import useSceneControls from './hooks/useControls';

const s = (value) => value * LEGACY_WORLD_TO_SCENE;

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Merge global config with a curve's per-curve overrides.
// particleColor and all physics params come from the global config;
// particleCount / particleSize / opacity / flowSpeed come from the curve.
function mergeCurveConfig(globalConfig, curveConfig) {
  return {
    ...globalConfig,
    particleCount: curveConfig.particleCount,
    particleSize: curveConfig.particleSize,
    opacity: curveConfig.opacity,
    flowSpeed: curveConfig.flowSpeed,
    blendMode: globalConfig.blendMode,
  };
}

// Volumetric variant — maps per-curve overrides and bridges the shared physics
// param names (springK, turbulence, …) to the vol* names that
// VolumetricSmokeParticles reads, so the Leva panel controls both modes.
function mergeVolCurveConfig(globalConfig, curveConfig) {
  return {
    ...globalConfig,
    volParticleCount: curveConfig.particleCount,
    flowSpeed: curveConfig.flowSpeed,
    // curve-level appearance overrides
    volColor: globalConfig.particleColor,
    volOpacity: curveConfig.opacity,
    volSize: curveConfig.particleSize,
    // bridge blendMode → volBlendMode; vol physics spread in via ...globalConfig
    volBlendMode: globalConfig.blendMode,
    fadeRate: globalConfig.volFadeRate,
  };
}

const CURVE_GROUP_OFFSETS = {
  capitalT: ['thatsX', 'thatsY', 'thatsZ'],
  hats: ['thatsX', 'thatsY', 'thatsZ'],
  crossbar: ['thatsX', 'thatsY', 'thatsZ'],
  apostrophe: ['thatsX', 'thatsY', 'thatsZ'],
  allLetters: ['allX', 'allY', 'allZ'],
  capitalF: ['folksX', 'folksY', 'folksZ'],
  olksTail: ['folksX', 'folksY', 'folksZ'],
  exclamLine: ['exclamX', 'exclamY', 'exclamZ'],
  exclamDot: ['exclamX', 'exclamY', 'exclamZ'],
};

function getBackdropLayout(curves, config) {
  const smokeScale = config.smokeScale ?? 1;
  const allPositions = Object.entries(curves).flatMap(([curveKey, curve]) => {
    const [offsetXKey, offsetYKey, offsetZKey] =
      CURVE_GROUP_OFFSETS[curveKey] ?? [];
    const groupX = config[offsetXKey] ?? 0;
    const groupY = config[offsetYKey] ?? 0;
    const groupZ = config[offsetZKey] ?? 0;

    return (curve?.positions ?? [])
      .filter((position) => position.y + groupY >= 0)
      .map(
        (position) =>
          new THREE.Vector3(
            config.smokeX + (position.x + groupX) * smokeScale,
            config.smokeY + (position.y + groupY) * smokeScale,
            config.smokeZ + (position.z + groupZ) * smokeScale
          )
      );
  });

  if (allPositions.length === 0) return null;

  const smokeBounds = allPositions.reduce(
    (acc, position) => ({
      minX: Math.min(acc.minX, position.x),
      maxX: Math.max(acc.maxX, position.x),
      minY: Math.min(acc.minY, position.y),
      maxY: Math.max(acc.maxY, position.y),
    }),
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    }
  );

  const smokeWidth = smokeBounds.maxX - smokeBounds.minX;
  const smokeHeight = smokeBounds.maxY - smokeBounds.minY;
  const gunHalfWidth = Math.max(smokeWidth * 0.18, s(220));
  const gunHalfHeightAbove = Math.max(smokeHeight * 0.12, s(140));
  const gunHalfHeightBelow = Math.max(smokeHeight * 0.34, s(320));

  const bounds = {
    minX: Math.min(smokeBounds.minX, config.gunX - gunHalfWidth),
    maxX: Math.max(smokeBounds.maxX, config.gunX + gunHalfWidth),
    minY: Math.min(smokeBounds.minY, config.gunY - gunHalfHeightBelow),
    maxY: Math.max(smokeBounds.maxY, config.gunY + gunHalfHeightAbove),
  };

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const outerRadius = Math.max(width * 0.78, height * 0.82);
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerY = (bounds.minY + bounds.maxY) * 0.5;
  const backZ = Math.min(config.gunZ, config.smokeZ) - outerRadius * 0.98;

  return {
    position: [centerX, centerY, backZ],
    outerRadius,
    layerDepth: outerRadius * 0.08,
    layerGap: outerRadius * 0.028,
  };
}

// ─── Per-curve smoke renderer ────────────────────────────────────────────────
// Renders particle, volumetric, or both layers for a single curve.
// Using a named component (not inline) keeps Three.js from unmounting/remounting
// the geometry on every parent re-render.
function SmokeCurve({ smokeType, curve, globalConfig, curveConfig }) {
  const showParticle = smokeType === 'particle' || smokeType === 'both';
  const showVolumetric = smokeType === 'volumetric' || smokeType === 'both';
  return (
    <>
      {showParticle && (
        <SmokeParticles
          points={curve.positions}
          pointRotations={curve.rotations}
          pointScales={curve.scales}
          config={mergeCurveConfig(globalConfig, curveConfig)}
        />
      )}
      {showVolumetric && (
        <VolumetricSmokeParticles
          points={curve.positions}
          pointRotations={curve.rotations}
          pointScales={curve.scales}
          config={mergeVolCurveConfig(globalConfig, curveConfig)}
        />
      )}
    </>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

export default function ThatsAllFolks() {
  const config = useSceneControls();
  const { smokeType } = config;

  // Build all 9 curve point arrays from the preset — world positioning is
  // handled by the smoke <group> transform controlled via Leva.
  const pts = useMemo(() => {
    const preset = THATS_ALL_FOLKS_SMOKE["That's All Folks"];
    if (!preset || !preset.splines) return {};
    const curveNameToKey = {
      'Capital T': 'capitalT',
      Hats: 'hats',
      'T Crossbar': 'crossbar',
      Apostrophe: 'apostrophe',
      'All Letters': 'allLetters',
      'Capital F': 'capitalF',
      'Exclamation Line': 'exclamLine',
      'Exclamation Dot': 'exclamDot',
      'Olks Tail': 'olksTail',
    };
    return Object.fromEntries(
      preset.splines.map((spline) => {
        const key = curveNameToKey[spline.name];
        return [
          key,
          {
            positions: spline.points.map((point) => point.position),
            rotations: spline.points.map((point) => point.rotation),
            scales: spline.points.map((point) => point.scale),
          },
        ];
      })
    );
  }, []);

  const backdrop = useMemo(() => getBackdropLayout(pts, config), [pts, config]);

  const { curves } = config;

  return (
    <>
      <color attach="background" args={[config.bgColor]} />

      {/* Environment map — essential for PBR metallic surfaces */}
      <Environment preset="studio" />

      {/* Camera — framed to show the gun lower-centre, smoke/text filling upper 2/3 */}
      <PerspectiveCamera
        makeDefault
        position={[s(50), s(380), s(1050)]}
        fov={55}
        near={s(1)}
        far={s(8000)}
        onUpdate={(self) => self.lookAt(0, s(200), 0)}
      />
      <OrbitControls target={[0, s(200), 0]} />

      {/* Lighting */}
      <ambientLight
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />
      <spotLight
        position={[config.spotX, config.spotY, config.spotZ]}
        angle={Math.PI * 0.16}
        intensity={config.spotIntensity}
        decay={config.spotDecay}
        color={config.spotColor}
        castShadow
        shadow-camera-near={s(100)}
        shadow-camera-far={s(3000)}
        shadow-bias={-0.0002}
        shadow-mapSize={[1024, 1024]}
      />
      {/* Cool blue rim from back-left */}
      <pointLight
        position={[s(-700), s(900), s(-300)]}
        intensity={6}
        decay={0}
        color="#5080b0"
      />

      {/* Shadow-receiving floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, s(-2), 0]}
        receiveShadow
      >
        <planeGeometry args={[s(4000), s(4000)]} />
        <shadowMaterial opacity={0.4} />
      </mesh>

      {backdrop && (
        <BackdropRings
          position={backdrop.position}
          outerRadius={backdrop.outerRadius}
          layerDepth={backdrop.layerDepth}
          layerGap={backdrop.layerGap}
        />
      )}

      {/* 44 Magnum — standing barrel-up */}
      <group
        position={[config.gunX, config.gunY, config.gunZ]}
        scale={config.gunScale}
      >
        <Magnum rotation={[0, Math.PI / 2, 0]} />
      </group>

      {/* ── Smoke + spline helpers — positioned/scaled as one group ──────── */}
      <group
        position={[config.smokeX, config.smokeY, config.smokeZ]}
        scale={config.smokeScale}
      >
        {/* ── Smoke systems — one per letterform curve ──────────────────────── */}

        {/* That's — Capital T + hats + crossbar + apostrophe */}
        <group position={[config.thatsX, config.thatsY, config.thatsZ]}>
          {curves.capitalT.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.capitalT}
              globalConfig={config}
              curveConfig={curves.capitalT}
            />
          )}
          {curves.hats.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.hats}
              globalConfig={config}
              curveConfig={curves.hats}
            />
          )}
          {curves.crossbar.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.crossbar}
              globalConfig={config}
              curveConfig={curves.crossbar}
            />
          )}
          {curves.apostrophe.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.apostrophe}
              globalConfig={config}
              curveConfig={curves.apostrophe}
            />
          )}
        </group>

        {/* All */}
        <group position={[config.allX, config.allY, config.allZ]}>
          {curves.allLetters.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.allLetters}
              globalConfig={config}
              curveConfig={curves.allLetters}
            />
          )}
        </group>

        {/* Folks — Capital F + olks tail */}
        <group position={[config.folksX, config.folksY, config.folksZ]}>
          {curves.capitalF.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.capitalF}
              globalConfig={config}
              curveConfig={curves.capitalF}
            />
          )}
          {curves.olksTail.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.olksTail}
              globalConfig={config}
              curveConfig={curves.olksTail}
            />
          )}
        </group>

        {/* Exclamation — line + dot */}
        <group position={[config.exclamX, config.exclamY, config.exclamZ]}>
          {curves.exclamLine.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.exclamLine}
              globalConfig={config}
              curveConfig={curves.exclamLine}
            />
          )}
          {curves.exclamDot.visible && (
            <SmokeCurve
              smokeType={smokeType}
              curve={pts.exclamDot}
              globalConfig={config}
              curveConfig={curves.exclamDot}
            />
          )}
        </group>

        {/* ── Spline helpers — per-curve colour-coded debug lines ───────────── */}
        {config.showHelpers && (
          <>
            {/* That's helpers */}
            <group position={[config.thatsX, config.thatsY, config.thatsZ]}>
              <SplineLine
                points={pts.capitalT.positions}
                visible={curves.capitalT.visible}
                color="#ff6644"
                tension={0.8}
                arcSegments={200}
              />
              <SplineLine
                points={pts.hats.positions}
                visible={curves.hats.visible}
                color="#ff44aa"
                tension={0.8}
                arcSegments={300}
              />
              <SplineLine
                points={pts.crossbar.positions}
                visible={curves.crossbar.visible}
                color="#ffcc44"
                tension={0.8}
                arcSegments={60}
              />
              <SplineLine
                points={pts.apostrophe.positions}
                visible={curves.apostrophe.visible}
                color="#44ffcc"
                tension={0.8}
                arcSegments={60}
              />
            </group>

            {/* All helper */}
            <group position={[config.allX, config.allY, config.allZ]}>
              <SplineLine
                points={pts.allLetters.positions}
                visible={curves.allLetters.visible}
                color="#44ff88"
                tension={0.8}
                arcSegments={300}
              />
            </group>

            {/* Folks helpers */}
            <group position={[config.folksX, config.folksY, config.folksZ]}>
              <SplineLine
                points={pts.capitalF.positions}
                visible={curves.capitalF.visible}
                color="#4488ff"
                tension={0.8}
                arcSegments={200}
              />
              <SplineLine
                points={pts.olksTail.positions}
                visible={curves.olksTail.visible}
                color="#44ccff"
                tension={0.8}
                arcSegments={400}
              />
            </group>

            {/* Exclamation helpers */}
            <group position={[config.exclamX, config.exclamY, config.exclamZ]}>
              <SplineLine
                points={pts.exclamLine.positions}
                visible={curves.exclamLine.visible}
                color="#cc44ff"
                tension={0.8}
                arcSegments={60}
              />
              <SplineLine
                points={pts.exclamDot.positions}
                visible={curves.exclamDot.visible}
                color="#ff44cc"
                tension={0.8}
                arcSegments={60}
              />
            </group>
          </>
        )}
      </group>

      {/* Post-processing */}
      {/* <EffectComposer>
        <Bloom
          intensity={config.bloomIntensity}
          luminanceThreshold={config.bloomThreshold}
          luminanceSmoothing={config.bloomSmoothing}
        />
      </EffectComposer> */}
    </>
  );
}
