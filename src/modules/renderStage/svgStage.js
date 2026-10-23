import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

// A flat bench's Live stage: its SVG, rasterised by `rasterize(svg, {
// height, width })` → top-down RGBA (a canvas in the page, sharp in Node),
// on a quad under an orthographic camera, so the Live tab pans and zooms
// the very drawing the CLI writes. `load({ svg, width, height })`.
export const svgView = (aspect) => ({
  eye: [0, 0, 10],
  far: 20,
  halfHeight: 1,
  halfWidth: aspect,
  near: 0.1,
  projection: 'orthographic',
  target: [0, 0, 0],
  up: [0, 1, 0],
});

export default function createSvgStage({
  height,
  rasterize,
  readFrame,
  renderer,
  width,
}) {
  // eslint-disable-next-line no-param-reassign
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = pass(scene, camera);
  let texture = null;
  let current = null;

  function aim(view) {
    Object.assign(camera, {
      bottom: -view.halfHeight,
      far: view.far,
      left: -view.halfWidth,
      near: view.near,
      right: view.halfWidth,
      top: view.halfHeight,
    });
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
  }

  return {
    async load(drawn) {
      current = drawn;
      const image = await rasterize(drawn.svg, { height, width });
      const row = image.width * 4;
      const flipped = new Uint8Array(row * image.height);
      for (let y = 0; y < image.height; y += 1) {
        flipped.set(
          image.data.subarray(
            (image.height - 1 - y) * row,
            (image.height - y) * row
          ),
          y * row
        );
      }
      texture?.dispose();
      texture = new THREE.DataTexture(flipped, image.width, image.height);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      material.map = texture;
      material.needsUpdate = true;
      quad.scale.set(image.width / image.height, 1, 1);
    },

    capture(view) {
      aim(view);
      return readFrame(() => pipeline.render());
    },

    svg() {
      return current.svg;
    },

    dispose() {
      texture?.dispose();
      material.dispose();
      quad.geometry.dispose();
      pipeline.dispose();
    },
  };
}
