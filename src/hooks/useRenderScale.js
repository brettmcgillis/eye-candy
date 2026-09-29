import { useEffect } from 'react';

import { create } from 'zustand';

// R3F's `Canvas` re-runs `configure()` on every render — its layout effect has
// no dependency array — and `configure` writes the `dpr` prop back over
// `viewport.dpr`. A scene that calls `state.setDpr()` itself therefore holds
// its render scale only until the next Canvas render, at which point R3F
// silently restores full device pixel ratio. So the scale has to reach the
// Canvas as its `dpr` prop, which is what this store is for.
const MAX_DPR = 1.5;

const useStore = create(() => ({ scale: 1 }));

export function useCanvasDpr() {
  const base =
    typeof window === 'undefined'
      ? 1
      : Math.min(window.devicePixelRatio, MAX_DPR);

  return base * useStore((state) => state.scale);
}

export default function useRenderScale(scale) {
  useEffect(() => {
    useStore.setState({ scale });
    return () => useStore.setState({ scale: 1 });
  }, [scale]);
}
