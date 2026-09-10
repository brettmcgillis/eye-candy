import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';

import applyControls from '../utils/applyControls';
import createRuntime from '../utils/createRuntime';
import {
  PALETTE_NONE,
  createNeutralPaletteTexture,
  createPaletteTexture,
} from '../utils/palette';
import createUniforms, { createInkUniforms } from '../utils/uniforms';

// The ceiling the walker buffers are allocated against. Must not be below the
// Lines control's maximum.
const MAX_WALKERS = 20000;

// Controls that only reinterpret a page that already exists. Everything else
// changes what would be drawn, and marks are permanent, so changing one of
// those has to start the drawing over.
const PAGE_ONLY = new Set([
  'groundColor',
  'lineColor',
  'lineSoftness',
  'lineThreshold',
  'palette',
  'paletteMix',
  'paletteShift',
  'renderScale',
  'stepsPerFrame',
]);

export default function useContourPipeline(config) {
  const { gl, size } = useThree();

  useRenderScale(config.renderScale);

  const uniforms = useMemo(() => createUniforms(), []);
  const inkUniforms = useMemo(() => createInkUniforms(), []);
  const neutralPalette = useMemo(() => createNeutralPaletteTexture(), []);

  // The page matches the window's aspect so its texels stay square on screen —
  // a clearance measured on stretched texels would be a different gap
  // horizontally than vertically. Bucketed, or dragging a window edge would
  // reallocate on every intermediate pixel.
  const aspect = Math.max(
    0.2,
    Math.round((size.width / Math.max(1, size.height)) * 20) / 20
  );

  const grid = useMemo(
    () => ({
      height: Math.max(128, Math.round(config.fieldResolution / aspect)),
      width: config.fieldResolution,
    }),
    [aspect, config.fieldResolution]
  );

  const runtime = useMemo(
    () =>
      createRuntime({
        gridHeight: grid.height,
        gridWidth: grid.width,
        inkUniforms,
        maxCount: MAX_WALKERS,
        paletteTexture: neutralPalette,
        reactionHeight: Math.max(
          64,
          Math.round(config.reactionResolution / aspect)
        ),
        reactionWidth: config.reactionResolution,
        uniforms,
      }),
    [
      aspect,
      config.reactionResolution,
      grid,
      inkUniforms,
      neutralPalette,
      uniforms,
    ]
  );

  useEffect(() => () => runtime.dispose(), [runtime]);

  useEffect(() => {
    const selected =
      config.palette === PALETTE_NONE
        ? null
        : createPaletteTexture(config.palette);

    runtime.setPalette(selected || neutralPalette);
    return () => selected?.dispose();
  }, [config.palette, neutralPalette, runtime]);

  const live = useRef(config);
  live.current = config;

  const drawKey = useMemo(
    () =>
      Object.keys(config)
        .filter((key) => !PAGE_ONLY.has(key))
        .sort()
        .map((key) => `${key}=${config[key]}`)
        .join('|'),
    [config]
  );

  const seeded = useRef(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    const c = live.current;

    applyControls({
      config: c,
      inkUniforms,
      reactionField: runtime.reactionField,
      uniforms,
    });
    runtime.setCount(c.walkerCount);

    // The first frame after a rebuild owns the seeding, because compute needs a
    // renderer and an effect can run before this one has anything to dispatch.
    if (
      seeded.current?.runtime !== runtime ||
      seeded.current?.key !== drawKey
    ) {
      uniforms.spawnSalt.value = c.seed * 97.13;
      elapsed.current = 0;
      runtime.reset(gl);
      seeded.current = { key: drawKey, runtime };
    }

    elapsed.current += Math.min(delta, 1 / 30);
    uniforms.time.value = elapsed.current;

    runtime.step(gl, {
      reactionActive: c.reactionWeight > 0.0001,
      steps: Math.max(1, Math.round(c.stepsPerFrame)),
    });
  });

  return runtime.material;
}
