export const HERO_TV_LAYOUT = [
  {
    defaultChannel: 'vhs',
    position: [5, 1, -3],
    rotation: [0, -Math.PI / 4, 0],
    scale: 10,
  },
  {
    defaultChannel: 'threeD',
    isTurnedOn: false,
    position: [0, 6.25, -5],
    rotation: [0, 0, 0],
    scale: 10,
  },
  {
    defaultChannel: 'terminal',
    isTurnedOn: false,
    position: [-5, 1, -3],
    rotation: [0, Math.PI / 4, 0],
    scale: 10,
  },
];

export const RAISED_BY_TV_CAMERA = {
  position: [0, 7, 11],
  near: 0.1,
  far: 100,
  minDistance: 4,
  maxDistance: 24,
};

export const RAISED_BY_TV_BACKGROUND = '#000000';

export const RAISED_BY_TV_STAGE_FLOOR = {
  color: '#131313',
  metalness: 0.35,
  position: [0, 0, 2],
  rotation: [-Math.PI / 2, 0, -Math.PI / 4],
  roughness: 0.72,
  size: 22,
};
