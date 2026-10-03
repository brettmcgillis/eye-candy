import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';
import { evolveConfig, sweepOffset } from '@modules/apollian';
import { createApollianRig, getPaletteStops } from '@modules/apollianRender';

const MAX_DELTA = 1 / 15;

function animate(c, seconds) {
  switch (c.motionMode) {
    case 'spin':
      return {
        ...c,
        objectSpin: c.objectSpin + (360 * seconds) / c.turntableSeconds,
      };
    case 'sweep':
      return { ...c, sliceOffset: sweepOffset(c, seconds) };
    case 'evolve':
      return evolveConfig(c, seconds);
    default:
      return c;
  }
}

function Stage({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const clock = useRef(0);

  useRenderScale(config.renderScale);

  const rig = useMemo(createApollianRig, []);
  const stops = useMemo(
    () => getPaletteStops(config.paletteName),
    [config.paletteName]
  );

  useEffect(() => () => rig.dispose(), [rig]);

  useFrame((state, delta) => {
    const c = configRef.current;
    clock.current += Math.min(delta, MAX_DELTA) * c.motionSpeed;
    const { dpr } = state.viewport;
    const { size } = state;
    rig.apply(animate(c, clock.current), {
      height: size.height * dpr,
      stops,
      view: c.sceneView,
      width: size.width * dpr,
    });
  });

  return <primitive object={rig.mesh} />;
}

export default memo(Stage);
