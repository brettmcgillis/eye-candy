export const DICE_CONFIGS = [
  {
    id: 'd4',
    position: [-1.6, 1.1, 0],
  },
  {
    id: 'd6',
    position: [-0.3, 1.25, 0],
  },
  {
    id: 'd8',
    position: [1.1, 1.05, 0],
  },
  {
    id: 'd10',
    position: [2, -0.05, 0],
  },
  {
    id: 'd12',
    position: [-0.9, -1.1, 0],
  },
  {
    id: 'd20',
    position: [0.7, -1.25, 0],
  },
];

export const MAIN_LIGHT_POSITION = [10, 10, 10];
export const MAIN_LIGHT_TARGET = [0, 0, 0];

export const LIGHTFORMER_CONFIGS = [
  {
    position: [0, 5, -9],
    rotation: [Math.PI / 2, 0, 0],
    intensity: 4,
    scale: 2,
  },
  {
    position: [-5, 1, -1],
    rotation: [0, Math.PI / 2, 0],
    intensity: 2,
    scale: 2,
  },
  {
    position: [-5, -1, -1],
    rotation: [0, Math.PI / 2, 0],
    intensity: 2,
    scale: 2,
  },
  {
    position: [10, 1, 0],
    rotation: [0, -Math.PI / 2, 0],
    intensity: 2,
    scale: 8,
  },
];

export const RESET_GRID_POSITIONS = [
  [-2, 1.8, 0],
  [0, 1.8, 0],
  [2, 1.8, 0],
  [-2, -1.8, 0],
  [0, -1.8, 0],
  [2, -1.8, 0],
];

export const RESET_GRID_EVENT = 'quinns-dice-reset-grid';
export const ROLL_DIE_EVENT = 'quinns-dice-roll';
export const DEFAULT_CAMERA_POSITION_VALUES = [0, 0, 22];
