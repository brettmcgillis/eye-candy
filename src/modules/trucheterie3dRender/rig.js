/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { buildTubeMesh } from '@modules/trucheterie3d';

import sampleColors, { COLOR_KEYS } from './colors';
import createStudio from './environment';
import {
  createFloorMaterial,
  createTubeMaterial,
  createTubeUniforms,
} from './materials';

const keyOf = (config, keys) => keys.map((key) => config[key]).join('|');

// The tubes as one imperative object, drawn by both the scene and the
// headless CLIs. `setTubes` takes what @modules/trucheterie3d's buildTubes
// returned (plus the field it came from, for the lane colours, and the swept
// mesh if a worker built it); `apply` re-dresses it. The mesh is in grid
// units and placed by its transform, so turning or resizing the field never
// rebuilds it.
export default function createTubeRig() {
  const group = new THREE.Group();
  const uniforms = createTubeUniforms();
  const material = createTubeMaterial(uniforms);
  // A fresh Mesh per build, never an empty placeholder: WebGPU caches a
  // render object's attributes on its first draw, so a mesh first drawn
  // with an empty geometry keeps drawing nothing after a geometry swap.
  let body = null;
  let shadows = true;

  const floor = createFloorMaterial();
  const floorMesh = new THREE.Mesh(
    new THREE.CircleGeometry(1, 96),
    floor.material
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  const studio = createStudio();
  let current = null;
  let colorKey = null;
  let sampleOf = null;
  let lowest = 0;
  let reach = 1;

  function paint(colors) {
    const attribute = body.geometry.getAttribute('color');
    const out = attribute.array;
    for (let v = 0; v < sampleOf.length; v += 1) {
      const s = sampleOf[v] * 3;
      out[v * 3] = colors[s];
      out[v * 3 + 1] = colors[s + 1];
      out[v * 3 + 2] = colors[s + 2];
    }
    attribute.needsUpdate = true;
  }

  function toGeometry(mesh) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(mesh.position, 3)
    );
    geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normal, 3));
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(mesh.position.length), 3)
    );
    geometry.setAttribute('aCenter', new THREE.BufferAttribute(mesh.center, 4));
    geometry.setIndex(new THREE.BufferAttribute(mesh.index, 1));
    geometry.computeBoundingSphere();
    return geometry;
  }

  function rebuild(config, built) {
    const { field, tubes } = current;
    if (body) {
      group.remove(body);
      body.geometry.dispose();
    }
    body = new THREE.Mesh(toGeometry(built), material);
    body.castShadow = shadows;
    body.receiveShadow = shadows;
    body.frustumCulled = false;
    group.add(body);
    ({ sampleOf } = built);
    paint(sampleColors(tubes, field, config));
    colorKey = keyOf(config, COLOR_KEYS);

    lowest = Infinity;
    let far = 0;
    const half = tubes.gridSize / 2;
    tubes.chains.forEach((chain) => {
      for (let k = 0; k < chain.points.length; k += 3) {
        lowest = Math.min(lowest, chain.points[k + 2] - chain.radius);
        far = Math.max(
          far,
          Math.hypot(chain.points[k] - half, chain.points[k + 1] - half)
        );
      }
    });
    if (!Number.isFinite(lowest)) lowest = 0;
    reach = Math.max(far, 1);
  }

  return {
    group,

    // `mesh` is buildTubeMesh's output when a worker already swept it.
    setTubes({ config, field, mesh = null, tubes }) {
      current = { field, tubes };
      rebuild(config, mesh ?? buildTubeMesh(tubes, config));
      this.apply(config);
    },

    apply(config) {
      if (!current) return;
      if (keyOf(config, COLOR_KEYS) !== colorKey) {
        paint(sampleColors(current.tubes, current.field, config));
        colorKey = keyOf(config, COLOR_KEYS);
      }
      const scale = config.blobCanvasSize / current.tubes.gridSize;
      body.scale.setScalar(scale);
      body.rotation.y = ((config.planeRotation ?? 0) * Math.PI) / 180;
      uniforms.roughness.value = config.roughness;
      uniforms.metalness.value = config.metalness;
      uniforms.clearcoat.value = config.clearcoat;
      floor.color.value.set(config.floorColor);
      floorMesh.visible = config.floorEnabled;
      floorMesh.position.y = lowest * scale - config.floorGap;
      floorMesh.scale.setScalar(reach * scale * 4);
    },

    // 0 (nothing) to just past 1 (fully grown); 2 is the resting value.
    setGrowth(value) {
      uniforms.growth.value = value;
    },

    // A drifting palette: lane colours re-solved at a moving phase, the
    // geometry left alone.
    setPalettePhase(config, phase) {
      if (!current) return;
      paint(sampleColors(current.tubes, current.field, config, phase));
    },

    updateEnvironment(renderer, scene, config) {
      studio.update(renderer);
      scene.environment = studio.texture;
      scene.environmentIntensity = config.envIntensity;
    },

    setShadows(cast) {
      shadows = cast;
      if (body) {
        body.castShadow = cast;
        body.receiveShadow = cast;
      }
      floorMesh.receiveShadow = cast;
    },

    dispose() {
      body?.geometry.dispose();
      material.dispose();
      floorMesh.geometry.dispose();
      floor.material.dispose();
      studio.dispose();
    },
  };
}
