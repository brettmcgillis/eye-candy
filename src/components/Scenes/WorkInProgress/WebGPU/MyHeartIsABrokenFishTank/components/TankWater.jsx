import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import NurbsWaterColumn from '../../../../../elements/water/NurbsWaterColumn';
import getTankLayout from '../utils/tankLayout';
import TankWaterSplash from './water/splash/TankWaterSplash';

const FALLBACK_WATER_OPACITY = 0.34;
const FALLBACK_WAVE_HEIGHT_BASE = 0.036;
const MIN_VISIBLE_WATER_LEVEL = 0.0001;

const sharedCouplerLocalPoint = new THREE.Vector3();
const sharedCouplerWorldPoint = new THREE.Vector3();

function toHexString(color) {
  return `#${color.getHexString()}`;
}

function FallbackTankWater({ fluidCouplersRef, runtime, tank }) {
  const couplerPreviousPositionsRef = useRef(new WeakMap());
  const disturbanceRef = useRef(0);
  const groupRef = useRef(null);
  const waveChoppinessRef = useRef(0.35);
  const waveHeightRef = useRef(0.03);
  const waveSpeedRef = useRef(0.65);
  const [bottomColor, topColor] = useMemo(() => {
    const base = new THREE.Color(tank.waterColor);
    const nextBottom = base.clone().offsetHSL(0, 0.03, -0.22);
    const nextTop = base.clone().offsetHSL(0, 0.02, 0.12);

    return [toHexString(nextBottom), toHexString(nextTop)];
  }, [tank.waterColor]);

  useFrame((_, delta) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const activeWaterLevel = runtime
      ? runtime.getWaterLevel()
      : tank.waterLevel;
    const brokenPaneCount = runtime ? runtime.getBrokenPaneCount() : 0;
    const drainProgress =
      tank.waterLevel > 0 ? 1 - activeWaterLevel / tank.waterLevel : 0;
    const liveLayout = getTankLayout({ ...tank, waterLevel: activeWaterLevel });
    const previousPositions = couplerPreviousPositionsRef.current;
    let couplerDisturbance = 0;

    group.visible = activeWaterLevel > MIN_VISIBLE_WATER_LEVEL;
    group.position.set(0, liveLayout.waterY, 0);
    group.scale.set(
      liveLayout.innerWidth,
      liveLayout.waterHeight,
      liveLayout.innerDepth
    );

    (fluidCouplersRef?.current ?? []).forEach((node) => {
      if (!node) {
        return;
      }

      node.getWorldPosition(sharedCouplerWorldPoint);

      const previousWorldPoint = previousPositions.get(node);

      if (!previousWorldPoint) {
        previousPositions.set(node, sharedCouplerWorldPoint.clone());
        return;
      }

      sharedCouplerLocalPoint.copy(sharedCouplerWorldPoint);
      group.worldToLocal(sharedCouplerLocalPoint);

      if (
        Math.abs(sharedCouplerLocalPoint.x) <= 0.52 &&
        Math.abs(sharedCouplerLocalPoint.z) <= 0.52 &&
        sharedCouplerLocalPoint.y >= -0.55 &&
        sharedCouplerLocalPoint.y <= 0.55
      ) {
        const speed =
          sharedCouplerWorldPoint.distanceTo(previousWorldPoint) /
          Math.max(delta, 1 / 120);

        couplerDisturbance = Math.max(
          couplerDisturbance,
          Math.min(0.08, speed * 0.0035)
        );
      }

      previousWorldPoint.copy(sharedCouplerWorldPoint);
    });

    disturbanceRef.current = Math.max(
      disturbanceRef.current * 0.9,
      couplerDisturbance
    );

    waveHeightRef.current = Math.max(
      0.012,
      FALLBACK_WAVE_HEIGHT_BASE +
        brokenPaneCount * 0.014 +
        drainProgress * 0.05 +
        disturbanceRef.current
    );
    waveSpeedRef.current =
      0.4 +
      tank.waterDisturbance * 1.6 +
      brokenPaneCount * 0.12 +
      disturbanceRef.current * 4;
    waveChoppinessRef.current = Math.min(
      1.4,
      0.22 +
        tank.waterDisturbance * 2.4 +
        drainProgress * 0.45 +
        disturbanceRef.current * 5
    );
  });

  return (
    <group ref={groupRef} visible={tank.waterLevel > MIN_VISIBLE_WATER_LEVEL}>
      <NurbsWaterColumn
        bottomColor={bottomColor}
        depth={1}
        height={1}
        ior={1.18}
        opacity={FALLBACK_WATER_OPACITY}
        roughness={0.14}
        segments={20}
        showEdges={false}
        thickness={0.55}
        topColor={topColor}
        transmission={0.42}
        waveChoppinessRef={waveChoppinessRef}
        waveHeightRef={waveHeightRef}
        waveSpeedRef={waveSpeedRef}
        width={1}
      />
    </group>
  );
}

export default function TankWater({
  fluidCouplersRef,
  runtime,
  showWaterBounds = false,
  tank,
}) {
  const gl = useThree((state) => state.gl);
  const supportsSplash =
    gl?.backend?.isWebGPUBackend === true &&
    Boolean(gl?.backend?.device) &&
    Boolean(gl?.backend?.context) &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.gpu);

  if (supportsSplash) {
    return (
      <TankWaterSplash
        runtime={runtime}
        showWaterBounds={showWaterBounds}
        tank={tank}
      />
    );
  }

  return (
    <FallbackTankWater
      fluidCouplersRef={fluidCouplersRef}
      runtime={runtime}
      tank={tank}
    />
  );
}
