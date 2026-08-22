import {
  float,
  normalWorld,
  positionWorld,
  select,
  texture,
  uniform,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const CAMERA_HEIGHT = 400;

// Top-down bake of whatever meshes live in `scene`: red holds the world height
// of the highest surface over each texel, green/blue its normal xz, alpha the
// coverage mask. That turns any geometry into the same height + slope query the
// wave cascades answer analytically, so the rain simulation never learns what
// it is falling on.
export default function createHeightProbe({ resolution = 1024 }) {
  const area = uniform(60);

  const renderTarget = new THREE.RenderTarget(resolution, resolution);
  renderTarget.texture.type = THREE.HalfFloatType;
  renderTarget.texture.magFilter = THREE.LinearFilter;
  renderTarget.texture.minFilter = THREE.LinearFilter;
  renderTarget.texture.generateMipmaps = false;
  renderTarget.texture.wrapS = THREE.ClampToEdgeWrapping;
  renderTarget.texture.wrapT = THREE.ClampToEdgeWrapping;
  renderTarget.texture.colorSpace = THREE.NoColorSpace;

  const camera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0.1,
    CAMERA_HEIGHT * 2
  );
  camera.position.set(0, CAMERA_HEIGHT, 0);
  camera.rotation.set(-Math.PI / 2, 0, 0);

  const scene = new THREE.Scene();

  const bakeMaterial = new THREE.MeshBasicNodeMaterial();
  bakeMaterial.fragmentNode = vec4(
    positionWorld.y,
    normalWorld.x,
    normalWorld.z,
    1
  );
  bakeMaterial.fog = false;
  scene.overrideMaterial = bakeMaterial;

  // Coverage is forced to zero outside the baked area. Without this the
  // clamp-to-edge wrap smears the border texels across every drop that falls
  // beyond the probe, which reads as an endless invisible plane.
  const probeAt = (worldXZ) => {
    const local = worldXZ.div(area).toVar();
    const extent = local.abs().toVar();
    const probed = texture(renderTarget.texture, local.add(0.5)).toVar();
    const inside = extent.x.max(extent.y).lessThan(0.5);

    return vec4(probed.xyz, select(inside, probed.w, float(0)));
  };

  const setArea = (size) => {
    const half = size * 0.5;

    area.value = size;
    camera.left = -half;
    camera.right = half;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
  };

  setArea(area.value);

  return {
    scene,
    setArea,
    sample: (worldXZ) => {
      const probed = probeAt(worldXZ).toVar();
      return vec4(worldXZ.x, probed.x, worldXZ.y, probed.w);
    },
    slope: (worldXZ) => {
      const tilt = probeAt(worldXZ).yz.toVar();
      const up = tilt.dot(tilt).oneMinus().max(0.02).sqrt();
      return tilt.div(up).negate();
    },
    bake(renderer) {
      const previousTarget = renderer.getRenderTarget?.() || null;
      const previousAlpha = renderer.getClearAlpha();

      renderer.setClearAlpha(0);
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(previousTarget);
      renderer.setClearAlpha(previousAlpha);
    },
    dispose() {
      bakeMaterial.dispose();
      renderTarget.dispose();
    },
  };
}
