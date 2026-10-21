import { useEffect, useLayoutEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// GhostBuster's studio, as data: the skins were tuned under these drei
// Lightformer panels (rects facing the origin, colour scaled by intensity).
export const LIGHTFORMERS = [
  { intensity: 6, position: [0, 5, 0], scale: [2, 2, 1] },
  { intensity: 5, position: [-2.5, 1, 5], scale: [0.4, 5, 1] },
  { intensity: 5, position: [2.5, 1, 5], scale: [0.4, 5, 1] },
  { intensity: 3, position: [-5, 1, 0], scale: [0.3, 5, 5] },
  { intensity: 3, position: [5, 1, 0], scale: [0.3, 5, 5] },
  { intensity: 3, position: [-2.5, 1, -5], scale: [0.4, 5, 1] },
  { intensity: 3, position: [2.5, 1, -5], scale: [0.4, 5, 1] },
  { intensity: 0.8, position: [0, -3, 0], scale: [3, 3, 1] },
];

// drei's <Environment frames={1}> with GhostBuster's Lightformers, built
// directly: drei's bundle pulls CommonJS dependencies the headless renderer
// cannot load, and this is the whole of what the studio used from it.
export default function StudioEnvironment({ intensity, rotationY = 0 }) {
  const { gl, scene } = useThree();
  const studio = useMemo(() => {
    const panels = new THREE.Scene();
    const plane = new THREE.PlaneGeometry(1, 1);
    LIGHTFORMERS.forEach((panel) => {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      material.color.setScalar(panel.intensity);
      const mesh = new THREE.Mesh(plane, material);
      mesh.position.set(...panel.position);
      mesh.scale.set(...panel.scale);
      mesh.lookAt(0, 0, 0);
      panels.add(mesh);
    });
    const target = new THREE.CubeRenderTarget(256);
    target.texture.type = THREE.HalfFloatType;
    const camera = new THREE.CubeCamera(0.1, 1000, target);
    return { camera, panels, plane, target };
  }, []);

  useEffect(
    () => () => {
      studio.panels.children.forEach((mesh) => mesh.material.dispose());
      studio.plane.dispose();
      studio.target.dispose();
    },
    [studio]
  );

  useLayoutEffect(() => {
    const { autoClear } = gl;
    gl.autoClear = true;
    studio.camera.update(gl, studio.panels);
    gl.autoClear = autoClear;
    scene.environment = studio.target.texture;
    scene.environmentIntensity = intensity;
    scene.environmentRotation.set(0, rotationY, 0);
    return () => {
      scene.environment = null;
    };
  }, [gl, intensity, rotationY, scene, studio]);

  return null;
}
