/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { MEMBRANE_KEYS, buildTubeMesh } from '@modules/trucheterie3d';

import sampleColors, { COLOR_KEYS } from './colors';
import createStudio from './environment';
import {
  createFloorMaterial,
  createMembraneMaterial,
  createTubeMaterial,
  createTubeUniforms,
} from './materials';
import createMembraneDisplay from './membraneDisplay';
import createMembraneSolver from './membraneSolver';

const keyOf = (config, keys) => keys.map((key) => config[key]).join('|');
// A settled membrane stops stepping until something moves it again.
const SETTLE_SECONDS = 6;

function paintInto(mesh, sampleOf, colors) {
  const attribute = mesh.geometry.getAttribute('color');
  const out = attribute.array;
  for (let v = 0; v < sampleOf.length; v += 1) {
    const s = sampleOf[v] * 3;
    out[v * 3] = colors[s];
    out[v * 3 + 1] = colors[s + 1];
    out[v * 3 + 2] = colors[s + 2];
  }
  attribute.needsUpdate = true;
}

// Positions come from the display grid on the GPU; the attribute only sizes
// the draw.
function membraneGeometry(display) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(display.count * 3), 3)
  );
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(display.count * 3), 3)
  );
  geometry.setIndex(new THREE.BufferAttribute(display.index, 1));
  return geometry;
}

