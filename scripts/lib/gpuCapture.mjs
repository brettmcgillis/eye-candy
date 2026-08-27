/* eslint-disable import/no-extraneous-dependencies */
import sharp from 'sharp';

// Renders the Rorschach scene through the real three.js WebGPU renderer in
// Node, so the PNG carries the actual post-processing chain rather than an
// approximation of it. The `webgpu` package supplies a Dawn-backed
// navigator.gpu; three otherwise runs exactly as it does in the browser.
//
// The scene is built imperatively here rather than mounted through R3F, so the
// material and post setup below must stay in step with
// components/TestStrokes.jsx and components/PostEffects.jsx.

let THREE = null;
let TSL = null;
let bloomModule = null;
let gpuInstance = null;

// three touches a handful of browser globals during construction. Only the
// ones it actually reaches are stubbed; the canvas never backs a swapchain
// because every render goes to a RenderTarget.
async function installBrowserGlobals() {
  if (THREE) return;

  const webgpu = await import('webgpu');
  gpuInstance = webgpu.create([]);

  globalThis.navigator = { ...globalThis.navigator, gpu: gpuInstance };
  globalThis.self = globalThis;
  globalThis.requestAnimationFrame = (cb) =>
    setTimeout(() => cb(Date.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  Object.assign(globalThis, webgpu.globals);

  THREE = await import('three/webgpu');
  TSL = await import('three/tsl');
  bloomModule = await import('three/addons/tsl/display/BloomNode.js');
}

function stubCanvas(width, height) {
  const context = {
    configure() {},
    unconfigure() {},
    getCurrentTexture() {
      throw new Error('headless capture never presents to a swapchain');
    },
  };
  return {
    addEventListener() {},
    getBoundingClientRect: () => ({
      bottom: height,
      height,
      left: 0,
      right: width,
      top: 0,
      width,
      x: 0,
      y: 0,
    }),
    getContext: () => context,
    height,
    removeEventListener() {},
    style: {},
    width,
  };
}

// Mirrors components/TestStrokes.jsx: unlit line material whose color is
// multiplied by the emissive intensity in linear space and left unclamped, with
// tone mapping off so values above 1.0 survive to the bloom pass. Growth/trail
// fade are omitted deliberately — a captured frame is never mid-fade.
function buildMaterial(style) {
  const { attribute, float, uniform } = TSL;
  const material = new THREE.LineBasicNodeMaterial({
    alphaTest: 0.005,
    depthTest: true,
    depthWrite: true,
    transparent: true,
  });

  const emissive = style.emissive === true;
  const intensity = emissive ? (style.emissiveIntensity ?? 2) : 1;
  const color = new THREE.Color().setHSL(
    style.color.h,
    style.color.s,
    style.color.l
  );

  material.colorNode = uniform(color).mul(uniform(intensity));
  material.opacityNode = float(1).sub(attribute('segHidden', 'float'));
  material.toneMapped = !emissive;
  return material;
}

function buildGeometry(bundle, buildStrokeGeometry, writeStrokePositions) {
  const geometry = buildStrokeGeometry(bundle.strands.length, bundle.steps);
  writeStrokePositions(geometry, bundle.strands, bundle.steps);
  geometry.setDrawRange(0, (bundle.grownSteps - 1) * bundle.strands.length * 2);
  return geometry;
}

// WebGPU's copyTextureToBuffer aligns each row to 256 bytes and three returns
// that padded buffer as-is, so any width that isn't a multiple of 64 pixels
// comes back with trailing bytes per row. Reading it as tightly packed shears
// the image progressively down the frame.
function unpadRows(pixels, width, height) {
  const tightBytes = width * 4;
  const paddedBytes = Math.ceil(tightBytes / 256) * 256;
  const source = Buffer.from(
    pixels.buffer ?? pixels,
    pixels.byteOffset ?? 0,
    pixels.byteLength ?? pixels.length
  );
  if (paddedBytes === tightBytes) return source;

  const out = Buffer.allocUnsafe(tightBytes * height);
  for (let row = 0; row < height; row += 1) {
    source.copy(
      out,
      row * tightBytes,
      row * paddedBytes,
      row * paddedBytes + tightBytes
    );
  }
  return out;
}

// The ink layer is built and settled per capture rather than cached: a still is
// a specific number of sim steps from a clean field, which is what makes the
// same seed produce the same blot. Reusing a warm sim across captures would
// make each frame depend on the one before it.
function buildInkPaper(kernel, renderer, options, test, config) {
  // The rolled config carries every ink parameter the dice can set, and the
  // caller's pins were folded into it before it got here — so config wins
  // wherever it has an opinion, and `options` supplies only the knobs the roll
  // never touches (resolution, settle, orientation, paper size, debug).
  const ink = (key) => config[key] ?? options[key];
  const paper = kernel.createInkPaper({
    orientation: ink('inkOrientation'),
    paperGrain: ink('inkPaperGrain'),
    paperOffset: ink('inkOffset'),
    paperSize: ink('inkPaperSize'),
    renderer,
    resolution: ink('inkResolution'),
    // The scene needs a catch-up on a freshly cleared field because it is being
    // watched while it settles; a capture is not, and it passes the exact step
    // count it wants. Leaving the catch-up on made --inkSettle mean "this many
    // steps, plus ninety", so the flag never meant what it said.
    settleOnReset: 0,
    tonalGap: ink('inkTonalGap'),
    seed: config.seed,
    simParams: {
      ...kernel.mapPatternSettings({
        cellAmount: ink('inkCellAmount'),
        cellFlatten: ink('inkCellFlatten'),
        cellReveal: ink('inkCellReveal'),
        cellRevealScale: ink('inkCellRevealScale'),
        cellScale: ink('inkCellScale'),
        cellSymmetry: ink('inkCellSymmetry'),
        density: ink('inkPatternDensity'),
        paletteMix: ink('inkPaletteMix'),
        paletteScale: ink('inkPaletteScale'),
        paletteSymmetry: ink('inkPaletteSymmetry'),
        details: ink('inkPatternDetails'),
        scale: ink('inkPatternScale'),
        seed: (config.seed % 1000) / 100,
        sharpness: ink('inkPatternSharpness'),
        softness: ink('inkPatternSoftness'),
        symmetry: ink('inkPatternSymmetry'),
      }),
      bloomEmissiveOnly: ink('inkBloomEmissiveOnly') ? 1 : 0,
      bloomEnabled: ink('inkBloom') ? 1 : 0,
      inkDesaturate: ink('inkDesaturate'),
      inkRecede: ink('inkRecede'),
      bloomSource: ink('inkBloomSource') === 'wetness' ? 1 : 0,
      bloomStrength: ink('inkBloomStrength'),
      bloomThreshold: options.bloomThreshold,
      patternDeposit: ink('inkPatternWash'),
      patternFade: ink('inkPatternFade'),
      patternFlow: ink('inkPatternFlow'),
    },
  });

  // A still pins the pattern clock so the same seed and --inkPatternTime always
  // produce the same frame.
  paper.setBackdropColor(config.backgroundColor);
  paper.setPatternTime(ink('inkPatternTime') ?? 0);
  paper.setPatternSpeed(0);
  paper.advance({
    steps: ink('inkSettle'),
    styles: test.styles,
  });
  return paper;
}

function applyGroupScale(group, scale, flatten, flattenAxis) {
  const squash = 1 - flatten;
  if (flattenAxis === 'y') group.scale.set(scale, scale * squash, scale);
  else group.scale.set(scale, scale, scale * squash);
}

export default async function createCapturer({ height, samples = 4, width }) {
  await installBrowserGlobals();

  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    canvas: stubCanvas(width, height),
    forceWebGPU: true,
  });
  renderer.setSize(width, height, false);
  await renderer.init();

  // NoColorSpace, not SRGBColorSpace: the RenderPipeline's output node already
  // encodes to the renderer's output color space, and an sRGB target would
  // encode a second time — a #5a5a5a background read back as 161, exactly the
  // double-encoded value.
  const target = new THREE.RenderTarget(width, height, {
    colorSpace: THREE.NoColorSpace,
    depthBuffer: true,
  });

  let session = null;

  function disposeSession() {
    session?.disposables.forEach((item) => item.dispose());
    session = null;
  }

  function createSession({ config, geometryHelpers, options, test }) {
    disposeSession();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    const camera = new THREE.PerspectiveCamera(
      options.fov,
      width / height,
      0.1,
      1000
    );
    const group = new THREE.Group();
    const disposables = [];
    const strokes = [];

    if (options.lines !== false) {
      test.bundles.forEach((bundle, index) => {
        const style = test.styles[index];
        if (!style || style.visible === false) return;

        const geometry = buildGeometry(
          bundle,
          geometryHelpers.buildStrokeGeometry,
          geometryHelpers.writeStrokePositions
        );
        const material = buildMaterial(style);
        const mesh = new THREE.LineSegments(geometry, material);
        mesh.frustumCulled = false;
        group.add(mesh);
        strokes.push({ bundle, geometry });
        disposables.push(geometry, material);
      });
    }
    scene.add(group);

    const { pass, uniform } = TSL;
    const scenePass = pass(scene, camera, { samples });
    const bloomUniforms = {
      radius: uniform(options.bloomRadius),
      strength: uniform(options.bloomStrength),
      threshold: uniform(options.bloomThreshold),
    };
    const post = new THREE.RenderPipeline(renderer);
    post.outputNode = options.bloom
      ? scenePass.add(
          bloomModule.bloom(
            scenePass,
            bloomUniforms.strength,
            bloomUniforms.radius,
            bloomUniforms.threshold
          )
        )
      : scenePass;

    session = {
      bloom: options.bloom,
      bloomUniforms,
      camera,
      config,
      disposables,
      drawLines: options.lines !== false,
      group,
      post,
      scene,
      strokes,
      test,
    };
    return session;
  }

  function sessionFor(args) {
    const { config, options, test } = args;
    if (
      !session ||
      session.config !== config ||
      session.test !== test ||
      session.bloom !== options.bloom ||
      session.drawLines !== (options.lines !== false)
    ) {
      return createSession(args);
    }
    return session;
  }

  return {
    renderer,

    async capture({
      config,
      geometryHelpers,
      kernel,
      options,
      test,
      eye,
      target: look,
    }) {
      const active = sessionFor({
        config,
        geometryHelpers,
        options,
        test,
      });
      const { bloomUniforms, camera, group, post, scene, strokes } = active;

      camera.fov = options.fov;
      camera.position.set(eye[0], eye[1], eye[2]);
      camera.lookAt(look[0], look[1], look[2]);
      camera.updateProjectionMatrix();
      applyGroupScale(
        group,
        test.scale,
        options.flattenEnabled ? options.flatten : 0,
        options.flattenAxis
      );
      strokes.forEach(({ bundle, geometry }) => {
        geometry.setDrawRange(
          0,
          (bundle.grownSteps - 1) * bundle.strands.length * 2
        );
      });
      bloomUniforms.strength.value = options.bloomStrength;
      bloomUniforms.radius.value = options.bloomRadius;
      bloomUniforms.threshold.value = options.bloomThreshold;

      const inkPaper =
        options.ink && kernel
          ? buildInkPaper(kernel, renderer, options, test, config)
          : null;
      if (inkPaper) scene.add(inkPaper.mesh);

      // Mirrors components/PostEffects.jsx, which always renders through a
      // RenderPipeline and only varies whether bloom is added to the pass.
      // Going through the pipeline unconditionally keeps the color pipeline
      // identical whether or not bloom is on.
      // PassNode forwards these straight into its own RenderTarget, which it
      // already types HalfFloatType — that HDR buffer is what carries emissive
      // values above 1.0 through to the bloom threshold. `samples` is the only
      // way to antialias the scene pass; the renderer's own `antialias` flag
      // applies to the canvas, which a headless capture never draws to.
      renderer.setRenderTarget(target);
      post.render();

      const pixels = await renderer.readRenderTargetPixelsAsync(
        target,
        0,
        0,
        width,
        height
      );
      renderer.setRenderTarget(null);

      if (inkPaper) scene.remove(inkPaper.mesh);
      inkPaper?.dispose();

      return sharp(unpadRows(pixels, width, height), {
        raw: { channels: 4, height, width },
      })
        .png()
        .toBuffer();
    },

    dispose() {
      disposeSession();
      target.dispose();
      renderer.dispose?.();
      gpuInstance = null;
    },
  };
}
