/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import createStudio from './environment';
import {
  createCableGeometry,
  createFloorGeometry,
  createPlugGeometry,
  createShaftGeometry,
} from './geometry';
import {
  createCableMaterial,
  createFloorMaterial,
  createPlugMaterial,
  createShaftMaterial,
} from './materials';

const UP = new THREE.Vector3(0, 1, 0);

// The cables as one imperative object, drawn by the scene and the headless
// CLIs: `setGeneration` builds what @modules/cables' buildCables returned,
// `apply(config)` sets the look, `updateEnvironment` keeps the studio
// current. Meshes are rebuilt per generation, never re-geometried.
export default function createCablesRig() {
  const group = new THREE.Group();
  const studio = createStudio();
  const cable = createCableMaterial();
  const floor = createFloorMaterial();
  const plug = createPlugMaterial();
  const shaftMaterial = createShaftMaterial();
  let meshes = [];
  let castShadow = true;

  function clear() {
    meshes.forEach((mesh) => {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.dispose?.();
    });
    meshes = [];
  }

  function add(mesh, { cast = false, receive = true } = {}) {
    mesh.castShadow = cast && castShadow;
    mesh.userData.casts = cast;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = false;
    group.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function setGeneration(generation) {
    clear();
    add(new THREE.Mesh(createCableGeometry(generation), cable.material), {
      cast: true,
    });
    const ground = add(
      new THREE.Mesh(createFloorGeometry(generation.hole), floor.material)
    );
    ground.userData.backdrop = 'shadow';
    add(
      new THREE.Mesh(
        createShaftGeometry(generation.hole, generation.holeDepth),
        shaftMaterial
      )
    );
    if (generation.plugs.length > 0) {
      const plugs = add(
        new THREE.InstancedMesh(
          createPlugGeometry(generation.radius),
          plug.material,
          generation.plugs.length
        ),
        { cast: true }
      );
      const matrix = new THREE.Matrix4();
      const rotation = new THREE.Quaternion();
      const direction = new THREE.Vector3();
      const position = new THREE.Vector3();
      const scale = new THREE.Vector3(1, 1, 1);
      generation.plugs.forEach((item, i) => {
        rotation.setFromUnitVectors(UP, direction.set(...item.direction));
        plugs.setMatrixAt(
          i,
          matrix.compose(position.set(...item.position), rotation, scale)
        );
      });
      plugs.instanceMatrix.needsUpdate = true;
    }
  }

  return {
    group,
    setGeneration,

    apply(config) {
      cable.uniforms.roughness.value = config.cableRoughness;
      floor.uniforms.color.value.set(config.floorColor);
      floor.uniforms.roughness.value = config.floorRoughness;
      plug.uniforms.color.value.set(config.plugColor);
    },

    // The studio needs the renderer, so it is baked lazily; returns true when
    // the environment texture changed.
    updateEnvironment(renderer, scene, config) {
      const changed = studio.update(renderer, config);
      scene.environment = studio.texture;
      scene.environmentIntensity = config.envIntensity;
      return changed;
    },

    setShadows(cast) {
      castShadow = cast;
      meshes.forEach((mesh) => {
        mesh.castShadow = cast && mesh.userData.casts;
      });
    },

    dispose() {
      clear();
      cable.material.dispose();
      floor.material.dispose();
      plug.material.dispose();
      shaftMaterial.dispose();
      studio.dispose();
    },
  };
}
