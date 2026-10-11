import * as THREE from 'three/webgpu';

import {
  getPaletteStops,
  rgbToColor,
  samplePaletteColors,
} from '@utils/gradientPalette';

export default function createStateColors(config) {
  const stops = getPaletteStops(config.paletteName);
  const [start, mid, end] = stops
    ? samplePaletteColors(stops, 3, config.paletteExact).map((rgb) =>
        rgbToColor(rgb, new THREE.Color())
      )
    : [config.paletteStart, config.paletteMid, config.paletteEnd].map(
        (hex) => new THREE.Color(hex)
      );
  return { 1: start, 2: mid, 3: end };
}
