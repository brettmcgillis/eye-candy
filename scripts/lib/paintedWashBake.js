import * as brush from 'p5.brush/standalone';

import { watercolorStages } from '@modules/painted';

const tile = 128;
const width = tile * 4;
const height = tile * 8;
const canvas = Object.assign(document.createElement('canvas'), {
  width,
  height,
});
document.body.appendChild(canvas);
window.paintedWashBake = {
  init() {
    brush.load(canvas);
    brush.clear('#ffffff');
    watercolorStages.forEach((stage, pass) => {
      for (let i = 0; i < 32; i += 1) {
        brush.seed(3801 + i * 977 + pass * 131);
        brush.noiseSeed(3801 + i * 977 + pass * 131);
        brush.noField();
        brush.noFill();
        brush.noWash();
        brush.noHatch();
        brush.noStroke();
        brush.noMass();
        brush.noClip();
        brush.push();
        brush.translate(
          (i % 4) * tile + tile / 2 - width / 2,
          Math.floor(i / 4) * tile + tile / 2 - height / 2
        );
        stage(brush, { s: tile * 0.3, unit: tile / 160, triangle: i >= 16 });
        brush.pop();
      }
      brush.render();
    });
    const copy = Object.assign(document.createElement('canvas'), {
      width,
      height,
    });
    const ctx = copy.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    this.debug = {
      red: [pixels[0], pixels[64 * width * 4 + 64 * 4]],
      alpha: [pixels[3], pixels[64 * width * 4 + 64 * 4 + 3]],
      error: canvas.getContext('webgl2').getError(),
    };
    this.bytes = Uint8Array.from(
      { length: width * height },
      (_, i) => 255 - pixels[i * 4]
    );
  },
  capture() {
    let binary = '';
    this.bytes.forEach((value) => {
      binary += String.fromCharCode(value);
    });
    return { width, height, data: btoa(binary), debug: this.debug };
  },
};
