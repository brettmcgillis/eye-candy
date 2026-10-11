import React, { memo, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import Lightning from '@elements/Lightning/Lightning';

const BOLT_EFFECTS = {
  cameraShake: false,
  cracks: false,
  debris: false,
  groundFlash: false,
  overlay: false,
  pointLight: false,
  shockwave: false,
  sparks: false,
};

const STRIKE_BOUNDS = {
  minX: 300,
  maxX: 650,
  minZ: -260,
  maxZ: 60,
  targetY: -220,
  minHeight: 260,
  maxHeight: 420,
  sourceSpread: 60,
  topJitter: 40,
};

const NO_SHORTCUTS = {};

function flicker(t) {
  return (
    0.5 +
    0.25 * Math.sin(t * 61.3) +
    0.15 * Math.sin(t * 23.1 + 1.7) +
    0.1 * Math.sin(t * 97.7 + 0.4)
  );
}

function StormFlash({
  backdropColor,
  color,
  flashRef,
  intensity,
  maxGap,
  minGap,
}) {
  const scene = useThree((state) => state.scene);
  const flash = flashRef;
  const lightRef = useRef(null);
  const lightningApiRef = useRef(null);
  const strikeRef = useRef({ end: 0, next: 3, start: 0 });
  const baseColor = useMemo(() => new THREE.Color(), []);
  const flashColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const strike = strikeRef.current;

    if (t >= strike.next) {
      strike.start = t;
      strike.end = t + 0.5 + Math.random() * 0.8;
      strike.next = strike.end + minGap + Math.random() * (maxGap - minGap);
      // Rare (one per strike), so the setState inside spawn is acceptable here.
      lightningApiRef.current?.spawnRandomStrike();
    }

    let envelope = 0;
    if (t < strike.end) {
      const progress = (t - strike.start) / (strike.end - strike.start);
      envelope = Math.max(0, flicker(t)) * (1 - progress) ** 1.5;
    }
    flash.current = envelope;

    if (lightRef.current) lightRef.current.intensity = envelope * intensity;
    if (scene.background?.isColor) {
      baseColor.set(backdropColor);
      flashColor.set(color);
      scene.background.copy(baseColor).lerp(flashColor, envelope * 0.35);
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        color={color}
        intensity={0}
        position={[400, 300, 100]}
      />
      <Lightning
        apiRef={lightningApiRef}
        coreColor="#e8f0ff"
        effects={BOLT_EFFECTS}
        fallbackPlaneEnabled
        glowColor="#7f9cff"
        groundPlaneY={STRIKE_BOUNDS.targetY}
        keyboardShortcuts={NO_SHORTCUTS}
        mainFractalDepth={7}
        randomStrikeBounds={STRIKE_BOUNDS}
        strikeDuration={0.25}
        thickness={2.2}
      />
    </>
  );
}

export default memo(StormFlash);
