import { MathUtils } from 'three';

import React, { useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import POLICE_PRESENCE_FIRE from '../../../../../presets/fire/policePresenceFire';
import CinderBlock1 from '../../../../elements/cinderblocks/CinderBlock1';
import CinderBlock2 from '../../../../elements/cinderblocks/CinderBlock2';
import CinderBlock3 from '../../../../elements/cinderblocks/CinderBlock3';
import CinderBlock4 from '../../../../elements/cinderblocks/CinderBlock4';
import PoliceCruiser from '../../../../elements/policeCruiser/PoliceCruiser';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import {
  getSplineWorldOrigin,
  getSplineWorldPoints,
} from '../../../../elements/splineGroup/splineDefaults';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';
import useSceneControls from './hooks/useSceneControls';
import { CINDERBLOCK_CONFIGS, FIRE_INSTANCE_CONFIGS } from './presets';

const CINDERBLOCK_COMPONENTS = {
  cinderBlock1: CinderBlock1,
  cinderBlock2: CinderBlock2,
  cinderBlock3: CinderBlock3,
  cinderBlock4: CinderBlock4,
};

function toVector3Array(value = {}) {
  return [value.x ?? 0, value.y ?? 0, value.z ?? 0];
}

function toEulerArray(value = {}) {
  return [
    MathUtils.degToRad(value.x ?? 0),
    MathUtils.degToRad(value.y ?? 0),
    MathUtils.degToRad(value.z ?? 0),
  ];
}

// ─── Animated siren lights on the light bar ───────────────────────────────
function SirenLights() {
  const redRef = useRef();
  const blueRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const speed = 6;
    const swing = 0.5;
    if (redRef.current) {
      redRef.current.position.z = -4 + Math.sin(t * speed) * swing;
      redRef.current.intensity = 2.5 + Math.sin(t * speed * 2) * 1.5;
    }
    if (blueRef.current) {
      blueRef.current.position.z = -4 - Math.sin(t * speed) * swing;
      blueRef.current.intensity = 2.5 + Math.cos(t * speed * 2) * 1.5;
    }
  });

  return (
    <>
      <pointLight
        ref={redRef}
        position={[-0.24, 1.5, -4]}
        color="#ff0000"
        intensity={2.5}
        distance={6}
        decay={2}
      />
      <pointLight
        ref={blueRef}
        position={[-0.24, 1.5, -4]}
        color="#0044ff"
        intensity={2.5}
        distance={6}
        decay={2}
      />
    </>
  );
}

// ─── Blinking headlights (alarm system) ───────────────────────────────────
function BlinkingHeadlights() {
  const leftRef = useRef();
  const rightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Irregular alarm-style flash
    const blink = Math.sin(t * 8) > 0.2 ? 3.0 : 0.0;
    if (leftRef.current) leftRef.current.intensity = blink;
    if (rightRef.current) rightRef.current.intensity = blink;
  });

  return (
    <>
      <pointLight
        ref={leftRef}
        position={[2.3, 0.7, -3.55]}
        color="#fff4d6"
        intensity={3}
        distance={5}
        decay={2}
      />
      <pointLight
        ref={rightRef}
        position={[2.3, 0.7, -4.45]}
        color="#fff4d6"
        intensity={3}
        distance={5}
        decay={2}
      />
    </>
  );
}

// ─── Flickering fire glow cast on car body ────────────────────────────────
function FireGlow() {
  const lightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker =
      2.5 +
      Math.sin(t * 4.1) * 0.6 +
      Math.sin(t * 7.7) * 0.35 +
      Math.sin(t * 13.3) * 0.15;
    if (lightRef.current) lightRef.current.intensity = flicker;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0.3, 2.2, -4]}
      color="#ff6a00"
      intensity={2.5}
      distance={10}
      decay={2}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main scene
