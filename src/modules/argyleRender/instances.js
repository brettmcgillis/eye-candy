import { attribute } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { isHollow, tileMesh } from '@modules/argyle';

const CAPACITY = 64 * 64 * 2;
export default function createInstances() {
  let hollow = false;
  const alpha = new THREE.InstancedBufferAttribute(
    new Float32Array(CAPACITY),
    1
  );
  alpha.setUsage(THREE.DynamicDrawUsage);
  const settings = {
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  };
  const flat = new THREE.MeshBasicNodeMaterial(settings);
  const relief = new THREE.MeshStandardNodeMaterial({
    ...settings,
    metalness: 0,
  });
  flat.opacityNode = attribute('tileOpacity', 'float');
  relief.opacityNode = attribute('tileOpacity', 'float');
  function geometryFor(width) {
    const shape = tileMesh(hollow, width);
    const indexed = new THREE.BufferGeometry();
    indexed.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(shape.positions, 3)
    );
    indexed.setIndex(shape.indices);
    const geometry = indexed.toNonIndexed();
    indexed.dispose();
    geometry.computeVertexNormals();
    geometry.setAttribute('tileOpacity', alpha);
    return geometry;
  }
  const mesh = new THREE.InstancedMesh(geometryFor(0.12), flat, CAPACITY);
  mesh.instanceMatrix = new THREE.StorageInstancedBufferAttribute(
    new Float32Array(CAPACITY * 16),
    16
  );
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.setColorAt(0, new THREE.Color());
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  let frameWidth = 0.12;
  return {
    mesh,
    alpha,
    apply(config, index) {
      const width = config.frameWidth ?? 0.12;
      const nextHollow = isHollow(config, index);
      if (nextHollow !== hollow || (nextHollow && width !== frameWidth)) {
        hollow = nextHollow;
        mesh.geometry.dispose();
        mesh.geometry = geometryFor(width);
        frameWidth = width;
      }
      mesh.material = config.dimension === 'flat' ? flat : relief;
      relief.roughness = config.roughness;
    },
    flush() {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      alpha.needsUpdate = true;
    },
    dispose() {
      mesh.geometry.dispose();
      flat.dispose();
      relief.dispose();
      mesh.dispose();
    },
  };
}
