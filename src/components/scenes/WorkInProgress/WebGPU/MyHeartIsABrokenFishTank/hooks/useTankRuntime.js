import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { FISH_TANK_PANE_KEYS } from '../../../../../elements/fishTank/FishTank';

const MIN_WATER_LEVEL = 0;

function createBrokenPaneState() {
  return Object.fromEntries(
    FISH_TANK_PANE_KEYS.map((paneKey) => [paneKey, false])
  );
}

function createBreakEventState() {
  return Object.fromEntries(
    FISH_TANK_PANE_KEYS.map((paneKey) => [
      paneKey,
      {
        atSeconds: -1,
        id: 0,
        point: [0, 0, 0],
        worldPoint: [0, 0, 0],
      },
    ])
  );
}

export default function useTankRuntime(tank) {
  const tankRef = useRef(tank);
  const brokenPanesRef = useRef(createBrokenPaneState());
  const breakEventsRef = useRef(createBreakEventState());
  const resetNonceRef = useRef(0);
  const waterLevelRef = useRef(tank.waterLevel);

  useEffect(() => {
    tankRef.current = tank;
    brokenPanesRef.current = createBrokenPaneState();
    breakEventsRef.current = createBreakEventState();
    resetNonceRef.current += 1;
    waterLevelRef.current = tank.waterLevel;
  }, [
    tank.depth,
    tank.drainRate,
    tank.glassThickness,
    tank.height,
    tank.waterInset,
    tank.waterLevel,
    tank.width,
  ]);

  useFrame((_, delta) => {
    const brokenPaneCount = FISH_TANK_PANE_KEYS.reduce(
      (count, paneKey) => count + (brokenPanesRef.current[paneKey] ? 1 : 0),
      0
    );

    if (!brokenPaneCount) {
      return;
    }

    waterLevelRef.current = Math.max(
      MIN_WATER_LEVEL,
      waterLevelRef.current -
        delta * tankRef.current.drainRate * brokenPaneCount
    );
  });

  const breakPane = useCallback((paneKey, localPoint, worldPoint) => {
    if (!FISH_TANK_PANE_KEYS.includes(paneKey)) {
      return;
    }

    const nextLocalPoint = Array.isArray(localPoint)
      ? localPoint
      : (localPoint?.toArray?.() ?? [0, 0, 0]);
    const nextWorldPoint = Array.isArray(worldPoint)
      ? worldPoint
      : (worldPoint?.toArray?.() ?? nextLocalPoint);

    brokenPanesRef.current[paneKey] = true;
    breakEventsRef.current[paneKey] = {
      atSeconds: performance.now() / 1000,
      id: breakEventsRef.current[paneKey].id + 1,
      point: nextLocalPoint,
      worldPoint: nextWorldPoint,
    };
  }, []);

  const resetRuntime = useCallback(() => {
    brokenPanesRef.current = createBrokenPaneState();
    breakEventsRef.current = createBreakEventState();
    resetNonceRef.current += 1;
    waterLevelRef.current = tankRef.current.waterLevel;
  }, []);

  return useMemo(
    () => ({
      breakPane,
      getPaneBreakEvent: (paneKey) => breakEventsRef.current[paneKey] ?? null,
      getResetNonce: () => resetNonceRef.current,
      getWaterLevel: () => waterLevelRef.current,
      getBrokenPaneCount: () =>
        FISH_TANK_PANE_KEYS.reduce(
          (count, paneKey) => count + (brokenPanesRef.current[paneKey] ? 1 : 0),
          0
        ),
      getFirstBrokenPane: () =>
        FISH_TANK_PANE_KEYS.find(
          (paneKey) => brokenPanesRef.current[paneKey]
        ) || null,
      isAnyPaneBroken: () =>
        FISH_TANK_PANE_KEYS.some((paneKey) => brokenPanesRef.current[paneKey]),
      isFrontPaneBroken: () => brokenPanesRef.current.front,
      isPaneBroken: (paneKey) => Boolean(brokenPanesRef.current[paneKey]),
      resetRuntime,
    }),
    [breakPane, resetRuntime]
  );
}
