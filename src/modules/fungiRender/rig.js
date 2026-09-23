import * as THREE from 'three/webgpu';

import {
  BEAD_FIELD,
  TUBE_FIELD,
  createSlot,
  createSurfaceSlot,
} from './geometry';
import {
  createBeadMaterial,
  createSurfaceMaterial,
  createTubeMaterial,
  createUniforms,
} from './materials';

const LOOK_KEYS = ['minPixels', 'occlusion', 'roughness', 'sporeAmount'];

// The specimen as one persistent, imperative object shared by the scene and
// the CLI: two instanced fields (fibres and beads) that every generation is
// written into, fitted into `fit` so the camera never reframes.
export default function createSpecimenRig({
  fit = { center: [0, 5.5, 0], radius: 5.2 },
} = {}) {
  const u = createUniforms();
  const group = new THREE.Group();
  const content = new THREE.Group();
  const tubes = createSlot(TUBE_FIELD);
  const beads = createSlot(BEAD_FIELD);
  const surfaces = createSurfaceSlot();
  const materials = [
    [tubes, createTubeMaterial(u)],
    [beads, createBeadMaterial(u)],
    [surfaces, createSurfaceMaterial(u)],
  ].map(([slot, material]) => {
    const mesh = new THREE.Mesh(slot.geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    slot.mesh = mesh; // eslint-disable-line no-param-reassign
    content.add(mesh);

    return material;
  });
  let size = [fit.radius * 2, fit.radius * 2, fit.radius * 2];

  group.add(content);

  return {
    group,
    uniforms: u,

    load(specimen) {
      tubes.load(specimen.segments);
      beads.load(specimen.beads);
      surfaces.load(specimen.mesh);

      const { palette } = specimen;

      palette.stops.forEach((hex, k) => u.stops[k].value.set(hex));
      u.rotColor.value.set(palette.rot);
      u.sporeColor.value.set(palette.spore);
      u.glow.value = palette.glow ?? 0;

      const { max, min } = specimen.bounds;
      const extent = max.map((v, a) => v - min[a]);
      const k = (fit.radius * 2) / Math.max(...extent, 1e-3);
      const center = max.map((v, a) => (v + min[a]) / 2);

      content.scale.setScalar(k);
      content.position.set(
        fit.center[0] - center[0] * k,
        fit.center[1] - center[1] * k,
        fit.center[2] - center[2] * k
      );
      u.sporeFall.value = extent[1] * 0.6;
      size = extent.map((v) => v * k);
    },

    setConfig(config) {
      LOOK_KEYS.forEach((key) => {
        if (config[key] !== undefined) u[key].value = config[key];
      });
    },

    setLevels({ exit = 0, grow = 1, rot = 0, spore = 0, stagger = 0 }) {
      u.grow.value = grow;
      u.rot.value = rot;
      u.spore.value = spore;
      u.exit.value = exit;
      u.stagger.value = stagger;
    },

    // Nothing to step: the whole specimen is built in the kernel.
    setRenderer() {},

    bounds() {
      return { center: fit.center, radius: fit.radius, size };
    },

    dispose() {
      materials.forEach((material) => material.dispose());
      tubes.dispose();
      beads.dispose();
      surfaces.dispose();
      group.removeFromParent();
    },
  };
}
