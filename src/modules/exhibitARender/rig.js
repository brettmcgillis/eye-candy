/* eslint-disable no-param-reassign */
import { renderGroup } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  PLACEMENT_KEYS,
  SHAPE_KEYS,
  objectRotation,
  stageLayout,
} from '@modules/exhibitA';

import {
  buildFieldMaterial,
  createFieldProxy,
  createMarchUniforms,
} from './fieldLayer';
import {
  applyFieldConfig,
  createFieldUniforms,
  createGuestUniforms,
} from './fields';
import { applyLook, createLookUniforms } from './look';
import createMeshLayer from './meshLayer';
import createStage, { applyStage, createStageUniforms } from './stage';

// The whole exhibit as one imperative object, drawn by the scene and the
// headless CLIs alike:
//   setExhibit(config, build, footprint)   after the kernel (re)builds
//   apply(config, { stops, lightAzimuth, progress })   every frame
//   updateEnvironment(renderer, scene, config)   bakes the studio PMREM
// three caches a laid-out Fn's WGSL per backend, so the proxy's shadow pass
// reuses the main pass's function code — uniform names and all — without
// ever declaring the uniforms that code reads. Uniforms read inside the
// field functions therefore get fixed names in the shared render group, and
// buildFieldMaterial touches each of them so every pipeline declares them.
function named(uniforms, prefix) {
  Object.entries(uniforms).forEach(([key, node]) => {
    if (node?.isUniformNode)
      node.setGroup(renderGroup).setName(`${prefix}_${key}`);
  });
  return uniforms;
}

// Everything a shadow depends on; the map is redrawn only when this changes.
const SHADOW_KEYS = [
  ...SHAPE_KEYS,
  ...PLACEMENT_KEYS,
  'plinth',
  'plinthHeight',
  'plinthWidth',
  'plinthGap',
  'mount',
  'floorEnabled',
  'lightElevation',
  'shadowMapSize',
];

export default function createExhibitRig() {
  const group = new THREE.Group();
  const look = createLookUniforms();
  const stageUniforms = createStageUniforms();
  const field = named(createFieldUniforms(), 'field');
  const guest = named(createGuestUniforms(), 'guest');
  const march = named(createMarchUniforms(), 'march');

  const stage = createStage(stageUniforms);
  group.add(stage.group);

  const meshes = createMeshLayer(look, stageUniforms);
  meshes.group.matrixAutoUpdate = false;
  group.add(meshes.group);

  const proxy = createFieldProxy();
  proxy.visible = false;
  group.add(proxy);
  const fieldMaterials = new Map();

  let current = null;
  let version = 0;
  let shadowKey = null;

  function fieldMaterialFor(family, id, material) {
    const key = `${family}|${id}|${material}`;
    if (!fieldMaterials.has(key)) {
      fieldMaterials.set(
        key,
        buildFieldMaterial({
          anchors: [field, guest, march],
          family,
          field,
          guest,
          id,
          look,
          march,
          material,
          stage: stageUniforms,
        })
      );
    }
    return fieldMaterials.get(key);
  }

  return {
    group,

    setExhibit(config, build, footprint) {
      current = { build, footprint };
      version += 1;
      if (build.kind === 'field') {
        proxy.visible = true;
        meshes.setParts(null);
      } else {
        proxy.visible = false;
        meshes.setParts(build.parts);
      }
    },

    // Updates every uniform and transform; returns the stage layout.
    apply(
      config,
      { lightAzimuth = config.lightAzimuth, progress = 1, stops = null } = {}
    ) {
      if (!current) return null;
      const { build, footprint } = current;
      const layout = stageLayout(config, build, footprint);
      const size = config.objectSize;
      const m = objectRotation(config.objectTilt, config.objectSpin);

      applyLook(look, config, stops);
      applyStage(stageUniforms, config, lightAzimuth);
      stage.apply(config, layout, lightAzimuth);
      meshes.draw.progress.value = progress;

      const nextShadow = [
        version,
        lightAzimuth,
        progress,
        ...SHADOW_KEYS.map((key) => config[key]),
      ].join('|');
      if (nextShadow !== shadowKey) {
        shadowKey = nextShadow;
        stage.refreshShadow();
      }

      if (build.kind === 'field') {
        proxy.material = fieldMaterialFor(
          config.family,
          build.id,
          config.material
        );
        applyFieldConfig(field, guest, build.id, config);
        march.toObject.value
          .set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8])
          .transpose();
        march.objectSize.value = size;
        march.boundRadius.value = build.radius * size;
        march.marchSteps.value = config.marchSteps;
        march.shadowSteps.value = config.shadowSteps;
        march.aoSamples.value = config.aoSamples;
        march.hitEpsilon.value = config.hitEpsilon;
        proxy.scale.setScalar(build.radius * size * 1.01);
      } else {
        meshes.setMaterial(config.material);
        meshes.group.matrix.set(
          m[0] * size,
          m[1] * size,
          m[2] * size,
          0,
          m[3] * size,
          m[4] * size,
          m[5] * size,
          0,
          m[6] * size,
          m[7] * size,
          m[8] * size,
          0,
          0,
          0,
          0,
          1
        );
        meshes.group.matrixWorldNeedsUpdate = true;
      }
      return layout;
    },

    updateEnvironment(renderer, scene, config) {
      const changed = stage.updateEnvironment(renderer, config);
      scene.environment = stage.environment;
      scene.environmentIntensity = config.ambient;
      return changed;
    },

    dispose() {
      fieldMaterials.forEach((material) => material.dispose());
      fieldMaterials.clear();
      proxy.geometry.dispose();
      meshes.dispose();
      stage.dispose();
      look.paletteTexture.dispose();
      guest.paletteTexture?.dispose();
    },
  };
}
