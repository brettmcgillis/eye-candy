import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { createWinterkammerRun, pieceFromConfig } from '@modules/isoMeter';
import { createWinterkammerStage } from '@modules/isoMeterRender';

import { generatorKey, stopsFor } from '../utils/pieceInputs';

const FPS = 30;
const STEP = 1 / FPS;
const STILL_FRAMES = 160;
const MAX_DELTA = 0.25;
export default function useVoxelWinterkammer(config) {
  const { materials, motion, replay, stackDepth } = config;
  const key = generatorKey(config);
  const width = useThree((state) => Math.round(state.size.width));
  const height = useThree((state) => Math.round(state.size.height));
  const surface = useMemo(() => {
    const piece = pieceFromConfig(config, {
      aspect: width / height,
      stops: stopsFor(config),
    });
    return {
      piece,
      run: createWinterkammerRun(piece, { fps: FPS }),
      stage: createWinterkammerStage(piece, materials),
    };
  }, [height, key, materials, replay, width]);
  const clockRef = useRef(0);
  const still = motion === 'still';

  useEffect(() => () => surface.stage.dispose(), [surface]);

  useEffect(() => {
    surface.stage.layout(stackDepth, surface.piece.aspect);
  }, [stackDepth, surface]);

  useEffect(() => {
    clockRef.current = 0;
    if (!still) return;
    while (surface.run.frame < STILL_FRAMES) surface.run.step(null);
  }, [still, surface]);

  useFrame((_, delta) => {
    if (!still) {
      clockRef.current += Math.min(delta, MAX_DELTA);
      while (clockRef.current >= STEP) {
        clockRef.current -= STEP;
        surface.run.step(null);
      }
    }
    surface.stage.sync();
  });

  return surface;
}
