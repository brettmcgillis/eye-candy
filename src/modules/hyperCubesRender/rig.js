/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import createStudio from './environment';
import {
  createCellGeometry,
  createFloorGeometry,
  createFrameGeometry,
} from './geometry';
import createLayer from './layer';
import {
  createCellMaterial,
  createFloorMaterial,
  createFloorUniforms,
  createFrameMaterial,
  createFrameUniforms,
  createGlassMaterial,
  createGlassUniforms,
} from './materials';

const writeBox = ({ center, half }, a, i, w = 0) => {
  a.aCenter.set(center, i);
  a.aHalf.set([...half, w], i);
};

// The cubes as one imperative object, drawn by both the scene and the
// headless CLIs: `apply(config)` sets the look, `setInstances` lays out what
// @modules/hyperCubes' buildInstances returned, and `updateEnvironment`
// keeps the studio environment current.
export default function createCubeRig() {
  const group = new THREE.Group();
  const glassUniforms = createGlassUniforms();
  const frameUniforms = createFrameUniforms();
  const floorUniforms = createFloorUniforms();
  const studio = createStudio();
  // One layer per shape, so a mixed fill draws cubes and spheres together.
  const byShape = (make) => ({
    cube: make(createCellGeometry('cube')),
    sphere: make(createCellGeometry('sphere')),
  });
  const solids = byShape((geometry) =>
    createLayer({
      attributes: ['aCenter', 'aHalf', 'aColor', 'aEmissive'],
      buildMaterial: createCellMaterial,
      geometry,
      group,
    })
  );
  const glass = byShape((geometry) =>
    createLayer({
      attributes: ['aCenter', 'aHalf', 'aTint'],
      buildMaterial: () => createGlassMaterial(glassUniforms),
      castShadow: false,
      geometry,
      group,
    })
  );
  const frames = createLayer({
    attributes: ['aCenter', 'aHalf'],
    buildMaterial: () => createFrameMaterial(frameUniforms),
    geometry: createFrameGeometry(),
    group,
  });
  const floor = new THREE.Mesh(
    createFloorGeometry(),
    createFloorMaterial(floorUniforms)
  );
  floor.receiveShadow = true;
  group.add(floor);

  const ofShape = (items, shape) =>
    items.filter(({ look }) => look.shape === shape);

  function setInstances(instances) {
    ['cube', 'sphere'].forEach((shape) => {
      solids[shape].set(ofShape(instances.solids, shape), (item, a, i) => {
        writeBox(item, a, i);
        const { look } = item;
        a.aColor.set(look.color, i);
        a.aColor[i + 3] = look.roughness;
        a.aEmissive.set(look.emissive, i);
        a.aEmissive[i + 3] = look.noise;
      });
      glass[shape].set(ofShape(instances.glass, shape), (item, a, i) => {
        writeBox(item, a, i);
        a.aTint.set(item.look.tint, i);
        a.aTint[i + 3] = item.look.roughness;
      });
    });
    frames.set(instances.frames, (item, a, i) =>
      writeBox(item, a, i, item.width)
    );
  }

  return {
    group,
    setInstances,

    apply(config) {
      glassUniforms.ior.value = config.glassIor;
      glassUniforms.dispersion.value = config.glassDispersion;
      frameUniforms.color.value.set(config.frameColor);
      frameUniforms.metalness.value = config.frameMetalness;
      frameUniforms.roughness.value = config.frameRoughness;
      floorUniforms.color.value.set(config.floorColor);
      floorUniforms.roughness.value = config.floorRoughness;
      floor.visible = config.floorEnabled;
      floor.position.y = -config.domainY - config.floorOffset;
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
      solids.cube.setShadows(cast);
      solids.sphere.setShadows(cast);
      frames.setShadows(cast);
    },

    dispose() {
      [solids, glass].forEach((layers) =>
        Object.values(layers).forEach((layer) => layer.dispose())
      );
      frames.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      studio.dispose();
    },
  };
}
