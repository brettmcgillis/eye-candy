/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import {
  CONFIG_KEYS,
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/candle/renderOptions.mjs';
import { createParseCli, withRenderer } from './generatorCli.mjs';
import {
  advanceFrame,
  createHeadlessRenderer,
  loadThree,
  setClock,
  stubCanvas,
} from './headlessWebgpu.mjs';
import loadModules from './loadModules.mjs';
import { installTextureLoader, until } from './r3fHeadless.mjs';

// Barrels only — see docs/candle-pipeline.md.
const ENTRIES = {
  candle: '/src/modules/candle/index.js',
  look: '/src/modules/candleRender/index.js',
};

const FPS = 60;

export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  installTextureLoader(THREE);
  const loaded = await loadModules(Object.values(ENTRIES), {
    noExternal: ['@react-three/fiber'],
  });
  return {
    THREE,
    TSL,
    candle: loaded[ENTRIES.candle],
    look: loaded[ENTRIES.look],
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { candle } = kernel;
  const generation = new Set(CONFIG_KEYS);
  return {
    base: options.base ? candle.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => generation.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function candleAt(kernel, { batch, index, roll }) {
  const { candle } = kernel;
  const name = candle.seedFor(batch, index);
  return { config: candle.rollCandleConfig(name, roll), name };
}

// One renderer and one R3F root per output size: the real CandleStage
// mounted with no frame loop, burned at 60 fps for the settle, then
// captured.
export async function createCandleCapturer(
  kernel,
  { height, pixelRatio, transparent, width }
) {
  const { candle, look } = kernel;
  const headless = await createHeadlessRenderer({
    height: height * pixelRatio,
    width: width * pixelRatio,
  });
  const { renderer, target } = headless;
  renderer.setOutputRenderTarget(target);
  const stage = await look.createStageRoot({
    canvas: stubCanvas(width * pixelRatio, height * pixelRatio),
    height,
    pixelRatio,
    renderer,
    width,
  });
  const captureDepth = look.createDepthCapture(renderer);
  const solidsRef = { current: null };
  const effectsRef = { current: null };
  const nativeRandom = Math.random;
  let clock = 0;
  let current = null;

  // eslint-disable-next-line no-underscore-dangle
  const { nodeFrame } = renderer._nodes;

  const step = (seconds) => {
    nodeFrame.deltaTime = seconds - clock;
    nodeFrame.time = seconds;
    clock = seconds;
    setClock(seconds);
    stage.step(seconds);
  };

  async function frame(seconds) {
    setClock(seconds);
    return headless.readFrame(() => {
      clock = seconds;
      stage.step(seconds);
    });
  }

  const aim = (view) => look.aimCamera(stage.camera, view, width / height);

  return {
    // Mounts a generation and burns its settle time (the hero camera
    // aimed, so the smoke sorts for it); returns the clock it settled at and
    // the bounds the framing fits.
    async load(config, name = 'candle', { options, snuffAt = null } = {}) {
      Math.random = candle.burnRandom(name);
      solidsRef.current = null;
      effectsRef.current = null;
      current = config;
      await stage.mount({
        config,
        effectsRef,
        snuffAt,
        solidsRef,
        transparent,
      });
      await until(() => solidsRef.current, 'the candle to build', 20000);
      await stage.flush();
      const form = candle.candleForm(config);
      const bounds = candle.candleBounds(config, form);
      if (options) {
        aim(candle.frameCandle({ bounds, options, view: 'hero' }));
      }
      clock = 0;
      const frames = Math.max(1, Math.round((config.settle ?? 0) * FPS));
      step(0);
      for (let f = 1; f <= frames; f += 1) {
        step(f / FPS);
        if (f % 30 === 0) await new Promise(setImmediate);
      }
      return { bounds, start: clock };
    },

    // Burns on from the settled clock, as the live stage would.
    async burn(seconds) {
      const frames = Math.round(seconds * FPS);
      const from = clock;
      for (let f = 1; f <= frames; f += 1) {
        step(from + f / FPS);
        if (f % 30 === 0) await new Promise(setImmediate);
      }
    },

    async capture(view, seconds = clock) {
      aim(view);
      return frame(seconds);
    },

    async svg(view, options) {
      aim(view);
      const solids = solidsRef.current;
      const effects = effectsRef.current;
      const w = width * pixelRatio;
      const h = height * pixelRatio;
      const depth = candle.needsDepth(options)
        ? await captureDepth(
            stage.scene,
            stage.camera,
            w,
            h,
            look.candleMeshes(solids)
          )
        : null;
      const image = candle.needsImage(options) ? await frame(clock) : null;
      let flames = [];
      let flameGlow = null;
      if (options.svgIsotherms > 0 && current.flame === 'sim') {
        flames = await look.readFlameFields(effects);
      } else if (options.svgIsotherms > 0 && current.flame !== 'out') {
        advanceFrame();
        const lit = await frame(clock);
        look.showEffects(stage.scene, 'flame', false);
        const dark = await frame(clock);
        look.showEffects(stage.scene, 'flame', true);
        flameGlow = look.effectGlow(lit, dark);
      }
      let smoke = null;
      if (
        options.svgSmokeDots > 0 &&
        (current.smoke === 'billboard' || current.smoke === 'ribbon')
      ) {
        advanceFrame();
        const shown = await frame(clock);
        look.showEffects(stage.scene, 'smoke', false);
        const hidden = await frame(clock);
        look.showEffects(stage.scene, 'smoke', true);
        smoke = {
          density: options.svgSmokeDots,
          glow: look.effectGlow(shown, hidden),
        };
      }
      if (options.svgSmokeDots > 0 && current.smoke === 'curl') {
        smoke =
          current.look === 'realistic'
            ? {
                density: options.svgSmokeDots,
                dots: await look.readSmokeDots(effects),
              }
            : { balls: await look.readSmokeBalls(effects) };
      }
      return candle.renderCandleSvg({
        ...candle.plotArgs(options),
        camera: view,
        coverage: depth,
        flameGlow,
        flames,
        image,
        smoke,
        visible: options.svgOcclusion
          ? look.depthProbe(depth, pixelRatio, 0.01)
          : null,
        wax: look.readWax(solids),
      });
    },

    get clock() {
      return clock;
    },

    // The candle-only depth pass at `view`, for checks.
    async candleDepth(view) {
      aim(view);
      return captureDepth(
        stage.scene,
        stage.camera,
        width * pixelRatio,
        height * pixelRatio,
        look.candleMeshes(solidsRef.current)
      );
    },

    // The mounted stage's parts, for checks that read them back.
    get parts() {
      return {
        effects: effectsRef.current,
        frame,
        solids: solidsRef.current,
        stage,
      };
    },

    dispose() {
      Math.random = nativeRandom;
      stage.unmount();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createCandleCapturer(kernel, {
        height: options.height,
        pixelRatio: options.pixelRatio,
        transparent: options.transparent,
        width: options.width,
      }),
    work
  );
