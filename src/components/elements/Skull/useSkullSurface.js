import { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

const FILE = modelFile('SkullDecimated.glb');

// The decimated skull flattened into one world-space position/index pair,
// scaled to `height` and centred over the origin with its lowest point at
// `baseY`. For consumers that treat the skull as a surface to author on rather
// than a model to draw.
export default function useSkullSurface({ baseY = 0, height = 2.4 } = {}) {
  const { scene } = useGLTF(FILE);

  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const positions = [];
    const indices = [];
    const v = new THREE.Vector3();

    scene.traverse((node) => {
      if (!node.isMesh) return;
      const { index, attributes } = node.geometry;
      const base = positions.length / 3;
      for (let i = 0; i < attributes.position.count; i += 1) {
        v.fromBufferAttribute(attributes.position, i).applyMatrix4(
          node.matrixWorld
        );
        positions.push(v.x, v.y, v.z);
      }
      for (let i = 0; i < index.count; i += 1)
        indices.push(index.getX(i) + base);
    });

    const position = new Float32Array(positions);
    const box = new THREE.Box3().setFromArray(position);
    const center = box.getCenter(new THREE.Vector3());
    const scale = height / (box.max.y - box.min.y);
    for (let i = 0; i < position.length; i += 3) {
      position[i] = (position[i] - center.x) * scale;
      position[i + 1] = (position[i + 1] - box.min.y) * scale + baseY;
      position[i + 2] = (position[i + 2] - center.z) * scale;
    }

    return { index: new Uint32Array(indices), position };
  }, [baseY, height, scene]);
}

useSkullSurface.preload = () => useGLTF.preload(FILE);
