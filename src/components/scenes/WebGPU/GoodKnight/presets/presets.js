export const DEFAULT_PRESET = 'Fallen';

const FALLEN = {
  pose: 'fallen',
  cameraMode: 'orbit',
  orbitDesktopPosition: { x: 1.9, y: 1.5, z: 2.1 },
  orbitDesktopTarget: { x: 0, y: 0.3, z: 0 },
};

const SLUMPED = {
  pose: 'slumped',
  cameraMode: 'orbit',
  orbitDesktopPosition: { x: 0.8, y: 1.1, z: 2.3 },
  orbitDesktopTarget: { x: 0, y: 0.45, z: -0.05 },
};

const KNEELING = {
  pose: 'kneeling',
  cameraMode: 'orbit',
  orbitDesktopPosition: { x: -1.3, y: 1.4, z: -2.1 },
  orbitDesktopTarget: { x: 0, y: 0.65, z: 0 },
};

export const PRESETS = {
  Fallen: { ...FALLEN, handSwordDrop: true, handSwordDropThreshold: 4 },
  Slumped: { ...SLUMPED, handSwordDrop: true, handSwordDropThreshold: 4 },
  Butterfingers: { ...FALLEN, handSwordDrop: true, handSwordDropThreshold: 0 },
  'Taken a Knee': {
    ...KNEELING,
    handSwordDrop: true,
    handSwordDropThreshold: 4,
  },
  'Death Grip': {
    ...SLUMPED,
    handSwordDrop: true,
    handSwordDropThreshold: 14,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
