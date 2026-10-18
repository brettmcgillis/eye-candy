import { cubeTexture, screenUV, texture, uniform, wgslFn } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { BUFFER_A_WGSL, IMAGE_WGSL } from './passesWgsl';

const bufferAFn = wgslFn(BUFFER_A_WGSL);
const imageFn = wgslFn(IMAGE_WGSL);

const HISTORY_OPTIONS = {
  depthBuffer: false,
  generateMipmaps: true,
  magFilter: THREE.LinearFilter,
  minFilter: THREE.LinearMipmapLinearFilter,
  type: THREE.HalfFloatType,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
};

const sharedSize = new THREE.Vector2();

// transparent + NoBlending: an opaque NodeMaterial forces alpha to 1, and
// Buffer A keeps its TAA state in alpha.
function passMaterial(colorNode) {
  const material = new THREE.NodeMaterial();
  material.colorNode = colorNode;
  material.blending = THREE.NoBlending;
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;
  material.toneMapped = false;
  return material;
}

export default function createCampfirePasses({ noise, rock, sky }) {
  const u = {
    bufferResolution: uniform(new THREE.Vector2(1, 1)),
    cameraPos: uniform(new THREE.Vector3()),
    cameraWorld: uniform(new THREE.Matrix4()),
    fireLife: uniform(1),
    fireOffset: uniform(new THREE.Vector3()),
    frame: uniform(0),
    outputResolution: uniform(new THREE.Vector2(1, 1)),
    pixelCone: uniform(0.001),
    prevViewProjection: uniform(new THREE.Matrix4()),
    projectionInverse: uniform(new THREE.Matrix4()),
    time: uniform(0),
    timeDelta: uniform(1 / 60),
  };

  const sceneTarget = new THREE.RenderTarget(1, 1, {
    depthTexture: new THREE.DepthTexture(1, 1),
    type: THREE.HalfFloatType,
  });
  const history = [
    new THREE.RenderTarget(1, 1, HISTORY_OPTIONS),
    new THREE.RenderTarget(1, 1, HISTORY_OPTIONS),
  ];

  // One node per binding, repointed on swap: a graph built on a fixed texture
  // would end up reading the target it is writing.
  const historyNode = texture(history[0].texture);
  const historySamplerNode = texture(history[0].texture);
  const bufferNode = texture(history[1].texture);
  const bufferSamplerNode = texture(history[1].texture);

  const bufferMaterial = passMaterial(
    bufferAFn({
      fragUv: screenUV,
      resolution: u.bufferResolution,
      time: u.time,
      timeDelta: u.timeDelta,
      fireLife: u.fireLife,
      frame: u.frame,
      pixelCone: u.pixelCone,
      cameraPos: u.cameraPos,
      cameraWorld: u.cameraWorld,
      projectionInverse: u.projectionInverse,
      prevViewProjection: u.prevViewProjection,
      fireOffset: u.fireOffset,
      ghostColor: texture(sceneTarget.texture, screenUV),
      ghostDepth: texture(sceneTarget.depthTexture, screenUV).x,
      history: historyNode,
      historySampler: historySamplerNode,
      ch1: texture(noise),
      s1: texture(noise),
      ch2: texture(rock),
      s2: texture(rock),
      ch3: cubeTexture(sky),
      s3: cubeTexture(sky),
    })
  );

  const imageMaterial = passMaterial(
    imageFn({
      fragUv: screenUV,
      outputResolution: u.outputResolution,
      bufferResolution: u.bufferResolution,
      frame: u.frame,
      bufferA: bufferNode,
      bufferSampler: bufferSamplerNode,
    })
  );

  // Shadertoy runs the Image pass at buffer size too; one bilinear blit upscales.
  const imageTarget = new THREE.RenderTarget(1, 1, {
    depthBuffer: false,
    type: THREE.HalfFloatType,
  });
  const blitMaterial = passMaterial(texture(imageTarget.texture, screenUV));

  const quad = new THREE.QuadMesh(bufferMaterial);
  let writeIndex = 1;

  function resize(renderer, maxHeight) {
    renderer.getDrawingBufferSize(sharedSize);
    const height = Math.max(1, Math.round(Math.min(sharedSize.y, maxHeight)));
    const width = Math.max(
      1,
      Math.round((height * sharedSize.x) / sharedSize.y)
    );
    if (
      u.bufferResolution.value.x === width &&
      u.bufferResolution.value.y === height
    )
      return;
    u.bufferResolution.value.set(width, height);
    u.outputResolution.value.set(width, height);
    sceneTarget.setSize(width, height);
    imageTarget.setSize(width, height);
    history.forEach((target) => target.setSize(width, height));
  }

  return {
    uniforms: u,

    render({
      camera,
      delta,
      fireLife,
      fireOffset,
      outputTarget = null,
      height,
      renderer,
      scene,
      time,
    }) {
      resize(renderer, height);
      camera.updateMatrixWorld();
      u.time.value = time;
      u.fireLife.value = fireLife;
      u.timeDelta.value = Math.max(delta, 1e-4);
      u.frame.value = (u.frame.value + 1) % 256;
      u.cameraPos.value.setFromMatrixPosition(camera.matrixWorld);
      u.cameraWorld.value.copy(camera.matrixWorld);
      u.projectionInverse.value.copy(camera.projectionMatrixInverse);
      u.pixelCone.value =
        Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) /
        u.bufferResolution.value.y;
      u.fireOffset.value.copy(fireOffset);

      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);

      const write = history[writeIndex];
      const read = history[1 - writeIndex];
      historyNode.value = read.texture;
      historySamplerNode.value = read.texture;
      quad.material = bufferMaterial;
      renderer.setRenderTarget(write);
      quad.render(renderer);

      bufferNode.value = write.texture;
      bufferSamplerNode.value = write.texture;
      quad.material = imageMaterial;
      renderer.setRenderTarget(imageTarget);
      quad.render(renderer);

      quad.material = blitMaterial;
      renderer.setRenderTarget(outputTarget);
      quad.render(renderer);

      u.prevViewProjection.value.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      writeIndex = 1 - writeIndex;
    },

    dispose() {
      sceneTarget.dispose();
      imageTarget.dispose();
      blitMaterial.dispose();
      history.forEach((target) => target.dispose());
      bufferMaterial.dispose();
      imageMaterial.dispose();
      quad.geometry?.dispose();
    },
  };
}
