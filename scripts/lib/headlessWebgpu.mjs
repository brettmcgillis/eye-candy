/* eslint-disable import/no-extraneous-dependencies */

// The three.js WebGPU renderer, running in Node on the `webgpu` package's
// Dawn-backed navigator.gpu. Shared by every headless capture: each tool builds
// its own scene, and this owns the device, the render target and the readback.
//
// `@kmamal/gpu` is not usable here — it sends a texture swizzle on every
// createView that no adapter on this machine exposes. See
// docs/rorschach-pipeline.md.

let modules = null;

// three touches a handful of browser globals during construction. Only the
// ones it actually reaches are stubbed; the canvas never backs a swapchain
// because every render goes to a RenderTarget.
export async function loadThree() {
  if (modules) return modules;

  const webgpu = await import('webgpu');
  const gpu = webgpu.create([]);

  globalThis.navigator = { ...globalThis.navigator, gpu };
  globalThis.self = globalThis;
  globalThis.requestAnimationFrame = (cb) =>
    setTimeout(() => cb(Date.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  Object.assign(globalThis, webgpu.globals);

  modules = {
    THREE: await import('three/webgpu'),
    TSL: await import('three/tsl'),
  };
  return modules;
}

export function stubCanvas(width, height) {
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

// WebGPU's copyTextureToBuffer aligns each row to 256 bytes and three returns
// that padded buffer as-is, so any width that isn't a multiple of 64 pixels
// comes back with trailing bytes per row. Reading it as tightly packed shears
// the image progressively down the frame.
export function unpadRows(pixels, width, height) {
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

// A renderer bound to one output size, with the target every frame is drawn
// into. `configure` runs before init so a caller can set tone mapping and
// shadow state the way its browser canvas does.
export async function createHeadlessRenderer({
  configure,
  height,
  width,
} = {}) {
  const { THREE } = await loadThree();
  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    canvas: stubCanvas(width, height),
    forceWebGPU: true,
  });
  renderer.setSize(width, height, false);
  configure?.(renderer, THREE);
  await renderer.init();

  // NoColorSpace, not SRGBColorSpace: a RenderPipeline's output node already
  // encodes to the renderer's output color space, and an sRGB target would
  // encode a second time — a #5a5a5a background read back as 161, exactly the
  // double-encoded value.
  const target = new THREE.RenderTarget(width, height, {
    colorSpace: THREE.NoColorSpace,
    depthBuffer: true,
  });

  return {
    renderer,
    target,

    // `draw` renders into the target; the pixels come back as raw RGBA so the
    // caller can composite and encode exactly once.
    async readFrame(draw) {
      renderer.setRenderTarget(target);
      draw();
      const pixels = await renderer.readRenderTargetPixelsAsync(
        target,
        0,
        0,
        width,
        height
      );
      renderer.setRenderTarget(null);
      return { data: unpadRows(pixels, width, height), height, width };
    },

    dispose() {
      target.dispose();
      renderer.dispose?.();
    },
  };
}
