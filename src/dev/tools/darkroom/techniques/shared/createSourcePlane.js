import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const FITS = ['cover', 'contain'];

// The source picture as a scene: a textured quad under an orthographic camera
// framed to the output, so screen-space effects sample it exactly as they
// sample a rendered scene's pass.
export default function createSourcePlane() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2);
  camera.position.z = 1;
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  scene.add(mesh);
  const scenePass = pass(scene, camera);
  let texture = null;
  let version = -1;

  return {
    camera,
    scene,
    scenePass,
    sample: (uv) => scenePass.getTextureNode().sample(uv),

    update(frame, { height, width }, fit = 'cover') {
      const { canvas } = frame;
      const dims = `${canvas.width}x${canvas.height}`;
      if (!texture || texture.userData.dims !== dims) {
        texture?.dispose();
        texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.userData.dims = dims;
        material.map = texture;
        material.needsUpdate = true;
        version = -1;
      }
      if (frame.version !== version) {
        version = frame.version;
        texture.needsUpdate = true;
      }

      const out = width / height;
      const src = canvas.width / canvas.height;
      Object.assign(camera, {
        bottom: -0.5,
        left: -out / 2,
        right: out / 2,
        top: 0.5,
      });
      camera.updateProjectionMatrix();
      const wide = src > out;
      const cover = fit === 'cover';
      const h = wide === cover ? 1 : out / src;
      mesh.scale.set(h * src, h, 1);
    },

    dispose() {
      texture?.dispose();
      material.dispose();
      mesh.geometry.dispose();
      scenePass.dispose();
    },
  };
}
