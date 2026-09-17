import * as THREE from 'three/webgpu';

import buildGlassMaterial from './buildGlassMaterial';
import buildLitMaterial from './buildLitMaterial';
import createShadowAtlas from './shadowAtlas';
import { createVolumeUniforms } from './volumeUniforms';

// Everything the volume draws, with no React in it, so a headless check can
// render through exactly what the scene renders through. Two passes after the
// atlas: the lit volume at Render Scale into a target, then glass and upscale
// to the screen.
export function createStablePipeline() {
  const u = createVolumeUniforms();

  const litTarget = new THREE.RenderTarget(4, 4, {
    depthBuffer: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });

  const passCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 10);
  passCamera.position.set(0, 0, 1);
  const passMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
  passMesh.position.set(0.5, 0.5, 0);
  passMesh.frustumCulled = false;
  const passScene = new THREE.Scene();
  passScene.add(passMesh);

  const glassMaterial = buildGlassMaterial(u, litTarget.texture);

  return {
    dispose() {
      litTarget.dispose();
      glassMaterial.dispose();
      passMesh.geometry.dispose();
    },
    glassMaterial,
    litTarget,
    passCamera,
    passMesh,
    passScene,
    u,
  };
}

export function createShadowStage(u, tileSize) {
  const atlas = createShadowAtlas(u, tileSize);
  const litMaterial = buildLitMaterial(u, atlas.texture, tileSize);

  return {
    atlas,
    dispose() {
      atlas.dispose();
      litMaterial.dispose();
    },
    litMaterial,
  };
}