// The tubes as one imperative object, drawn by both the scene and the
// headless CLIs. `setTubes` takes what @modules/trucheterie3d's buildTubes
// returned (plus the field it came from, for the lane colours, and the swept
// mesh if a worker built it), and buildMembrane's skin when the lanes are a
// membrane; `apply` re-dresses it. Meshes are in grid units and placed by
// their transform, so turning or resizing the field never rebuilds them.
export default function createTubeRig() {
  const group = new THREE.Group();
  const uniforms = createTubeUniforms();
  const material = createTubeMaterial(uniforms);
  // A fresh Mesh per build, never an empty placeholder: WebGPU caches a
  // render object's attributes on its first draw, so a mesh first drawn
  // with an empty geometry keeps drawing nothing after a geometry swap.
  let body = null;
  let skin = null;
  let solver = null;
  let display = null;
  let skinLevel = null;
  let skinFinish = null;
  let displayStale = false;
  let environment = null;
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
  let solveKey = null;
  let quiet = 0;

  const meshes = () => [body, skin].filter(Boolean);

  function paint(config, phase = 0) {
    const { field, membrane, tubes } = current;
    if (body)
      paintInto(body, sampleOf, sampleColors(tubes, field, config, phase));
    if (skin) {
      const capped = { ...config, junction: 'cap' };
      paintInto(
        skin,
        display.sampleOf,
        sampleColors(membrane, field, capped, phase)
      );
    }
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

  function dropSkin() {
    if (skin) {
      group.remove(skin);
      skin.geometry.dispose();
      skin.material.dispose();
      skin = null;
    }
    display?.dispose();
    display = null;
    skinLevel = null;
    skinFinish = null;
  }

  function place(mesh, config) {
    mesh.scale.setScalar(config.blobCanvasSize / current.tubes.gridSize);
    mesh.rotation.y = ((config.planeRotation ?? 0) * Math.PI) / 180;
  }

  function clear() {
    if (body) {
      group.remove(body);
      body.geometry.dispose();
      body = null;
    }
    dropSkin();
    solver?.dispose();
    solver = null;
  }

  // The canopy finishes carry their own environment strength, which a node
  // material only honours through its own envMap.
  function syncEnvMap() {
    if (skin) {
      skin.material.envMap = skinFinish === 'palette' ? null : environment;
    }
  }

  function finishMaterial(config) {
    skinFinish = config.membraneFinish;
    return createMembraneMaterial(
      uniforms,
      display,
      current.membrane.gridSize,
      skinFinish
    );
  }

  // The drawn skin: rebuilt when its subdivision level changes, re-dressed
  // when its finish does. The simulation underneath carries on either way.
  function dressSkin(config) {
    const level = Math.round(config.membraneSubdivision);
    if (!solver) return;
    if (skin && level === skinLevel) {
      if (config.membraneFinish !== skinFinish) {
        skin.material.dispose();
        skin.material = finishMaterial(config);
        syncEnvMap();
      }
      return;
    }
    dropSkin();
    display = createMembraneDisplay(current.membrane, solver, level);
    skin = new THREE.Mesh(membraneGeometry(display), finishMaterial(config));
    skin.castShadow = shadows;
    skin.receiveShadow = shadows;
    skin.frustumCulled = false;
    group.add(skin);
    skinLevel = level;
    syncEnvMap();
    displayStale = true;
    paint(config);
    place(skin, config);
  }

  function rebuild(config, built) {
    const { membrane, tubes } = current;
    clear();
    if (tubes.chains.length > 0) {
      body = new THREE.Mesh(toGeometry(built), material);
      ({ sampleOf } = built);
    }
    if (membrane) {
      solver = createMembraneSolver(membrane);
      solveKey = null;
      dressSkin(config);
    }
    meshes().forEach((mesh) => {
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      mesh.frustumCulled = false;
      group.add(mesh);
    });
    paint(config);
    colorKey = keyOf(config, COLOR_KEYS);

    // A balloon's bottom skin sags below its seams; a lane width covers it.
    const sag = membrane?.side.includes(1) ? membrane.pitch : 0;
    lowest = membrane ? -sag : Infinity;
    let far = 0;
    const half = tubes.gridSize / 2;
    [...tubes.chains, ...(membrane?.chains ?? [])].forEach((chain) => {
      const below = chain.kind === 'wire' || !membrane ? chain.radius : 0;
      for (let k = 0; k < chain.points.length; k += 3) {
        lowest = Math.min(lowest, chain.points[k + 2] - below);
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

    // `mesh` is buildTubeMesh's output when a worker already swept it;
    // `membrane` is buildMembrane's when the lanes are a skin.
    setTubes({ config, field, membrane = null, mesh = null, tubes }) {
      current = { field, membrane, tubes };
      const swept =
        tubes.chains.length > 0 ? (mesh ?? buildTubeMesh(tubes, config)) : null;
      rebuild(config, swept);
      this.apply(config);
    },

    apply(config) {
      if (!current) return;
      if (keyOf(config, COLOR_KEYS) !== colorKey) {
        paint(config);
        colorKey = keyOf(config, COLOR_KEYS);
      }
      dressSkin(config);
      const scale = config.blobCanvasSize / current.tubes.gridSize;
      meshes().forEach((mesh) => place(mesh, config));
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
      if (current) paint(config, phase);
    },

    get hasMembrane() {
      return solver != null;
    },

    // One frame of the membrane toward `target` pressure. Once it has held
    // still for a while it sleeps until the target or a solver knob moves.
    stepMembrane(renderer, delta, config, target) {
      if (!solver) return;
      const key = `${keyOf(config, MEMBRANE_KEYS)}|${target}`;
      if (key !== solveKey) {
        solveKey = key;
        quiet = 0;
      }
      if (quiet > SETTLE_SECONDS) {
        if (displayStale) display.update(renderer);
        displayStale = false;
        return;
      }
      solver.step(renderer, delta, config, target);
      display.update(renderer);
      displayStale = false;
      const settled =
        Math.abs(solver.pressure - target) < 1e-3 * Math.max(1, target);
      quiet = settled ? quiet + delta : 0;
    },

    // Back to flat and zero pressure, to inflate again from the start.
    resetMembrane(renderer) {
      solver?.reset();
      display?.update(renderer);
      solveKey = null;
    },

    updateEnvironment(renderer, scene, config) {
      studio.update(renderer);
      environment = studio.texture;
      syncEnvMap();
      scene.environment = studio.texture;
      scene.environmentIntensity = config.envIntensity;
    },

    setShadows(cast) {
      shadows = cast;
      meshes().forEach((mesh) => {
        mesh.castShadow = cast;
        mesh.receiveShadow = cast;
      });
      floorMesh.receiveShadow = cast;
    },

    dispose() {
      clear();
      material.dispose();
      floorMesh.geometry.dispose();
      floor.material.dispose();
      studio.dispose();
    },
  };
}
