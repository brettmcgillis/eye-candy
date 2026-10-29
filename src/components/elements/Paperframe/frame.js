import { Mesh, RepeatWrapping } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { modelFile } from '@utils/appUtils';

let loading;
export function loadFrame() {
  loading ??= new GLTFLoader().loadAsync(modelFile('FoldedFrame.glb'));
  return loading;
}

export function createFrame(
  gltf,
  { frameColor, frameRoughness = 0.5, frameWatercolor = false } = {},
  texture = null
) {
  const source = gltf.nodes?.Frame ?? gltf.scene.getObjectByName('Frame');
  const material = source.material.clone();
  if (frameColor) material.color.set(frameColor);
  material.roughness = frameRoughness;
  material.roughnessMap = frameWatercolor ? texture : null;
  if (texture) {
    Object.assign(texture, { wrapS: RepeatWrapping, wrapT: RepeatWrapping });
    texture.repeat.set(3, 3);
  }
  const mesh = new Mesh(source.geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
