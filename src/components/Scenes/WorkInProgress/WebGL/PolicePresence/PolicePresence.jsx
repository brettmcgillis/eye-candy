import React, { useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import POLICE_PRESENCE_FIRE from '../../../../../presets/fire/policePresenceFire';
import PoliceCruiser from '../../../../elements/policeCruiser/PoliceCruiser';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';

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
  const {
    windshieldFire,
    driverWindowFire,
    passengerWindowFire,
    hoodFire,
    roofFire,
    smokeColumn,
  } = useMemo(() => {
    const splines = POLICE_PRESENCE_FIRE.splines ?? [];
    return {
      windshieldFire: splines.find((s) => s.name === 'Windshield Fire'),
      driverWindowFire: splines.find((s) => s.name === 'Driver Window Fire'),
      passengerWindowFire: splines.find(
        (s) => s.name === 'Passenger Window Fire'
      ),
      hoodFire: splines.find((s) => s.name === 'Hood Fire'),
      roofFire: splines.find((s) => s.name === 'Roof Fire'),
      smokeColumn: splines.find((s) => s.name === 'Smoke Column'),
    };
  }, []);
  const smokePoints = useMemo(
    () => smokeColumn?.points?.map((pt) => pt.position.clone()) ?? [],
    [smokeColumn]
  );

  return (
    <>
      {/* ── Background ───────────────────────────────────────────────── */}
      <color attach="background" args={['#f5f5f5']} />

      {/* ── Camera + controls ────────────────────────────────────────── */}
      <PerspectiveCamera makeDefault position={[7, 3.5, -1]} fov={45} />
      <OrbitControls target={[0, 1.0, -4]} enableDamping dampingFactor={0.06} />

      {/* ── Base lighting ────────────────────────────────────────────── */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 2]} intensity={0.8} />

      {/* ── Police cruiser model ─────────────────────────────────────── */}
      <PoliceCruiser />

      {/* ── Volumetric fire ──────────────────────────────────────────── */}
      {/* Windshield — main blaze, tall and wide */}
      <VolumetricFire
        position={
          windshieldFire?.points?.[0]?.position?.toArray() ?? [0.6, 1.1, -4.0]
        }
        width={windshieldFire?.fireWidth ?? 1.2}
        depth={windshieldFire?.fireDepth ?? 0.8}
        height={windshieldFire?.fireHeight ?? 2.8}
        bendX={-0.3}
        bendZ={0.15}
        animated={windshieldFire?.fireAnimated ?? true}
        animSpeed={windshieldFire?.fireAnimSpeed ?? 0.6}
        magnitude={windshieldFire?.fireMagnitude ?? 1.5}
        brightness={windshieldFire?.fireBrightness ?? 1.6}
      />
      {/* Driver window — flames licking out sideways */}
      <VolumetricFire
        position={
          driverWindowFire?.points?.[0]?.position?.toArray() ?? [
            0.0, 1.0, -4.72,
          ]
        }
        width={driverWindowFire?.fireWidth ?? 0.6}
        depth={driverWindowFire?.fireDepth ?? 0.5}
        height={driverWindowFire?.fireHeight ?? 1.8}
        bendX={-0.1}
        bendZ={-0.4}
        animated={driverWindowFire?.fireAnimated ?? true}
        animSpeed={driverWindowFire?.fireAnimSpeed ?? 0.5}
        magnitude={driverWindowFire?.fireMagnitude ?? 1.3}
        brightness={driverWindowFire?.fireBrightness ?? 1.4}
      />
      {/* Passenger window — mirrored */}
      <VolumetricFire
        position={
          passengerWindowFire?.points?.[0]?.position?.toArray() ?? [
            0.0, 1.0, -3.28,
          ]
        }
        width={passengerWindowFire?.fireWidth ?? 0.6}
        depth={passengerWindowFire?.fireDepth ?? 0.5}
        height={passengerWindowFire?.fireHeight ?? 1.8}
        bendX={-0.1}
        bendZ={0.4}
        animated={passengerWindowFire?.fireAnimated ?? true}
        animSpeed={passengerWindowFire?.fireAnimSpeed ?? 0.55}
        magnitude={passengerWindowFire?.fireMagnitude ?? 1.3}
        brightness={passengerWindowFire?.fireBrightness ?? 1.4}
      />
      {/* Hood / engine area — lower, wider */}
      <VolumetricFire
        position={
          hoodFire?.points?.[0]?.position?.toArray() ?? [1.4, 0.85, -4.0]
        }
        width={hoodFire?.fireWidth ?? 0.9}
        depth={hoodFire?.fireDepth ?? 0.7}
        height={hoodFire?.fireHeight ?? 1.5}
        bendX={0.2}
        bendZ={0.1}
        animated={hoodFire?.fireAnimated ?? true}
        animSpeed={hoodFire?.fireAnimSpeed ?? 0.45}
        magnitude={hoodFire?.fireMagnitude ?? 1.1}
        brightness={hoodFire?.fireBrightness ?? 1.3}
      />
      {/* Roof wrap-back — broad draping fire */}
      <VolumetricFire
        position={
          roofFire?.points?.[0]?.position?.toArray() ?? [-0.4, 1.25, -4.0]
        }
        width={roofFire?.fireWidth ?? 1.0}
        depth={roofFire?.fireDepth ?? 0.9}
        height={roofFire?.fireHeight ?? 2.2}
        bendX={-0.5}
        bendZ={-0.1}
        animated={roofFire?.fireAnimated ?? true}
        animSpeed={roofFire?.fireAnimSpeed ?? 0.55}
        magnitude={roofFire?.fireMagnitude ?? 1.4}
        brightness={roofFire?.fireBrightness ?? 1.5}
      />

      {/* ── Smoke column ─────────────────────────────────────────────── */}
      <SmokeParticles points={smokePoints} config={smokeColumn} />

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
