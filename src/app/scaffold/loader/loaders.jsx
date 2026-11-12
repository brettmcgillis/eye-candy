import React, { useEffect } from 'react';

import { drawLayers } from './drawFrame';
import MOTIONS from './motions';
import { CanvasFrame, useLoaderCanvas, useSquares } from './primitives';
import STYLES from './styles';

export { MOTIONS, STYLES };

export function makeLoader(motion, style) {
  function PatternLoader() {
    const squares = useSquares();
    useEffect(() => {
      style.prepare?.();
    }, []);
    const canvasRef = useLoaderCanvas((ctx, t) =>
      drawLayers(ctx, motion.frame(squares, t), style)
    );
    return <CanvasFrame canvasRef={canvasRef} />;
  }
  PatternLoader.id = `${motion.id}.${style.id}`;
  PatternLoader.displayName = `Loader(${PatternLoader.id})`;
  PatternLoader.label = `${motion.label} · ${style.label}`;
  PatternLoader.motion = motion;
  PatternLoader.style = style;
  PatternLoader.cycleDuration = motion.cycleDuration;
  return PatternLoader;
}

export const ALL_LOADERS = MOTIONS.flatMap((motion) =>
  STYLES.map((style) => makeLoader(motion, style))
);

export function getLoader(motionId, styleId) {
  return ALL_LOADERS.find(
    (L) => L.motion.id === motionId && L.style.id === styleId
  );
}
