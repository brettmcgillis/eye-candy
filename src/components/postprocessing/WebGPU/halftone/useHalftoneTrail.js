import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { easing } from 'maath';

import { createMouseTrail } from '@modules/tsl';

const POINTER_SMOOTHING = 0.075;

// The cursor-velocity trail `displacedRings` reads. Returns `null` for every
// other variant so nothing is allocated or rendered for them. Call `render`
// from the effect's own useFrame, before the post pass.
export default function useHalftoneTrail(enabled) {
  const { gl: renderer, size } = useThree();
  const trail = useMemo(() => (enabled ? createMouseTrail() : null), [enabled]);
  const smoothed = useRef({ x: -2, y: -2 });
  const previous = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!trail) return undefined;
    const dpr = renderer.getPixelRatio();
    trail.setSize(
      Math.max(1, Math.floor(size.width * dpr)),
      Math.max(1, Math.floor(size.height * dpr))
    );
    return undefined;
  }, [trail, renderer, size]);

  useEffect(() => () => trail?.dispose(), [trail]);

  const render = useCallback(
    (state, delta) => {
      if (!trail) return;
      const target = smoothed.current;
      easing.damp(
        target,
        'x',
        (state.pointer.x + 1) * 0.5,
        POINTER_SMOOTHING,
        delta
      );
      easing.damp(
        target,
        'y',
        (1 - state.pointer.y) * 0.5,
        POINTER_SMOOTHING,
        delta
      );

      const dt = delta + 1e-6;
      trail.uniforms.mouseVelocity.value.set(
        (target.x - previous.current.x) / dt,
        (target.y - previous.current.y) / dt
      );
      trail.uniforms.mousePosition.value.set(target.x, target.y);
      trail.render(renderer);

      previous.current.x = target.x;
      previous.current.y = target.y;
    },
    [trail, renderer]
  );

  return { trail, render };
}
