import { float, positionGeometry, select, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Stipples the surface-bound drops straight into the foam render target the
// ocean material samples, so the visible-ocean variant gets real per-drop
// disturbance instead of an expanding-ring impostor.
export default function createImpactFoam({ renderTarget, simulation }) {
  const dotSize = uniform(0.55);
  const strength = uniform(1);

  const camera = new THREE.OrthographicCamera(-70, 70, 70, -70, 0.1, 400);
  camera.position.set(0, 200, 0);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  const decayGeometry = new THREE.PlaneGeometry(1, 1);
  decayGeometry.rotateX(-Math.PI / 2);
  const decayMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthTest: false,
    depthWrite: false,
    opacity: 0.06,
    transparent: true,
  });
  const decayPlane = new THREE.Mesh(decayGeometry, decayMaterial);
  scene.add(decayPlane);

  const slot = simulation.positionBuffer.toAttribute();
  const motion = simulation.motionBuffer.toAttribute();
  const isSurface = slot.w.greaterThan(0.5).and(slot.w.lessThan(1.5));

  const material = new THREE.MeshBasicNodeMaterial();
  material.positionNode = vec3(
    slot.x.add(positionGeometry.x.mul(dotSize)),
    0,
    slot.z.add(positionGeometry.z.mul(dotSize))
  );
  material.colorNode = uv()
    .sub(0.5)
    .length()
    .mul(2)
    .oneMinus()
    .saturate()
    .pow(2)
    .mul(select(isSurface, float(1), float(0)))
    .mul(motion.w.mul(-1.2).exp())
    .mul(strength);
  material.blending = THREE.AdditiveBlending;
  material.depthTest = false;
  material.depthWrite = false;
  material.forceSinglePass = true;
  material.transparent = true;

  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.rotateX(-Math.PI / 2);

  const splat = new THREE.Mesh(geometry, material);
  splat.frustumCulled = false;
  splat.renderOrder = 1;
  scene.add(splat);

  return {
    applyConfig(ocean, count) {
      const half = ocean.impactAreaSize * 0.5;

      camera.left = -half;
      camera.right = half;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();

      decayPlane.scale.set(ocean.impactAreaSize, ocean.impactAreaSize, 1);
      decayMaterial.opacity = ocean.impactFoamDecay;
      dotSize.value = ocean.impactDotSize;
      strength.value = ocean.impactDotStrength;
      splat.count = count;
    },
    clear(renderer) {
      const previous = renderer.getRenderTarget?.() || null;
      renderer.setRenderTarget(renderTarget);
      renderer.clear(true, true, true);
      renderer.setRenderTarget(previous);
    },
    dispose() {
      scene.remove(decayPlane);
      scene.remove(splat);
      decayGeometry.dispose();
      decayMaterial.dispose();
      geometry.dispose();
      material.dispose();
    },
    render(renderer) {
      const previous = renderer.getRenderTarget?.() || null;
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(previous);
    },
  };
}
