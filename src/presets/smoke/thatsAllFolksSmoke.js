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
  tension: 0.8,
  closed: false,
  points: toSmokePoints(canvasPoints),
});

const THATS_ALL_FOLKS_SMOKE = {
  'Thats All Folks - Capital T': createPreset(CAPITAL_T),
  'Thats All Folks - Hats': createPreset(HATS),
  'Thats All Folks - T Crossbar': createPreset(T_CROSSBAR),
  'Thats All Folks - Apostrophe': createPreset(APOSTROPHE),
  'Thats All Folks - All Letters': createPreset(ALL_LETTERS),
  'Thats All Folks - Capital F': createPreset(CAPITAL_F),
  'Thats All Folks - Exclamation Line': createPreset(EXCLAMATION_LINE),
  'Thats All Folks - Exclamation Dot': createPreset(EXCLAMATION_DOT),
  'Thats All Folks - Olks Tail': createPreset(OLKS_TAIL),
};

export default THATS_ALL_FOLKS_SMOKE;
