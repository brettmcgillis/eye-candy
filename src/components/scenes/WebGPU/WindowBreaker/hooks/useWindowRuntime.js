import { useCallback, useMemo, useRef } from 'react';

// Tracks which procedural panes are broken and the impact that broke each one.
// Pane keys are dynamic (one per window quadrant), so state is a plain map
// rather than the fixed key list the fish tank used.
export default function useWindowRuntime() {
  const brokenRef = useRef({});
  const eventsRef = useRef({});
  const resetNonceRef = useRef(0);

  const breakPane = useCallback((paneKey, worldPoint) => {
    if (!paneKey || brokenRef.current[paneKey]) {
      return;
    }
    brokenRef.current[paneKey] = true;
    eventsRef.current[paneKey] = {
      id: (eventsRef.current[paneKey]?.id ?? 0) + 1,
      atSeconds: performance.now() / 1000,
      worldPoint: Array.isArray(worldPoint)
        ? worldPoint
        : (worldPoint?.toArray?.() ?? [0, 0, 0]),
    };
  }, []);

  const resetRuntime = useCallback(() => {
    brokenRef.current = {};
    eventsRef.current = {};
    resetNonceRef.current += 1;
  }, []);

  return useMemo(
    () => ({
      breakPane,
      resetRuntime,
      isPaneBroken: (paneKey) => Boolean(brokenRef.current[paneKey]),
      getPaneBreakEvent: (paneKey) => eventsRef.current[paneKey] ?? null,
      getResetNonce: () => resetNonceRef.current,
      getBrokenCount: () => Object.keys(brokenRef.current).length,
    }),
    [breakPane, resetRuntime]
  );
}
