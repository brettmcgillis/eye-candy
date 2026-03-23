// ThatsAllFolks — 44 Magnum standing barrel-up, smoke flowing from the
// barrel tip tracing cursive letterforms for "That's All Folks!".
// Each named curve is an independent smoke system with its own Leva controls.
import React, { useMemo } from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import Magnum from '../../../../elements/magnum/Magnum';
import Smoke from './components/Smoke';
import SplineLine from './components/SplineLine';
import useSceneControls from './hooks/useControls';
import {
  ALL_LETTERS,
  APOSTROPHE,
  CAPITAL_F,
  CAPITAL_T,
  EXCLAMATION_DOT,
  EXCLAMATION_LINE,
  HATS,
  OLKS_TAIL,
  T_CROSSBAR,
  toScene,
} from './splineData';

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
  };
}

// ─── Scene ───────────────────────────────────────────────────────────────────

export default function ThatsAllFolks() {
  const config = useSceneControls();

  // Build all 9 curve point arrays once — world positioning is handled by
  // the smoke <group> transform controlled via Leva.
  const pts = useMemo(
    () => ({
      capitalT: toScene(CAPITAL_T),
      hats: toScene(HATS),
      crossbar: toScene(T_CROSSBAR),
      apostrophe: toScene(APOSTROPHE),
      allLetters: toScene(ALL_LETTERS),
      capitalF: toScene(CAPITAL_F),
      exclamLine: toScene(EXCLAMATION_LINE),
      exclamDot: toScene(EXCLAMATION_DOT),
      olksTail: toScene(OLKS_TAIL),
    }),
    []
  );

  const { curves } = config;

  return (
    <>
      <color attach="background" args={['#18100a']} />

      {/* Environment map — essential for PBR metallic surfaces */}
      <Environment preset="studio" />

      {/* Camera — framed to show the gun lower-centre, smoke/text filling upper 2/3 */}
      <PerspectiveCamera
        makeDefault
        position={[50, 380, 1050]}
        fov={55}
        near={1}
        far={8000}
        onUpdate={(self) => self.lookAt(0, 200, 0)}
      />
      <OrbitControls target={[0, 200, 0]} />

      {/* Lighting */}
      <ambientLight intensity={1.5} color="#ffe8c0" />
      <spotLight
        position={[500, 1400, 700]}
        angle={Math.PI * 0.16}
        intensity={25}
        decay={0}
        color="#fff5e0"
        castShadow
        shadow-camera-near={100}
        shadow-camera-far={3000}
        shadow-bias={-0.0002}
        shadow-mapSize={[1024, 1024]}
      />
      {/* Cool blue rim from back-left */}
      <pointLight
        position={[-700, 900, -300]}
        intensity={6}
        decay={0}
        color="#5080b0"
      />

      {/* Shadow-receiving floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <shadowMaterial opacity={0.4} />
      </mesh>

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
            <Smoke
              points={pts.capitalT}
              config={mergeCurveConfig(config, curves.capitalT)}
            />
          )}
          {curves.hats.visible && (
            <Smoke
              points={pts.hats}
              config={mergeCurveConfig(config, curves.hats)}
            />
          )}
          {curves.crossbar.visible && (
            <Smoke
              points={pts.crossbar}
              config={mergeCurveConfig(config, curves.crossbar)}
            />
          )}
          {curves.apostrophe.visible && (
            <Smoke
              points={pts.apostrophe}
              config={mergeCurveConfig(config, curves.apostrophe)}
            />
          )}
        </group>

        {/* All */}
        <group position={[config.allX, config.allY, config.allZ]}>
          {curves.allLetters.visible && (
            <Smoke
              points={pts.allLetters}
              config={mergeCurveConfig(config, curves.allLetters)}
            />
          )}
        </group>

        {/* Folks — Capital F + olks tail */}
        <group position={[config.folksX, config.folksY, config.folksZ]}>
          {curves.capitalF.visible && (
            <Smoke
              points={pts.capitalF}
              config={mergeCurveConfig(config, curves.capitalF)}
            />
          )}
          {curves.olksTail.visible && (
            <Smoke
              points={pts.olksTail}
              config={mergeCurveConfig(config, curves.olksTail)}
            />
          )}
        </group>

        {/* Exclamation — line + dot */}
        <group position={[config.exclamX, config.exclamY, config.exclamZ]}>
          {curves.exclamLine.visible && (
            <Smoke
              points={pts.exclamLine}
              config={mergeCurveConfig(config, curves.exclamLine)}
            />
          )}
          {curves.exclamDot.visible && (
            <Smoke
              points={pts.exclamDot}
              config={mergeCurveConfig(config, curves.exclamDot)}
            />
          )}
        </group>

        {/* ── Spline helpers — per-curve colour-coded debug lines ───────────── */}
        {config.showHelpers && (
          <>
            {/* That's helpers */}
            <group position={[config.thatsX, config.thatsY, config.thatsZ]}>
              <SplineLine
                points={pts.capitalT}
                visible={curves.capitalT.visible}
                color="#ff6644"
                tension={0.8}
                arcSegments={200}
              />
              <SplineLine
                points={pts.hats}
                visible={curves.hats.visible}
                color="#ff44aa"
                tension={0.8}
                arcSegments={300}
              />
              <SplineLine
                points={pts.crossbar}
                visible={curves.crossbar.visible}
                color="#ffcc44"
                tension={0.8}
                arcSegments={60}
              />
              <SplineLine
                points={pts.apostrophe}
                visible={curves.apostrophe.visible}
                color="#44ffcc"
                tension={0.8}
                arcSegments={60}
              />
            </group>

            {/* All helper */}
            <group position={[config.allX, config.allY, config.allZ]}>
              <SplineLine
                points={pts.allLetters}
                visible={curves.allLetters.visible}
                color="#44ff88"
                tension={0.8}
                arcSegments={300}
              />
            </group>

            {/* Folks helpers */}
            <group position={[config.folksX, config.folksY, config.folksZ]}>
              <SplineLine
                points={pts.capitalF}
                visible={curves.capitalF.visible}
                color="#4488ff"
                tension={0.8}
                arcSegments={200}
              />
              <SplineLine
                points={pts.olksTail}
                visible={curves.olksTail.visible}
                color="#44ccff"
                tension={0.8}
                arcSegments={400}
              />
            </group>

            {/* Exclamation helpers */}
            <group position={[config.exclamX, config.exclamY, config.exclamZ]}>
              <SplineLine
                points={pts.exclamLine}
                visible={curves.exclamLine.visible}
                color="#cc44ff"
                tension={0.8}
                arcSegments={60}
              />
              <SplineLine
                points={pts.exclamDot}
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
      <EffectComposer>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.88}
        />
      </EffectComposer>
    </>
  );
}
