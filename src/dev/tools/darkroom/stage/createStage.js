import * as THREE from 'three/webgpu';

// The output surfaces, always at the export size and scaled down by CSS for
// the preview: a 2D canvas for techniques that draw SVG, and one WebGPU
// renderer (made on first use) for the rigs and the screen-space effects.
export default function createStage() {
  const flat = document.createElement('canvas');
  flat.dataset.surface = 'canvas';
  const flatContext = flat.getContext('2d');
  const grab = document.createElement('canvas');
  const grabContext = grab.getContext('2d');
  let gpu = null;
  let size = { height: 1350, width: 1080 };
  let engine = 'canvas';

  const resize = (canvas) => {
    if (canvas.width !== size.width)
      Object.assign(canvas, { width: size.width });
    if (canvas.height !== size.height) {
      Object.assign(canvas, { height: size.height });
    }
  };
  resize(flat);

  return {
    flat,
    flatContext,

    get size() {
      return size;
    },

    get engine() {
      return engine;
    },

    get gpuCanvas() {
      return gpu?.canvas ?? null;
    },

    setSize(width, height) {
      size = { height, width };
      resize(flat);
      gpu?.then(({ renderer }) => renderer.setSize(width, height, false));
    },

    setEngine(next) {
      engine = next;
    },

    gpu() {
      if (!gpu) {
        const canvas = document.createElement('canvas');
        canvas.dataset.surface = 'webgpu';
        const renderer = new THREE.WebGPURenderer({ antialias: true, canvas });
        gpu = renderer.init().then(() => {
          renderer.setPixelRatio(1);
          renderer.setSize(size.width, size.height, false);
          return { canvas, renderer };
        });
        gpu.canvas = canvas;
      }
      return gpu;
    },

    // Call in the same task as the render: a WebGPU canvas is only readable
    // until the frame is presented.
    snapshot() {
      resize(grab);
      grabContext.drawImage(
        engine === 'webgpu' ? gpu.canvas : flat,
        0,
        0,
        size.width,
        size.height
      );
      return new Promise((resolve) => {
        grab.toBlob(resolve, 'image/png');
      });
    },

    dispose() {
      gpu?.then(({ renderer }) => renderer.dispose());
    },
  };
}
