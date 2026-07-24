// RectAreaLight renders black until its LTC lookup tables are uploaded, and
// the call differs per renderer. Imported dynamically so a WebGL-only scene
// never pulls in the WebGPU build, and cached per renderer kind so remounting
// scenes don't repeat the upload.
const initPromises = new Map();

export default function ensureRectAreaLightSupport(isWebGPU) {
  const kind = isWebGPU ? 'webgpu' : 'webgl';
  const existing = initPromises.get(kind);

  if (existing) {
    return existing;
  }

  const pending = isWebGPU
    ? Promise.all([
        import('three/webgpu'),
        import('three/addons/lights/RectAreaLightTexturesLib.js'),
      ]).then(([THREE, { RectAreaLightTexturesLib }]) => {
        THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
      })
    : import('three/addons/lights/RectAreaLightUniformsLib.js').then(
        ({ RectAreaLightUniformsLib }) => {
          RectAreaLightUniformsLib.init();
        }
      );

  initPromises.set(kind, pending);

  return pending;
}
