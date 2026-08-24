/* eslint-disable import/no-extraneous-dependencies */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createServer } from 'vite';

import createCapturer from './gpuCapture.mjs';
import overlaySvg from './overlaySvg.mjs';

export const REPO_ROOT = path.resolve(
  fileURLToPath(new URL('../..', import.meta.url))
);
const SCENE = '/src/components/scenes/WebGPU/Rorschach';

// The overlay is identical on every frame of a run, but building it costs a
// handful of sharp calls (text measurement) and rasterising it costs more —
// together about 1.2s, which dwarfed the frame itself. Built and rasterised
// once per geometry instead.
const overlayCache = new Map();

async function overlayLayer({ height, ig, version, viewport, width }) {
  const key = `${width}x${height}:${ig ?? 'none'}:${viewport ?? 'auto'}:${version}`;
  if (!overlayCache.has(key)) {
    overlayCache.set(
      key,
      overlaySvg({
        height,
        ig,
        repoRoot: REPO_ROOT,
        version,
        viewport,
        width,
      }).then((svg) => sharp(Buffer.from(svg)).png().toBuffer())
    );
  }
  return overlayCache.get(key);
}

// One WebGPU renderer per output size, reused across every frame of a run —
// device + pipeline setup is by far the most expensive part of a capture.
const capturerCache = new Map();

function capturerFor(width, height) {
  const key = `${width}x${height}`;
  if (!capturerCache.has(key)) {
    capturerCache.set(key, createCapturer({ height, width }));
  }
  return capturerCache.get(key);
}

export async function disposeCapturers() {
  const pending = [...capturerCache.values()];
  capturerCache.clear();
  await Promise.all(
    pending.map(async (promise) => {
      const capturer = await promise;
      capturer.dispose();
    })
  );
}

// Shared by scripts/rorschach-generate.mjs and scripts/rorschach-video.mjs so
// a video frame and a still of the same test are pixel-identical.

// Three blur levels standing in for BloomNode's mip chain, each twice the
// radius and weaker than the last. One level reads as a flat halo; the spread
// between them is what makes a glow fall off the way the real thing does.
const BLOOM_LEVELS = [
  { sigmaScale: 1, weight: 1 },
  { sigmaScale: 2, weight: 0.6 },
  { sigmaScale: 4, weight: 0.35 },
];

export async function loadSceneModules() {
  const server = await createServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'error',
    // Nothing here is served to a browser, and with no index.html to crawl
    // the dependency scanner just errors noisily on the SSR entry points.
    optimizeDeps: { noDiscovery: true },
    root: REPO_ROOT,
    server: { middlewareMode: true },
  });

  try {
    const [roll, generator, renderer] = await Promise.all([
      server.ssrLoadModule(`${SCENE}/utils/rollConfig.js`),
      server.ssrLoadModule(`${SCENE}/utils/testGenerator.js`),
      server.ssrLoadModule(`${SCENE}/utils/renderTestSvg.js`),
    ]);
    const [overrides, geometry] = await Promise.all([
      server.ssrLoadModule(`${SCENE}/hooks/buildBundleOverrideSchema.js`),
      server.ssrLoadModule(`${SCENE}/utils/buildStrokeGeometry.js`),
    ]);
    return {
      computeStyles: generator.computeStyles,
      generateStructure: generator.generateStructure,
      growBundle: generator.growBundle,
      buildOverridesFromControls: overrides.buildOverridesFromControls,
      geometryHelpers: geometry,
      hasBloomContent: renderer.hasBloomContent,
      viewEye: renderer.viewEye,
      orbitEye: renderer.orbitEye,
      randomSeed: roll.randomSeed,
      renderTestSvg: renderer.default,
      rollTestConfig: roll.default,
    };
  } finally {
    await server.close();
  }
}

// The Bundle Editor's nested override shape is derived by the scene's own
// buildOverridesFromControls rather than re-implemented here. An earlier local
// copy only mapped the fields `rollConfig` happens to set, so a real preset's
// Color Override and Structural Override were silently dropped — preset 005's
// red emissive bundle rendered in its palette color instead.
export function overridesFromConfig(modules, config) {
  return modules.buildOverridesFromControls(config);
}

