import { Color } from 'three';

import paintPaletteColors from './palette';
import { acquireWashTexture } from './wash';

export default function createMarkUniforms(config, sharedMap = null) {
  const lease = sharedMap ? null : acquireWashTexture();
  const map = sharedMap ?? lease.map;
  const colors = paintPaletteColors(config);
  return {
    uniforms: {
      paintNativeMap: { value: map },
      paintBleed: { value: config.paintBleed ?? 0 },
      paintPooling: { value: config.paintPooling ?? 0 },
      paintHatchRoughness: { value: config.paintHatchRoughness ?? 0 },
      paintStrokeRoughness: { value: config.paintStrokeRoughness ?? 0 },
      paintFollowPalette: { value: config.paintFollowPalette ? 1 : 0 },
      paintPaletteOn: { value: colors ? 1 : 0 },
      ...Object.fromEntries(
        [0, 1, 2].map((i) => [
          `paintPalette${i}`,
          { value: new Color(colors?.[i] ?? '#514a45') },
        ])
      ),
    },
    dispose() {
      lease?.dispose();
    },
  };
}
