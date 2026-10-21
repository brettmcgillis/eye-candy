import { screenUV, texture, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { RAIN_SHADOW_LAYER, RAIN_SHADOW_SIZE } from './rainCloudRig';

const SIZE = RAIN_SHADOW_SIZE;

// Heights go out through fragmentNode: colorNode clamps negatives to zero.
export default function createRainShadow() {
  const depth = new THREE.RenderTarget(SIZE, SIZE);
  depth.depthTexture = new THREE.DepthTexture(SIZE, SIZE);
  const heights = new THREE.RenderTarget(SIZE, SIZE, {
    depthBuffer: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.layers.set(RAIN_SHADOW_LAYER);
  camera.up.set(0, 0, -1);

  const top = uniform(0);
  const range = uniform(1);
  const material = new THREE.MeshBasicNodeMaterial();
  material.fragmentNode = vec4(
    top.sub(texture(depth.depthTexture, screenUV).x.mul(range)),
    0,
    0,
    1
  );
  const quad = new THREE.QuadMesh(material);
  const area = { centerX: 0, centerZ: 0, floorY: -0.9, half: 1 };

  return {
    area,
    heights,

    render(renderer, scene, { centerX, centerZ, floorY, half, topY }) {
      Object.assign(area, { centerX, centerZ, floorY, half });
      Object.assign(camera, {
        bottom: -half,
        far: topY - floorY,
        left: -half,
        near: 0,
        right: half,
        top: half,
      });
      camera.position.set(centerX, topY, centerZ);
      camera.lookAt(centerX, topY - 1, centerZ);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      top.value = topY;
      range.value = topY - floorY;

      const previous = renderer.getRenderTarget();
      renderer.setRenderTarget(depth);
      renderer.render(scene, camera);
      renderer.setRenderTarget(heights);
      quad.render(renderer);
      renderer.setRenderTarget(previous);
    },

    // The heights as rainCloud's shadowHeight reads them.
    async read(renderer) {
      const pixels = await renderer.readRenderTargetPixelsAsync(
        heights,
        0,
        0,
        SIZE,
        SIZE
      );
      const values = new Float32Array(SIZE * SIZE);
      for (let i = 0; i < values.length; i += 1) {
        values[i] = THREE.DataUtils.fromHalfFloat(pixels[i * 4]);
      }
      return { ...area, heights: values, size: SIZE };
    },

    dispose() {
      depth.dispose();
      heights.dispose();
      material.dispose();
    },
  };
}
