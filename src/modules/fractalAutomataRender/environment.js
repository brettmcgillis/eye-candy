import { mix, positionLocal, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Two softboxes and a key strip over a soft grey dome, baked to a PMREM so
// the metal and clearcoat states have something to reflect.
const PANELS = [
  { center: [-6, 7, 4], half: [3, 0.1, 3], radiance: 6 },
  { center: [7, 4, -3], half: [0.1, 2, 3], radiance: 3 },
  { center: [0, 9, -6], half: [6, 0.1, 0.6], radiance: 8 },
];

function buildStudio() {
  const scene = new THREE.Scene();
  const dome = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  dome.colorNode = mix(
    uniform(new THREE.Color('#3a3835')),
    uniform(new THREE.Color('#b9b6b0')),
    positionLocal.normalize().y.mul(0.5).add(0.5)
  );
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), dome));
  PANELS.forEach(({ center, half, radiance }) => {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = uniform(new THREE.Color(radiance, radiance, radiance));
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(half[0] * 2, half[1] * 2, half[2] * 2),
      material
    );
    mesh.position.set(...center);
    scene.add(mesh);
  });
  return scene;
}

export default function createStudio() {
  let target = null;
  let generator = null;
  return {
    get texture() {
      return target?.texture ?? null;
    },
    update(renderer) {
      if (target) return false;
      generator = new THREE.PMREMGenerator(renderer);
      const scene = buildStudio();
      target = generator.fromScene(scene, 0, 0.1, 100);
      scene.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      return true;
    },
    dispose() {
      target?.dispose();
      generator?.dispose();
    },
  };
}
