import { useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

const CAMERA = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
CAMERA.position.z = 0.5;

// Renders a uv-driven material into a texture once, and again only when
// `key` changes: the painted sky and paper never animate, so their noise
// stacks are paid for on an edit rather than every frame.
export default function useBakedTexture(
  material,
  [width, height],
  key,
  wrap = THREE.ClampToEdgeWrapping
) {
  const gl = useThree((state) => state.gl);
  const bake = useMemo(() => {
    const target = new THREE.RenderTarget(width, height, {
      depthBuffer: false,
      type: THREE.HalfFloatType,
    });
    target.texture.wrapS = wrap;
    target.texture.wrapT = wrap;
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material));
    return { key: null, scene, target };
  }, [height, material, width, wrap]);

  useEffect(
    () => () => {
      bake.target.dispose();
      bake.scene.children[0].geometry.dispose();
    },
    [bake]
  );

  useFrame(() => {
    if (bake.key === key) return;
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(bake.target);
    gl.render(bake.scene, CAMERA);
    gl.setRenderTarget(previous);
    bake.key = key;
  }, -2);

  return bake.target.texture;
}
