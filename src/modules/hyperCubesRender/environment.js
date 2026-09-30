import { mix, positionLocal, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// The references' emitter boxes (centre, half extents, linear radiance).
// They light the path tracers; here they are baked into the environment, so
// every cell reflects and is lit by the same panels.
export const STUDIO_EMITTERS = {
  crimson: [
    { center: [-4, 3, -4], half: [4, 0.1, 4], radiance: [5, 6.2, 10] },
    { center: [-6, 2, 6], half: [4, 4, 4], radiance: [3, 3.5, 5] },
    { center: [8, 6, 0], half: [2, 2, 2], radiance: [8, 9, 10] },
  ],
  mono: [
    { center: [0, 7, 0], half: [4, 1, 4], radiance: [2, 2, 2] },
    { center: [7, 0, 0], half: [2, 2, 2], radiance: [1, 1, 1] },
  ],
  none: [],
};

// Seen from the cells, the floor hides the lower half of the sky; its
// radiance is its albedo under roughly this much light.
const FLOOR_RADIANCE = 0.35;

function buildStudioScene(name, sky, floor) {
  const scene = new THREE.Scene();
  const dome = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  dome.colorNode = mix(
    sky.nadir,
    sky.zenith,
    positionLocal.normalize().y.mul(0.5).add(0.5)
  );
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), dome));

  if (floor.enabled) {
    const ground = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
    ground.colorNode = uniform(
      floor.color.clone().multiplyScalar(FLOOR_RADIANCE)
    );
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), ground);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = floor.y;
    scene.add(plane);
  }

  (STUDIO_EMITTERS[name] ?? []).forEach(({ center, half, radiance }) => {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = uniform(new THREE.Vector3(...radiance));
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

// A PMREM of the studio, rebuilt only when the studio or its sky changes.
export default function createStudio() {
  const sky = {
    nadir: uniform(new THREE.Color('#eb3039')),
    zenith: uniform(new THREE.Color('#4a5059')),
  };
  let key = null;
  let target = null;
  let generator = null;

  return {
    get texture() {
      return target?.texture ?? null;
    },

    update(renderer, config) {
      const floorY = -config.domainY - config.floorOffset;
      const next = [
        config.studio,
        config.skyNadir,
        config.skyZenith,
        config.floorEnabled,
        config.floorColor,
        floorY,
      ].join('|');
      if (next === key) return false;
      key = next;
      sky.nadir.value.set(config.skyNadir);
      sky.zenith.value.set(config.skyZenith);
      generator ??= new THREE.PMREMGenerator(renderer);
      const scene = buildStudioScene(config.studio, sky, {
        color: new THREE.Color(config.floorColor),
        enabled: config.floorEnabled,
        y: floorY,
      });
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
