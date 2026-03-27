import * as THREE from 'three';

import {
  ALL_LETTERS,
  APOSTROPHE,
  CAPITAL_F,
  CAPITAL_T,
  EXCLAMATION_DOT,
  EXCLAMATION_LINE,
  HATS,
  OLKS_TAIL,
  T_CROSSBAR,
  toScene,
} from '../../components/scenes/WorkInProgress/WebGL/ThatsAllFolks/splineData';

const toSmokePoints = (canvasPoints) =>
  toScene(canvasPoints).map((position) => ({
    position,
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1),
  }));

const createPreset = (canvasPoints) => ({
  type: 'Particle',
  tension: 0.8,
  closed: false,
  points: toSmokePoints(canvasPoints),
});

const THATS_ALL_FOLKS_SMOKE = {
  "That's All Folks": {
    splines: [
      { name: 'Capital T', ...createPreset(CAPITAL_T) },
      { name: 'Hats', ...createPreset(HATS) },
      { name: 'T Crossbar', ...createPreset(T_CROSSBAR) },
      { name: 'Apostrophe', ...createPreset(APOSTROPHE) },
      { name: 'All Letters', ...createPreset(ALL_LETTERS) },
      { name: 'Capital F', ...createPreset(CAPITAL_F) },
      { name: 'Exclamation Line', ...createPreset(EXCLAMATION_LINE) },
      { name: 'Exclamation Dot', ...createPreset(EXCLAMATION_DOT) },
      { name: 'Olks Tail', ...createPreset(OLKS_TAIL) },
    ],
  },
};

export default THATS_ALL_FOLKS_SMOKE;