export function buildTest(modules, config) {
  const overrides = overridesFromConfig(modules, config);
  const structure = modules.generateStructure(config.seed, {
    ...config,
    overrides,
  });
  // generateStructure only integrates a validated prefix; the app grows the
  // rest a slice per frame. Nothing here animates the integration itself, so
  // finish it in one call and let setGrowth reveal it.
  structure.bundles.forEach((bundle) =>
    modules.growBundle(bundle, bundle.steps)
  );

  return {
    ...structure,
    styles: modules.computeStyles(config.seed, config.bundleCount, {
      ...config,
      overrides,
    }),
  };
}

// Reveals `fraction` of an already-integrated test by moving each bundle's
// draw cursor — the same thing Test.jsx animates per frame. Cheap: the ODE
// work is already done, so a cinematic sweep generates each system once and
// then only re-renders it.
export function setGrowth(test, fraction) {
  test.bundles.forEach((bundle) => {
    // eslint-disable-next-line no-param-reassign
    bundle.grownSteps = Math.max(
      2,
      Math.min(bundle.steps, Math.round(bundle.steps * fraction))
    );
  });
}

// Additively composites blurred copies of the thresholded bright pass over the
// base render — the same shape as the scene's post pass. Runs at 16 bits so
// repeated adds don't band.
async function rasterBloom(
  baseSvg,
  brightSvg,
  { height, radius, strength, width }
) {
  const baseSigma = Math.max(1, radius * 0.006 * Math.min(width, height));
  const bright = await sharp(Buffer.from(brightSvg)).removeAlpha().toBuffer();

  const glows = await Promise.all(
    BLOOM_LEVELS.map(({ sigmaScale, weight }) =>
      sharp(bright)
        .blur(baseSigma * sigmaScale)
        .linear(strength * weight, 0)
        .toBuffer()
    )
  );

  return sharp(Buffer.from(baseSvg))
    .pipelineColourspace('rgb16')
    .composite(glows.map((input) => ({ blend: 'add', input })))
    .toColourspace('srgb')
    .png()
    .toBuffer();
}

export function frameSvg(modules, { config, options, test, ...view }) {
  return modules.renderTestSvg({
    backgroundColor: config.backgroundColor,
    bundles: test.bundles,
    distance: options.distance,
    flatten: options.flatten,
    flattenAxis: options.flattenAxis,
    fov: options.fov,
    height: options.height,
    scale: test.scale,
    simplifyPx: options.simplify,
    strokeWidth: options.stroke || Math.max(1, options.width / 900),
    styles: test.styles,
    width: options.width,
    ...view,
  });
}

async function withOverlay(png, options) {
  if (!options.overlay) return png;

  const overlay = await overlayLayer({
    height: options.height,
    ig: options.ig,
    version: options.version,
    viewport: options.viewport,
    width: options.width,
  });
  return sharp(png)
    .composite([{ input: overlay }])
    .png()
    .toBuffer();
}

// The SVG path: flat polylines rasterised by sharp, with bloom approximated as
// a blurred bright pass. Kept as a fallback and as the basis of the .svg
// output, but `gpu` is the default because it runs the scene's real post chain.
async function renderFrameSvg(modules, { config, options, test, ...view }) {
  const svg = (extra) =>
    frameSvg(modules, { config, options, test, ...view, ...extra });

  const blooms =
    options.bloom &&
    modules.hasBloomContent({
      backgroundColor: config.backgroundColor,
      bloomThreshold: options.bloomThreshold,
      styles: test.styles,
    });

  if (!blooms) {
    return sharp(Buffer.from(svg({ bloomEnabled: false })))
      .png()
      .toBuffer();
  }

  return rasterBloom(
    svg({ bloomEnabled: false }),
    svg({
      bloomEnabled: false,
      bloomThreshold: options.bloomThreshold,
      layer: 'bright',
    }),
    {
      height: options.height,
      radius: options.bloomRadius,
      strength: options.bloomStrength,
      width: options.width,
    }
  );
}

// Renders one frame to a PNG buffer, then composites the overlay burn-in.
// `options.renderer` picks between the real WebGPU capture and the SVG
// approximation.
export async function renderFrame(modules, { config, options, test, ...view }) {
  if (options.renderer === 'svg') {
    const png = await renderFrameSvg(modules, {
      config,
      options,
      test,
      ...view,
    });
    return withOverlay(png, options);
  }

  const capturer = await capturerFor(options.width, options.height);
  const png = await capturer.capture({
    config,
    eye: view.eye ?? modules.viewEye(view.view ?? 'front', options.distance),
    geometryHelpers: modules.geometryHelpers,
    options,
    target: view.target ?? [0, 0, 0],
    test,
  });
  return withOverlay(png, options);
}
