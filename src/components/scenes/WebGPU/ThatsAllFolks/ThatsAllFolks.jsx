import React, { useMemo, useRef } from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

import * as THREE from 'three';

import Magnum from '@elements/Magnum/Magnum';
import SplineGroup from '@elements/SplineGroup/SplineGroup';
import { getSplineWorldPoints } from '@elements/SplineGroup/splineDefaults';
import THATS_ALL_FOLKS_SMOKE, {
  LEGACY_WORLD_TO_SCENE,
} from '@presets/smoke/thatsAllFolksSmoke';

import BackdropRings from './components/BackdropRings';
import BangRig from './components/BangRig';
import CursorAttractor from './components/CursorAttractor';
import useSceneControls from './hooks/useControls';

const s = (value) => value * LEGACY_WORLD_TO_SCENE;

const NOOP_SET_SPLINE_POINTS = () => {};

const SMOKE_TYPE_MAP = {
  particle: 'Particle',
  volumetric: 'Volumetric',
  both: 'Both',
};

const CURVE_RENDER_GROUPS = [
  {
    groupKey: 'thats',
    positionKeys: ['thatsX', 'thatsY', 'thatsZ'],
    curves: [
      { key: 'capitalT', index: 0, color: '#ff6644', arcSegments: 200 },
      { key: 'hats', index: 1, color: '#ff44aa', arcSegments: 300 },
      { key: 'crossbar', index: 2, color: '#ffcc44', arcSegments: 60 },
      { key: 'apostrophe', index: 3, color: '#44ffcc', arcSegments: 60 },
    ],
  },
  {
    groupKey: 'all',
    positionKeys: ['allX', 'allY', 'allZ'],
    curves: [
      { key: 'allLetters', index: 4, color: '#44ff88', arcSegments: 300 },
    ],
  },
  {
    groupKey: 'folks',
    positionKeys: ['folksX', 'folksY', 'folksZ'],
    curves: [
      { key: 'capitalF', index: 5, color: '#4488ff', arcSegments: 200 },
      { key: 'olksTail', index: 6, color: '#44ccff', arcSegments: 400 },
    ],
  },
  {
    groupKey: 'exclam',
    positionKeys: ['exclamX', 'exclamY', 'exclamZ'],
    curves: [
      { key: 'exclamLine', index: 7, color: '#cc44ff', arcSegments: 60 },
      { key: 'exclamDot', index: 8, color: '#ff44cc', arcSegments: 60 },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

    return (curve ?? [])
      .map((point) => point.position)
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

function buildCurveSplineConfig(globalConfig, curveConfig, curveMeta) {
  return {
    type: 'Smoke',
    smokeType: SMOKE_TYPE_MAP[globalConfig.smokeType] ?? 'Particle',
    visible: curveConfig.visible,
    tension: globalConfig.tension,
    closed: globalConfig.closed,
    arcSegments: curveMeta.arcSegments,
    showSpline: globalConfig.showHelpers,
    showHelpers: false,
    particleCount: curveConfig.particleCount,
    particleSize: curveConfig.particleSize,
    opacity: curveConfig.opacity,
    flowSpeed: curveConfig.flowSpeed,
    attractorStrength: globalConfig.cursorAttractorStrength,
    attractorRadius: globalConfig.cursorAttractorRadius,
    volParticleCount: curveConfig.particleCount,
    volSize: curveConfig.particleSize,
    volColor: globalConfig.particleColor,
    volOpacity: curveConfig.opacity,
    volFlowSpeed: curveConfig.flowSpeed,
    volBlendMode: globalConfig.blendMode,
    volFadeRate: globalConfig.volFadeRate,
  };
}

// ─── Scene ───────────────────────────────────────────────────────────────────

export default function ThatsAllFolks() {
  const config = useSceneControls();
  const attractorsRef = useRef([]);

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
          getSplineWorldPoints(spline).map((point) => ({
            position: point.position,
            rotation: point.rotation,
            scale: point.scale,
          })),
        ];
      })
    );
  }, []);

  const backdrop = useMemo(() => {
    if (!config.showSmoke) return null;
    return getBackdropLayout(pts, config);
  }, [pts, config]);

  const bangRigPosition = useMemo(
    () => [
      config.gunX + config.bangRigX,
      config.gunY + config.bangRigY,
      config.gunZ + config.bangRigZ,
    ],
    [
      config.gunX,
      config.gunY,
      config.gunZ,
      config.bangRigX,
      config.bangRigY,
      config.bangRigZ,
    ]
  );

  const bangRigRotation = useMemo(
    () => [
      THREE.MathUtils.degToRad(config.bangRigRotateX),
      THREE.MathUtils.degToRad(config.bangRigRotateY),
      THREE.MathUtils.degToRad(config.bangRigRotateZ),
    ],
    [config.bangRigRotateX, config.bangRigRotateY, config.bangRigRotateZ]
  );

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

      <CursorAttractor
        attractorsRef={attractorsRef}
        enabled={config.showSmoke && config.cursorAttractorEnabled}
        mode={config.cursorAttractorMode}
        planeZ={config.smokeZ}
        radius={config.cursorAttractorRadius}
        strength={config.cursorAttractorStrength}
        visible={config.showSmoke && config.showCursorAttractor}
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

      {config.showBangFlag && (
        <BangRig
          config={config}
          position={bangRigPosition}
          rotation={bangRigRotation}
        />
      )}

      {/* ── Smoke + spline helpers — positioned/scaled as one group ──────── */}
      {config.showSmoke && (
        <group
          position={[config.smokeX, config.smokeY, config.smokeZ]}
          scale={config.smokeScale}
        >
          {CURVE_RENDER_GROUPS.map((group) => (
            <group
              key={group.groupKey}
              position={group.positionKeys.map((key) => config[key])}
            >
              {group.curves.map((curveMeta) => {
                const points = pts[curveMeta.key];
                const curveConfig = curves[curveMeta.key];
                if (!points || !curveConfig) return null;

                return (
                  <SplineGroup
                    key={curveMeta.key}
                    index={curveMeta.index}
                    points={points}
                    config={config}
                    splineConfig={buildCurveSplineConfig(
                      config,
                      curveConfig,
                      curveMeta
                    )}
                    attractorsRef={attractorsRef}
                    setSplinePoints={NOOP_SET_SPLINE_POINTS}
                    allowedTypes="smoke"
                    splineColor={curveMeta.color}
                  />
                );
              })}
            </group>
          ))}
        </group>
      )}

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
