import { attribute, float, positionGeometry, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { tileMesh } from '@modules/argyle';
import { createPaintState } from '@modules/paintedRender';

const CAPACITY = 64 * 64 * 2;
export default function createInstances() {
  let hollow = false;
  let painted = false;
  const painting = createPaintState();
  const tileColor = new THREE.InstancedBufferAttribute(
    new Float32Array(CAPACITY * 3),
    3
  );
  tileColor.setUsage(THREE.DynamicDrawUsage);
  const identity = new THREE.InstancedBufferAttribute(
    new Float32Array(CAPACITY),
    1
  );
  identity.setUsage(THREE.DynamicDrawUsage);
  const white = new THREE.Color(1, 1, 1);
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
  const base = painting.u.style
    .greaterThan(0.5)
    .select(attribute('tileColor', 'vec3'), vec3(1));
  flat.colorNode = painting.treat(base, positionGeometry.xy.add(0.5), {
    seed: attribute('tileIdentity', 'float'),
    edge: float(0),
    stamp: true,
  });
  relief.colorNode = flat.colorNode;
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
    geometry.setAttribute('tileColor', tileColor);
    geometry.setAttribute('tileIdentity', identity);
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
    writeColor(slot, tint, seed) {
      mesh.setColorAt(slot, painted ? white : tint);
      tileColor.setXYZ(slot, tint.r, tint.g, tint.b);
      identity.setX(slot, seed);
    },
    apply(config, nextHollow) {
      painted = config.paintStyle && config.paintStyle !== 'original';
      painting.apply(config);
      const width = config.frameWidth ?? 0.12;
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
      tileColor.needsUpdate = true;
      identity.needsUpdate = true;
    },
    dispose() {
      mesh.geometry.dispose();
      flat.dispose();
      painting.dispose();
      relief.dispose();
      mesh.dispose();
    },
  };
}
