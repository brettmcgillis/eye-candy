/* eslint-disable no-param-reassign */
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { attribute, fog, rangeFogFactor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { stageTransform } from '@modules/brutalist';

import {
  applyAtmosphere,
  createAtmosphereUniforms,
  createFogNode,
  createSky,
} from './atmosphere';
import carveStructure from './carve';
import {
  applyConcrete,
  createConcreteMaterial,
  createConcreteUniforms,
} from './concrete';
import {
  applyGround,
  buildGroundGeometry,
  createGroundMaterial,
  createGroundUniforms,
} from './ground';
import { applyStudio, createStudio, createStudioUniforms } from './studio';
import { applyTrees, createForest, createTreeUniforms } from './trees';

const euler = new THREE.Euler();

function paneGeometry(lights) {
  if (lights.length === 0) return null;
  const panes = lights.map((pane) => {
    const geometry = new THREE.BoxGeometry(
      pane.half[0] * 2,
      pane.half[1] * 2,
      pane.half[2] * 2
    );
    geometry.deleteAttribute('uv');
    const warmth = new Float32Array(geometry.getAttribute('position').count);
    warmth.fill(pane.warmth);
    geometry.setAttribute('aWarmth', new THREE.BufferAttribute(warmth, 1));
    euler.set(pane.pitch, pane.yaw, pane.tilt, 'YZX');
    geometry.applyMatrix4(
      new THREE.Matrix4()
        .makeRotationFromEuler(euler)
        .setPosition(...pane.center)
    );
    return geometry;
  });
  const merged = mergeGeometries(panes);
  panes.forEach((pane) => pane.dispose());
  return merged;
}

function createPaneMaterial(uniforms) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.4,
  });
  const warmth = attribute('aWarmth', 'float');
  material.colorNode = uniforms.color.mul(0.2);
  material.emissiveNode = uniforms.color
    .mul(uniforms.intensity)
    .mul(warmth.mul(0.5).add(0.75));
  return material;
}

// The structure and its stage as one imperative object, drawn by both
// scenes and the headless CLIs. `stage` is 'forest' (full size among trees,
// height fog, sky) or 'maquette' (a model on a plinth in the studio).
// `Tree` is ez-tree's class, injected so a headless caller can import it
// behind a stubbed document; without it the forest stays empty.
export default function createBrutalistRig({
  Tree = null,
  stage = 'forest',
} = {}) {
  const group = new THREE.Group();
  const model = new THREE.Group();
  group.add(model);

  const concrete = createConcreteUniforms();
  const atmosphere = createAtmosphereUniforms();
  const paneUniforms = {
    color: uniform(new THREE.Color('#ffcf8a')),
    intensity: uniform(8),
  };
  const structureMaterial = createConcreteMaterial(concrete);
  const paneMaterial = createPaneMaterial(paneUniforms);
  const structureMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    structureMaterial
  );
  structureMesh.castShadow = true;
  structureMesh.receiveShadow = true;
  const paneMesh = new THREE.Mesh(new THREE.BufferGeometry(), paneMaterial);
  paneMesh.visible = false;
  model.add(structureMesh, paneMesh);

  const forestStage = stage === 'forest';
  const ground = forestStage ? createGroundUniforms() : null;
  const trees = forestStage ? createTreeUniforms() : null;
  const studioUniforms = forestStage ? null : createStudioUniforms();
  const sky = forestStage ? createSky(atmosphere) : null;
  const groundMesh = forestStage
    ? new THREE.Mesh(new THREE.BufferGeometry(), createGroundMaterial(ground))
    : null;
  const forest = forestStage ? createForest(Tree, trees) : null;
  const studio = forestStage ? null : createStudio(studioUniforms);
  const studioFog = {
    color: uniform(new THREE.Color('#3a3a3a')),
    far: uniform(50),
    near: uniform(14),
  };
  const fogNode = forestStage
    ? createFogNode(atmosphere)
    : fog(studioFog.color, rangeFogFactor(studioFog.near, studioFog.far));

  if (forestStage) {
    groundMesh.receiveShadow = true;
    group.add(sky, groundMesh, forest.group);
  } else {
    group.add(studio.group);
  }

  let structure = null;
  let transform = { lift: 0, scale: 1 };

  return {
    group,
    get transform() {
      return transform;
    },

    setStructure(next, config) {
      structure = next;
      structureMesh.geometry.dispose();
      structureMesh.geometry = carveStructure(next);
      paneMesh.geometry.dispose();
      const panes = paneGeometry(next.lights);
      paneMesh.geometry = panes ?? new THREE.BufferGeometry();
      paneMesh.visible = Boolean(panes);
      this.fit(config);
    },

    // Scale and lift on the plinth; called again when the plinth changes.
    fit(config) {
      if (!structure) return;
      transform = stageTransform(config, structure, stage);
      model.scale.setScalar(transform.scale);
      concrete.modelScale.value = transform.scale;
      model.position.y = transform.lift;
      studio?.fit(config, structure, transform.scale);
    },

    setSite(site, config) {
      if (!forestStage) return;
      groundMesh.geometry.dispose();
      groundMesh.geometry = buildGroundGeometry(config, site.foot);
      ground.roadStart.value = site.foot * 0.7;
      forest.set(site, config);
    },

    apply(config) {
      applyConcrete(concrete, config);
      paneUniforms.color.value.set(config.litColor);
      paneUniforms.intensity.value = config.litIntensity;
      if (forestStage) {
        applyAtmosphere(atmosphere, config);
        applyGround(ground, config);
        applyTrees(trees, config);
      } else {
        applyStudio(studioUniforms, config);
        studioFog.color.value.set(config.studioBackground);
        studioFog.near.value = config.studioFogNear;
        studioFog.far.value = config.studioFogFar;
        this.fit(config);
      }
    },

    // Seconds of fog drift; the caller owns the clock.
    setPhase(seconds) {
      atmosphere.phase.value = seconds;
    },

    attach(scene) {
      scene.fogNode = fogNode;
    },

    detach(scene) {
      if (scene.fogNode === fogNode) scene.fogNode = null;
    },

    setShadows(cast) {
      structureMesh.castShadow = cast;
    },

    dispose() {
      structureMesh.geometry.dispose();
      structureMaterial.dispose();
      paneMesh.geometry.dispose();
      paneMaterial.dispose();
      if (forestStage) {
        sky.geometry.dispose();
        sky.material.dispose();
        groundMesh.geometry.dispose();
        groundMesh.material.dispose();
        forest.dispose();
      } else {
        studio.dispose();
      }
    },
  };
}
