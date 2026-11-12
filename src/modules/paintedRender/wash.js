import { ClampToEdgeWrapping } from 'three';

import createPigmentTexture from './pigment';
import wash from './wash.json';

export default function createWashTexture() {
  const map = createPigmentTexture(wash);
  map.wrapS = ClampToEdgeWrapping;
  map.wrapT = ClampToEdgeWrapping;
  return map;
}

let shared;
let owners = 0;
export function acquireWashTexture() {
  shared ??= createWashTexture();
  const map = shared;
  owners += 1;
  let active = true;
  return {
    map,
    dispose() {
      if (!active) return;
      active = false;
      owners -= 1;
      if (owners === 0) {
        map.dispose();
        shared = null;
      }
    },
  };
}
