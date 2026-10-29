import {
  BoxGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';

import { layerColor } from '@modules/paperCuts';

import createAnimation from './animation';

export default function createPaperRig() {
  const group = new Group();
  const geometry = new BoxGeometry(1, 1, 1);
  const transform = new Object3D();
  let frame = null;
  let config = null;
  let meshes = [];
  let animate = () => {};
  let lastExpansion = null;

  function clear() {
    meshes.forEach((mesh) => {
      mesh.removeFromParent();
      mesh.material.dispose();
      mesh.dispose();
    });
    meshes = [];
  }
  function update(expansion = 0) {
    if (expansion === lastExpansion) return;
    lastExpansion = expansion;
    const scale = frame.settings.dataScaleMultiplier;
    group.scale.setScalar(scale);
    group.rotation.z = config.rotate ? -Math.PI / 4 : 0;
    meshes.forEach((mesh) => {
      const i = mesh.userData.layer;
      mesh.userData.squares.forEach((square, j) => {
        transform.position.set(
          ...square.position,
          -i * (config.paperDepth + config.layerGap + expansion)
        );
        transform.scale.set(square.size, square.size, config.paperDepth);
        transform.updateMatrix();
        mesh.setMatrixAt(j, transform.matrix);
      });
      Object.assign(mesh.instanceMatrix, { needsUpdate: true });
      mesh.computeBoundingSphere();
    });
  }
  return {
    group,
    apply(nextFrame, nextConfig, texture = null) {
      clear();
      lastExpansion = null;
      frame = nextFrame;
      config = nextConfig;
      meshes = frame.layers.flatMap((layer, i) => {
        if (!layer.length) return [];
        const batches =
          config.animationMode === 'morseCode'
            ? layer.map((s) => [s])
            : [layer];
        return batches.map((squares) => {
          const material = new MeshStandardMaterial({
            color: layerColor(config, i, frame.layers.length),
            roughness: config.squareRoughness,
            metalness: config.squareMetalness,
            roughnessMap: config.squareWatercolor ? texture : null,
            flatShading: config.squareFlatShading ?? false,
          });
          const mesh = new InstancedMesh(geometry, material, squares.length);
          mesh.userData = { layer: i, squares };
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
          return mesh;
        });
      });
      animate = createAnimation(config, meshes);
      update();
    },
    update,
    animate: (seconds) => animate(seconds),
    dispose() {
      clear();
      geometry.dispose();
    },
  };
}
