import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  createCanvasPainter,
  createWinterkammerRun,
  pieceFromConfig,
} from '@modules/isoMeter';

import { generatorKey, stopsFor } from '../utils/pieceInputs';

const FPS = 30;
const STEP = 1 / FPS;
const STILL_FRAMES = 160;
const MAX_DELTA = 0.25;

function createSurface({ config, dpr, height, width }) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const piece = pieceFromConfig(config, {
    aspect: width / height,
    stops: stopsFor(config),
  });
  const run = createWinterkammerRun(piece, { fps: FPS });
  const base = createCanvasPainter(canvas.getContext('2d'), {
    height,
    mirroredX: piece.mirroredX,
    mirroredY: piece.mirroredY,
    pixelRatio: dpr,
    refSize: piece.refSize,
    width,
  });
  let dirty = false;
  const painter = Object.fromEntries(
    Object.entries(base).map(([name, fn]) => [
      name,
      (...args) => {
        dirty = true;
        fn(...args);
      },
    ])
  );
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return {
    painter,
    piece,
    run,
    takeDirty() {
      const was = dirty;
      dirty = false;
      return was;
    },
    texture,
  };
}

export default function useWinterkammerCanvas(config) {
  const { motion, replay } = config;
  const key = generatorKey(config);
  const width = useThree((state) => Math.round(state.size.width));
  const height = useThree((state) => Math.round(state.size.height));
  const dpr = useThree((state) => state.viewport.dpr);
  const surface = useMemo(
    () => createSurface({ config, dpr, height, width }),
    [dpr, height, key, replay, width]
  );
  const clockRef = useRef(0);
  const still = motion === 'still';

  useEffect(() => () => surface.texture.dispose(), [surface]);

  useEffect(() => {
    clockRef.current = 0;
    if (!still) return;
    while (surface.run.frame < STILL_FRAMES) surface.run.step(surface.painter);
  }, [still, surface]);

  useFrame((_, delta) => {
    if (!still) {
      clockRef.current += Math.min(delta, MAX_DELTA);
      while (clockRef.current >= STEP) {
        clockRef.current -= STEP;
        surface.run.step(surface.painter);
      }
    }
    if (surface.takeDirty()) surface.texture.needsUpdate = true;
  });

  return surface;
}
