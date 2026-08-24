import * as THREE from 'three/webgpu';

export const OCEAN_TARGET = 'Ocean Waves';

// Model targets name a source and which of its meshes to bake. The logos are
// flat extrusions lying in XZ, so they read best under a shallow tilt that lets
// drops run across the letterforms and pour through the counters.
export const MODEL_TARGETS = {
  Bret: { model: 'bret', parts: ['inner', 'outer'] },
  'Bret Inner': { model: 'bret', parts: ['inner'] },
  Reversal: { model: 'reversal', parts: ['inner', 'outer'] },
  'Reversal Inner': { model: 'reversal', parts: ['inner'] },
};

export const PRIMITIVE_TARGETS = ['Torus', 'Torus Knot', 'Sphere', 'Ribbon'];

export const TARGET_MODES = [
  OCEAN_TARGET,
  ...PRIMITIVE_TARGETS,
  ...Object.keys(MODEL_TARGETS),
];

export function createPrimitiveGeometry(mode) {
  switch (mode) {
    case 'Torus Knot':
      return new THREE.TorusKnotGeometry(7, 1.9, 320, 48);
    case 'Sphere':
      return new THREE.SphereGeometry(9, 128, 96);
    case 'Ribbon':
      return new THREE.CylinderGeometry(9, 9, 7, 128, 24, true);
    default:
      return new THREE.TorusGeometry(9, 3.4, 64, 220);
  }
}

// Nodes arrive with the GLB's own transform still on them; baking the world
// matrix into a clone leaves a plain geometry the probe can position freely.
export function bakeNodeGeometry(node) {
  node.updateWorldMatrix(true, false);

  const geometry = node.geometry.clone();
  geometry.applyMatrix4(node.matrixWorld);

  return geometry;
}
