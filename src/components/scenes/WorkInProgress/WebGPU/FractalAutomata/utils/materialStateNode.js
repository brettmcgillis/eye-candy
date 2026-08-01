import { color, select, uint, uniform } from 'three/tsl';

// Per-CA-state (1/2/3) PBR material properties. Deliberately NOT a fixed menu
// of "concrete/metal/obsidian" — every property is an independent, live
// uniform per state, so any two (or all three) states can be set to
// identical values (one material spanning multiple states) with no extra
// machinery, and a state can go full transmission+ior+thickness for a glass
// look. Shared by both VoxelField.jsx render paths (InstancedMesh growth-
// reveal and the greedy-meshed static mesh) so they read the same knobs the
// same way — only `stateNode` differs (cell.x.toUint() vs. a baked per-
// vertex `state` attribute, see greedyMesh.js).
export const MATERIAL_STATES = [1, 2, 3];
const STATES = MATERIAL_STATES;

// Biased rough/weathered rather than showroom-glossy by default — a
// megalithic ruin reads as ancient because it's dull and worn, not because
// it's shiny. Every value here is still fully user-editable (Materials
// folder) if a future preset wants a genuinely glossy/glass look.
export const MATERIAL_STATE_DEFAULTS = {
  1: {
    roughness: 0.92,
    metalness: 0.04,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.3,
    transmission: 0,
    ior: 1.5,
    thickness: 0.5,
  },
  2: {
    // Oxidized/worn metal, not brushed showroom steel.
    roughness: 0.65,
    metalness: 0.6,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.3,
    transmission: 0,
    ior: 1.5,
    thickness: 0.5,
  },
  3: {
    // Weathered obsidian — still the glossiest of the three, but nowhere
    // near mirror-polish.
    roughness: 0.3,
    metalness: 0.1,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    transmission: 0,
    ior: 1.5,
    thickness: 0.5,
  },
};

function readStateValues(config, state) {
  const prefix = `state${state}`;
  const defaults = MATERIAL_STATE_DEFAULTS[state];
  return {
    roughness: config[`${prefix}Roughness`] ?? defaults.roughness,
    metalness: config[`${prefix}Metalness`] ?? defaults.metalness,
    emissiveColor: config[`${prefix}EmissiveColor`] ?? defaults.emissiveColor,
    emissiveIntensity:
      config[`${prefix}EmissiveIntensity`] ?? defaults.emissiveIntensity,
    clearcoat: config[`${prefix}Clearcoat`] ?? defaults.clearcoat,
    clearcoatRoughness:
      config[`${prefix}ClearcoatRoughness`] ?? defaults.clearcoatRoughness,
    transmission: config[`${prefix}Transmission`] ?? defaults.transmission,
    ior: config[`${prefix}Ior`] ?? defaults.ior,
    thickness: config[`${prefix}Thickness`] ?? defaults.thickness,
  };
}

// Clearcoat/transmission each add a lighting-model term in
// MeshPhysicalNodeMaterial ONLY when their *Node property is non-null (see
// useClearcoat/useTransmission in three's MeshPhysicalNodeMaterial) — so
// VoxelField.jsx only assigns those nodes when at least one state actually
// uses them, and leaves them null (no extra shader cost) otherwise. Crossing
// that on/off boundary is therefore treated as structural (triggers a
// material rebuild) — see pickStructuralSettings in VoxelField.jsx.
export function hasClearcoat(config) {
  return STATES.some((state) => readStateValues(config, state).clearcoat > 0);
}

export function hasTransmission(config) {
  return STATES.some(
    (state) => readStateValues(config, state).transmission > 0
  );
}

function selectByState(stateNode, nodesByState) {
  return select(
    stateNode.equal(uint(1)),
    nodesByState[1],
    select(stateNode.equal(uint(2)), nodesByState[2], nodesByState[3])
  );
}

// `stateNode` must yield a uint 1/2/3 per fragment/instance. Returns the live
// `uniforms` map (VoxelField pushes fresh config values into these every
// render, mirroring createPaletteNode's own `uniforms`) plus the node graphs
// to assign onto a MeshPhysicalNodeMaterial.
export default function createMaterialStateNodes({ config, stateNode }) {
  const uniforms = {};
  STATES.forEach((state) => {
    const values = readStateValues(config, state);
    uniforms[state] = {
      roughness: uniform(values.roughness),
      metalness: uniform(values.metalness),
      emissiveColor: uniform(color(values.emissiveColor)),
      emissiveIntensity: uniform(values.emissiveIntensity),
      clearcoat: uniform(values.clearcoat),
      clearcoatRoughness: uniform(values.clearcoatRoughness),
      transmission: uniform(values.transmission),
      ior: uniform(values.ior),
      thickness: uniform(values.thickness),
    };
  });

  const pick = (prop) =>
    selectByState(stateNode, {
      1: uniforms[1][prop],
      2: uniforms[2][prop],
      3: uniforms[3][prop],
    });

  const clearcoatEnabled = hasClearcoat(config);
  const transmissionEnabled = hasTransmission(config);

  return {
    uniforms,
    roughnessNode: pick('roughness'),
    metalnessNode: pick('metalness'),
    emissiveNode: pick('emissiveColor').mul(pick('emissiveIntensity')),
    clearcoatNode: clearcoatEnabled ? pick('clearcoat') : null,
    clearcoatRoughnessNode: clearcoatEnabled
      ? pick('clearcoatRoughness')
      : null,
    transmissionNode: transmissionEnabled ? pick('transmission') : null,
    iorNode: transmissionEnabled ? pick('ior') : null,
    thicknessNode: transmissionEnabled ? pick('thickness') : null,
  };
}

// Pushes current config values into an already-built uniforms map (see
// `uniforms` above) — called every live-update pass, for both the
// InstancedMesh and static-mesh material instances.
export function updateMaterialStateUniforms(uniforms, config) {
  if (!uniforms) return;
  STATES.forEach((state) => {
    const values = readStateValues(config, state);
    const target = uniforms[state];
    target.roughness.value = values.roughness;
    target.metalness.value = values.metalness;
    target.emissiveColor.value.set(values.emissiveColor);
    target.emissiveIntensity.value = values.emissiveIntensity;
    target.clearcoat.value = values.clearcoat;
    target.clearcoatRoughness.value = values.clearcoatRoughness;
    target.transmission.value = values.transmission;
    target.ior.value = values.ior;
    target.thickness.value = values.thickness;
  });
}
