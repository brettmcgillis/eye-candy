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

function membraneComponents(membrane) {
  const count = membrane.chains.length;
  const parent = Uint32Array.from({ length: count }, (_, index) => index);
  const root = (value) => {
    let index = value;
    while (parent[index] !== index) index = parent[index];
    return index;
  };
  const chainOf = new Uint32Array(membrane.pinned.length);
  for (let s = 0; s < membrane.strips.length / 4; s += 1) {
    const [base, cols, rows] = membrane.strips.subarray(s * 4, s * 4 + 3);
    chainOf.fill(s % count, base, base + cols * rows);
  }
  for (let g = 0; g < membrane.weldGroups.length; g += 2) {
    const start = membrane.weldGroups[g];
    const end = start + membrane.weldGroups[g + 1];
    const first = chainOf[membrane.weldMembers[start]];
    for (let i = start + 1; i < end; i += 1) {
      parent[root(chainOf[membrane.weldMembers[i]])] = root(first);
    }
  }
  return parent.map((_, index) => root(index));
}

function fillIdentities(
  chains,
  sampleOf,
  namespace,
  split = Infinity,
  components = null
) {
  const count = chains.reduce((sum, chain) => sum + chain.points.length / 3, 0);
  const sampleIdentities = new Uint32Array(count);
  let offset = 0;
  chains.forEach((chain, index) => {
    const length = chain.points.length / 3;
    sampleIdentities.fill(
      (components?.[index] ?? index) + 1 + namespace,
      offset,
      offset + length
    );
    offset += length;
  });
  return Float32Array.from(
    sampleOf,
    (sample, index) => sampleIdentities[sample] + (index >= split ? 2000000 : 0)
  );
}

// Positions come from the display grid on the GPU; the attribute only sizes
// the draw.
function membraneGeometry(display, membrane) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(display.count * 3), 3)
  );
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(display.count * 3), 3)
  );
  geometry.setAttribute(
    'paintIdentity',
    new THREE.BufferAttribute(
      fillIdentities(
        membrane.chains,
        display.sampleOf,
        1000000,
        membrane.side.includes(1) ? display.count / 2 : Infinity,
        membraneComponents(membrane)
      ),
      1
    )
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
  floorMesh.userData.backdrop = 'shadow';
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
    geometry.setAttribute(
      'paintIdentity',
      new THREE.BufferAttribute(
        fillIdentities(current.tubes.chains, mesh.sampleOf, 0),
        1
      )
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
    skin = new THREE.Mesh(
      membraneGeometry(display, current.membrane),
      finishMaterial(config)
    );
    skin.castShadow = shadows;
    skin.receiveShadow = shadows;
    skin.frustumCulled = false;
    // Its vertices live on the GPU, so a plot reads only its silhouette.
    skin.userData.plot = false;
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
      uniforms.painting.apply(config);
      uniforms.gridSize.value = current.tubes.gridSize;
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

    // What a plot draws: the tube meshes (for depth, albedo and edges) and
    // each chain's centre line in world space, lifted by its half-height
    // toward `eye` so it rides the tube's near surface.
    plotParts(eye) {
      const parts = meshes();
      const placed = body ?? skin;
      if (!placed || !current) return { lines: [], meshes: parts };
      placed.updateWorldMatrix(true, false);
      const { matrixWorld } = placed;
      const scale = matrixWorld.getMaxScaleOnAxis();
      const half = current.tubes.gridSize / 2;
      const point = new THREE.Vector3();
      const toward = new THREE.Vector3();
      const chains = [
        ...current.tubes.chains,
        ...(current.membrane?.chains ?? []),
      ];
      const lines = chains.map((chain) => {
        const line = [];
        for (let k = 0; k < chain.points.length / 3; k += 1) {
          // The swept mesh's frame (mesh.js localPoints): grid-centred, z up.
          point
            .set(
              chain.points[k * 3] - half,
              chain.points[k * 3 + 2],
              chain.points[k * 3 + 1] - half
            )
            .applyMatrix4(matrixWorld);
          toward.fromArray(eye).sub(point).normalize();
          const lift =
            Math.min(chain.radius ?? 0, chain.radii?.[k] ?? Infinity) * scale;
          line.push(point.clone().addScaledVector(toward, lift).toArray());
        }
        if (chain.loop && line.length > 2) line.push(line[0]);
        return line;
      });
      return { lines, meshes: parts };
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
      uniforms.painting.dispose();
      floorMesh.geometry.dispose();
      floor.material.dispose();
      studio.dispose();
    },
  };
}
