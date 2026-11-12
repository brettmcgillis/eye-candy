import {
  DataTexture,
  LinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
} from 'three';

import pigment from './pigment.json';

export default function createPigmentTexture(source = pigment) {
  const bytes = Uint8Array.from(atob(source.data), (value) =>
    value.charCodeAt(0)
  );
  const map = new DataTexture(bytes, source.width, source.height, RGBAFormat);
  map.colorSpace = NoColorSpace;
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.minFilter = LinearFilter;
  map.magFilter = LinearFilter;
  map.needsUpdate = true;
  return map;
}
