import { mix, positionLocal, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Softboxes the rubber sheen reflects: a long strip overhead, one to the
// left of camera and a dim kicker behind; the floor fills the lower half.
const SOFTBOXES = [
  { center: [0, 9, 6], half: [7, 0.2, 2.5], power: 6 },
  { center: [-10, 2, 8], half: [0.2, 4, 3], power: 3 },
  { center: [9, 3, -5], half: [0.2, 2, 2], power: 1.2 },
];
const FLOOR_RADIANCE = 0.35;

function buildStudio(tint, floor) {
  const scene = new THREE.Scene();
  const dome = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  dome.colorNode = mix(
    uniform(new THREE.Color('#050506')),
    uniform(new THREE.Color('#1b1c20')),
    positionLocal.normalize().y.mul(0.5).add(0.5)
  );
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), dome));
  const ground = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  ground.colorNode = uniform(floor.clone().multiplyScalar(FLOOR_RADIANCE));
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), ground);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.5;
  scene.add(plane);
  SOFTBOXES.forEach(({ center, half, power }) => {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = uniform(tint.clone().multiplyScalar(power));
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(half[0] * 2, half[1] * 2, half[2] * 2),
      material
    );
    mesh.position.set(...center);
    scene.add(mesh);
  });
  return scene;
}

function disposeScene(scene) {
  scene.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
}

// A PMREM of the studio, rebuilt only when its tint or the floor changes.
export default function createStudio() {
  let key = null;
  let target = null;
  let generator = null;

  return {
    get texture() {
      return target?.texture ?? null;
    },

    update(renderer, config) {
      const next = `${config.envTint}|${config.floorColor}`;
      if (next === key) return false;
      key = next;
      generator ??= new THREE.PMREMGenerator(renderer);
      const scene = buildStudio(
        new THREE.Color(config.envTint),
        new THREE.Color(config.floorColor)
      );
      const previous = target;
      target = generator.fromScene(scene, 0, 0.1, 100);
      disposeScene(scene);
      previous?.dispose();
      return true;
    },

    dispose() {
      target?.dispose();
      generator?.dispose();
    },
  };
}
