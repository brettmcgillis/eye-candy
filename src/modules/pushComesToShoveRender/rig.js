import * as THREE from 'three/webgpu';

import {
  PANEL_KEYS,
  TANGLE_KEYS,
  buildPanelMesh,
  computeLayout,
} from '@modules/pushComesToShove';

import {
  RINGS_PER_BEAD,
  createCylinderGeometry,
  createPanelGeometry,
  createWireGeometry,
} from './geometry';
import {
  createCylinderMaterial,
  createLook,
  createPanelMaterial,
  createWallMaterial,
  createWireMaterial,
  syncLook,
} from './materials';
import createTangle from './tangle/createTangle';

const WARM_STEP = 1 / 60;

const keyOf = (keys, config) => keys.map((key) => config[key]).join('|');

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.removeFromParent();
  mesh.geometry.dispose();
  mesh.material.dispose();
}

// The panel, its cavity and the simulation as one imperative object, drawn
// by both the scene and the headless CLIs: `apply(config)` rebuilds only what
// the change touches, `step` advances the sim before a frame renders.
export default function createShoveRig() {
  const group = new THREE.Group();
  const look = createLook();
  const panel = new THREE.Mesh(
    new THREE.BufferGeometry(),
    createPanelMaterial(look)
  );
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    createWallMaterial(look)
  );
  Object.assign(panel, { castShadow: true, receiveShadow: true });
  wall.receiveShadow = true;
  group.add(panel, wall);

  let layout = null;
  let tangle = null;
  let wires = null;
  let cylinders = null;
  let panelKey = '';
  let tangleKey = '';
  let shadows = true;

  function rebuildTangle(config) {
    disposeMesh(wires);
    disposeMesh(cylinders);
    tangle = createTangle(config, layout);
    wires = new THREE.Mesh(
      createWireGeometry(layout),
      createWireMaterial(
        tangle,
        look,
        (layout.pointsPerWire - 1) * RINGS_PER_BEAD
      )
    );
    cylinders = new THREE.Mesh(
      createCylinderGeometry(tangle.cylinderCount),
      createCylinderMaterial(tangle, look)
    );
    [wires, cylinders].forEach((mesh) => {
      Object.assign(mesh, {
        castShadow: shadows,
        frustumCulled: false,
        receiveShadow: true,
      });
      group.add(mesh);
    });
  }

  return {
    group,

    apply(config) {
      layout = computeLayout(config);
      const nextPanel = keyOf(PANEL_KEYS, config);
      if (nextPanel !== panelKey) {
        panelKey = nextPanel;
        panel.geometry.dispose();
        panel.geometry = createPanelGeometry(buildPanelMesh(config, layout));
      }
      const nextTangle = keyOf(TANGLE_KEYS, config);
      if (nextTangle !== tangleKey) {
        tangleKey = nextTangle;
        rebuildTangle(config);
      }
      wall.scale.set(layout.panelHalfWidth * 2, layout.panelHalfHeight * 2, 1);
      wall.position.z = layout.zBack - 0.01;
      syncLook(look, config);
      tangle.sync(config);
    },

    step(renderer, config, delta) {
      tangle?.step(renderer, config, delta);
    },

    // Fixed steps, so a still settles the same however fast the machine is.
    warm(renderer, config, seconds) {
      const steps = Math.round(seconds / WARM_STEP);
      for (let i = 0; i < steps; i += 1) {
        tangle.step(renderer, config, WARM_STEP);
      }
    },

    // The smoothed wire curves the tubes are swept round, and the cylinders.
    async readback(renderer) {
      const read = async (node) =>
        new Float32Array(await renderer.getArrayBufferAsync(node.value));
      return {
        bodies: await read(tangle.buffers.bodies),
        wires: await read(tangle.buffers.render),
      };
    },

    layout: () => layout,

    setShadows(cast) {
      shadows = cast;
      panel.castShadow = cast;
      [wires, cylinders]
        .filter(Boolean)
        .forEach((mesh) => Object.assign(mesh, { castShadow: cast }));
    },

    dispose() {
      disposeMesh(wires);
      disposeMesh(cylinders);
      disposeMesh(panel);
      disposeMesh(wall);
      look.palette.dispose();
    },
  };
}