// ═══════════════════════════════════════════════════════════════════════════
export default function PolicePresence() {
  const controls = useSceneControls();

  const splineLookup = useMemo(() => {
    const splines = POLICE_PRESENCE_FIRE.splines ?? [];

    return {
      ...FIRE_INSTANCE_CONFIGS.reduce(
        (lookup, config) => ({
          ...lookup,
          [config.id]: splines.find(
            (spline) => spline.name === config.splineName
          ),
        }),
        {}
      ),
      smokeColumn: splines.find((s) => s.name === 'Smoke Column'),
    };
  }, []);

  const smokePointData = useMemo(
    () => getSplineWorldPoints(splineLookup.smokeColumn),
    [splineLookup]
  );

  const smokePoints = useMemo(
    () => smokePointData.map((point) => point.position.clone()),
    [smokePointData]
  );

  const smokePointRotations = useMemo(
    () => smokePointData.map((point) => point.rotation.clone()),
    [smokePointData]
  );

  const smokePointScales = useMemo(
    () => smokePointData.map((point) => point.scale.clone()),
    [smokePointData]
  );

  const smokeConfig = splineLookup.smokeColumn
    ? {
        ...splineLookup.smokeColumn,
        closed: controls.smokeClosed,
        tension: controls.smokeTension,
        prefillOnStart: controls.smokePrefillOnStart,
        particleCount: controls.smokeParticleCount,
        particleSize: controls.smokeParticleSize,
        particleColor: controls.smokeParticleColor,
        opacity: controls.smokeOpacity,
        growth: controls.smokeGrowth,
        fadeExponent: controls.smokeFadeExponent,
        springK: controls.smokeSpringK,
        flowSpeed: controls.smokeFlowSpeed,
        damping: controls.smokeDamping,
        turbulence: controls.smokeTurbulence,
        turbulenceSpeed: controls.smokeTurbulenceSpeed,
        buoyancy: controls.smokeBuoyancy,
        rotSpeed: controls.smokeRotSpeed,
        fadeRate: controls.smokeFadeRate,
        spawnSpread: controls.smokeSpawnSpread,
        maxDrift: controls.smokeMaxDrift,
        blendMode: controls.smokeBlendMode,
      }
    : null;

  const fireInstances = FIRE_INSTANCE_CONFIGS.map((config) => {
    const spline = splineLookup[config.id];

    return {
      ...config,
      visible: controls[`${config.id}Visible`],
      position: spline
        ? getSplineWorldOrigin(spline).toArray()
        : toVector3Array(config.fallbackPosition),
      width: controls[`${config.id}Width`],
      depth: controls[`${config.id}Depth`],
      height: controls[`${config.id}Height`],
      bendX: controls[`${config.id}BendX`],
      bendZ: controls[`${config.id}BendZ`],
      animated: controls[`${config.id}Animated`],
      animSpeed: controls[`${config.id}AnimSpeed`],
      magnitude: controls[`${config.id}Magnitude`],
      brightness: controls[`${config.id}Brightness`],
    };
  });

  return (
    <>
      {/* ── Background ───────────────────────────────────────────────── */}
      <color attach="background" args={[controls.backgroundColor]} />

      {/* ── Camera + controls ────────────────────────────────────────── */}
      <PerspectiveCamera
        makeDefault
        position={toVector3Array(controls.cameraPosition)}
        fov={controls.cameraFov}
      />
      <OrbitControls
        target={toVector3Array(controls.cameraTarget)}
        enableDamping
        dampingFactor={0.06}
      />

      {/* ── Base lighting ────────────────────────────────────────────── */}
      <ambientLight
        color={controls.ambientLightColor}
        intensity={controls.ambientLightIntensity}
      />
      <directionalLight
        color={controls.directionalLightColor}
        position={toVector3Array(controls.directionalLightPosition)}
        intensity={controls.directionalLightIntensity}
      />

      {controls.floorVisible ? (
        <mesh
          position={toVector3Array(controls.floorPosition)}
          rotation={toEulerArray(controls.floorRotation)}
          scale={toVector3Array(controls.floorScale)}
          receiveShadow
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={controls.floorColor}
            roughness={controls.floorRoughness}
            metalness={controls.floorMetalness}
          />
        </mesh>
      ) : null}

      {/* ── Police cruiser model ─────────────────────────────────────── */}
      <PoliceCruiser showTires={controls.showTires} />

      {controls.showCinderblocks
        ? CINDERBLOCK_CONFIGS.map((config) => {
            const CinderBlockComponent = CINDERBLOCK_COMPONENTS[config.id];

            return (
              <CinderBlockComponent
                key={config.id}
                position={toVector3Array(controls[`${config.id}Position`])}
                rotation={toEulerArray(controls[`${config.id}Rotation`])}
                scale={toVector3Array(controls[`${config.id}Scale`])}
              />
            );
          })
        : null}

      {/* ── Volumetric fire ──────────────────────────────────────────── */}
      {fireInstances.map((fire) => {
        if (!fire.visible) {
          return null;
        }

        return (
          <VolumetricFire
            key={fire.id}
            position={fire.position}
            width={fire.width}
            depth={fire.depth}
            height={fire.height}
            bendX={fire.bendX}
            bendZ={fire.bendZ}
            animated={fire.animated}
            animSpeed={fire.animSpeed}
            magnitude={fire.magnitude}
            brightness={fire.brightness}
          />
        );
      })}

      {/* ── Smoke column ─────────────────────────────────────────────── */}
      {controls.smokeVisible && smokeConfig && smokePoints.length > 1 ? (
        <SmokeParticles
          points={smokePoints}
          pointRotations={smokePointRotations}
          pointScales={smokePointScales}
          config={smokeConfig}
        />
      ) : null}

      {/* ── Fire glow (casts orange light on car) ────────────────────── */}
      <FireGlow />

      {/* ── Siren lights (rotating red / blue) ───────────────────────── */}
      <SirenLights />

      {/* ── Headlights (blinking alarm) ──────────────────────────────── */}
      <BlinkingHeadlights />

      {/* ── Brake lights (parking brake on — static red) ─────────────── */}
      <pointLight
        position={[-2.36, 0.65, -3.65]}
        color="#ff0000"
        intensity={1.5}
        distance={3}
        decay={2}
      />
      <pointLight
        position={[-2.36, 0.65, -4.35]}
        color="#ff0000"
        intensity={1.5}
        distance={3}
        decay={2}
      />
    </>
  );
}
