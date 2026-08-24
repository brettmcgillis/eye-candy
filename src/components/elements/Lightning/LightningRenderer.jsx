import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import LightningStrike from './LightningStrike';
import { createLightningVisualConfig } from './lightningStrikeEffects';
import useLightningController from './useLightningController';

function hexToRgb(color) {
  const threeColor = new THREE.Color(color);

  return {
    b: Math.round(threeColor.b * 255),
    g: Math.round(threeColor.g * 255),
    r: Math.round(threeColor.r * 255),
  };
}

function LightningFlashOverlay({ overlay, strikes }) {
  const overlayRef = useRef(null);

  useFrame(({ clock }) => {
    if (!overlayRef.current) {
      return;
    }

    const now = clock.elapsedTime;
    let alpha = 0;

    for (let index = 0; index < strikes.length; index += 1) {
      const strike = strikes[index];
      const elapsed = now - strike.startTime;

      if (elapsed >= 0) {
        alpha = Math.max(
          alpha,
          Math.exp(-elapsed * overlay.decay) * overlay.maxAlpha
        );
      }
    }

    const { r, g, b } = hexToRgb(overlay.color);
    overlayRef.current.style.background = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  });

  return (
    <group userData={{ lightningIgnore: true }}>
      <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[1, 0]}>
        <div
          ref={overlayRef}
          style={{
            background: 'rgba(100, 150, 255, 0)',
            inset: 0,
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />
      </Html>
    </group>
  );
}

function LightningCameraShake({ cameraShake, strikes }) {
  const camera = useThree((state) => state.camera);
  const offsetRef = useRef(new THREE.Vector3());

  useEffect(
    () => () => {
      camera.position.sub(offsetRef.current);
      offsetRef.current.set(0, 0, 0);
    },
    [camera]
  );

  useFrame(({ clock }) => {
    camera.position.sub(offsetRef.current);
    offsetRef.current.set(0, 0, 0);

    if (!cameraShake.enabled) {
      return;
    }

    const now = clock.elapsedTime;
    let strength = 0;

    for (let index = 0; index < strikes.length; index += 1) {
      const strike = strikes[index];
      const elapsed = now - strike.startTime;

      if (elapsed >= 0 && elapsed <= cameraShake.duration) {
        strength = Math.max(
          strength,
          Math.exp(-elapsed * cameraShake.decay) * cameraShake.intensity
        );
      }
    }

    if (strength <= 0.0001) {
      return;
    }

    const time = now * cameraShake.frequency;
    offsetRef.current.set(
      Math.sin(time * 1.37 + 0.5),
      Math.sin(time * 2.11 + 1.7),
      Math.sin(time * 1.73 + 3.1)
    );
    offsetRef.current.multiplyScalar(strength);
    camera.position.add(offsetRef.current);
    camera.updateMatrixWorld();
  }, 1);

  return null;
}

function LightningRenderer({
  renderer,
  apiRef = null,
  autoRandom = false,
  autoRandomInterval = [4, 8],
  branchCount = 3,
  clickToStrike = false,
  coreColor = '#aceeff',
  defaultSource = null,
  effects = null,
  fadeDuration = 1,
  fallbackPlaneEnabled = true,
  flashIntensity = 0,
  flashRadius = 1.8,
  glowColor = '#1072bd',
  groundPlaneY = 0,
  keyboardShortcuts = {
    random: 'KeyR',
    preset: 'KeyP',
    clear: 'Escape',
  },
  mainFractalDepth = 6,
  maxConcurrentStrikes = 12,
  presetTargets = [],
  randomStrikeBounds = {
    minX: -5,
    maxX: 5,
    minZ: -5,
    maxZ: 5,
    targetY: 0,
    minHeight: 15,
    maxHeight: 24,
    sourceSpread: 1.5,
    topJitter: 1.5,
  },
  raycastFilter = null,
  roughness = 0.5,
  strikeDuration = 0.15,
  thickness = 0.045,
}) {
  const visualConfig = useMemo(
    () =>
      createLightningVisualConfig({
        branchCount,
        coreColor,
        effects,
        fadeDuration,
        flashIntensity,
        flashRadius,
        glowColor,
        mainFractalDepth,
        renderer,
        roughness,
        strikeDuration,
        thickness,
      }),
    [
      branchCount,
      coreColor,
      effects,
      fadeDuration,
      flashIntensity,
      flashRadius,
      glowColor,
      mainFractalDepth,
      renderer,
      roughness,
      strikeDuration,
      thickness,
    ]
  );

  const defaultTotalDuration = useMemo(
    () =>
      Math.max(
        strikeDuration + fadeDuration + visualConfig.tailExtraDuration,
        visualConfig.effectDuration + visualConfig.impactExtraDuration
      ),
    [fadeDuration, strikeDuration, visualConfig]
  );

  const { completeStrike, strikes } = useLightningController({
    apiRef,
    autoRandom,
    autoRandomInterval,
    clickToStrike,
    defaultSource,
    defaultTotalDuration,
    fallbackPlaneEnabled,
    groundPlaneY,
    keyboardShortcuts,
    maxConcurrentStrikes,
    presetTargets,
    randomStrikeBounds,
    raycastFilter,
    strikeDuration,
    fadeDuration,
  });

  return (
    <>
      {visualConfig.overlay.enabled ? (
        <LightningFlashOverlay
          overlay={visualConfig.overlay}
          strikes={strikes}
        />
      ) : null}
      {visualConfig.cameraShake.enabled ? (
        <LightningCameraShake
          cameraShake={visualConfig.cameraShake}
          strikes={strikes}
        />
      ) : null}
      {strikes.map((strike) => (
        <LightningStrike
          key={strike.id}
          config={visualConfig}
          onComplete={completeStrike}
          strike={strike}
        />
      ))}
    </>
  );
}

export default memo(LightningRenderer);
