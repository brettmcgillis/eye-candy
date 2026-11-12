import * as brush from 'p5.brush/standalone';

const SIZE = 256;
const canvas = document.createElement('canvas');
canvas.width = SIZE;
canvas.height = SIZE;
document.body.appendChild(canvas);
brush.load(canvas);

function reset(seed) {
  brush.clear('#ffffff');
  brush.seed(seed);
  brush.noiseSeed(seed);
  brush.noField();
  brush.noFill();
  brush.noHatch();
  brush.noWash();
  brush.noStroke();
}

function density() {
  brush.render();
  const copy = document.createElement('canvas');
  copy.width = SIZE;
  copy.height = SIZE;
  const ctx = copy.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;
  return Uint8Array.from(
    { length: SIZE * SIZE },
    (_, i) => 255 - pixels[i * 4]
  );
}

function wash(points, opacity = 80) {
  brush.fill('#141414', opacity);
  brush.fillBleed(0.08, 'out');
  brush.fillTexture(0.72, 0.65, 0.15, 0.15);
  brush.polygon(points);
}

window.paintedBake = {
  init() {
    const channels = [];
    reset(3719);
    wash(
      [
        [-116, -116],
        [116, -116],
        [116, 116],
        [-116, 116],
      ],
      72
    );
    wash(
      [
        [-128, -30],
        [-30, -105],
        [108, -22],
        [30, 90],
        [-110, 65],
      ],
      38
    );
    channels.push(density());
    reset(212);
    brush.set('cpencil', '#141414', 2.5);
    for (let y = -125; y < 128; y += 8) {
      brush.spline(
        [
          [-140, y, 0.7],
          [-40, y - 1, 1],
          [50, y + 1, 0.8],
          [140, y, 0.7],
        ],
        0.3
      );
    }
    channels.push(density());
    reset(937);
    wash(
      Array.from({ length: 48 }, (_, i) => {
        const angle = (i / 48) * Math.PI * 2;
        const r = 1 + Math.sin(angle * 5) * 0.08 + Math.cos(angle * 7) * 0.05;
        return [Math.cos(angle) * 91 * r, Math.sin(angle) * 70 * r];
      }),
      58
    );
    channels.push(density());
    reset(734);
    wash(
      [
        [0, -118],
        [58, -65],
        [75, 0],
        [43, 70],
        [0, 118],
        [-42, 66],
        [-70, 0],
        [-57, -63],
      ],
      80
    );
    brush.noFill();
    brush.set('cpencil', '#141414', 1);
    brush.line(0, -106, 0, 106);
    channels.push(density());
    const packed = new Uint8Array(SIZE * SIZE * 4);
    channels.forEach((values, channel) =>
      values.forEach((value, i) => {
        packed[i * 4 + channel] = value;
      })
    );
    this.bytes = packed;
    const botanical = [];
    const leaf = () => {
      brush.beginShape(0.6);
      [
        [0, -101],
        [59, -41],
        [62, 29],
        [0, 102],
        [-62, 29],
        [-59, -41],
      ].forEach(([x, y]) => brush.vertex(x, y));
      brush.endShape(true);
    };
    reset(734);
    brush.fill('#141414', 88);
    brush.fillBleed(0.06, 'in');
    brush.fillTexture(0.72, 0.7, 0.2, 0.15);
    leaf();
    botanical.push(density());
    brush.scaleBrushes(3);
    reset(735);
    brush.fill('#141414', 18);
    brush.fillBleed(0.04, 'in');
    brush.hatch(5, 38, { rand: 0.15 });
    brush.hatchStyle('cpencil', '#141414', 1.1);
    leaf();
    botanical.push(density());
    reset(736);
    brush.set('cpencil', '#141414', 1.2);
    leaf();
    brush.spline(
      [
        [0, 100, 0.6],
        [-10, 20, 0.8],
        [5, -53, 0.5],
        [0, -98, 0.1],
      ],
      0.6
    );
    for (let i = 0; i < 5; i += 1) {
      brush.line(-2, -48 + i * 22, -46 + i * 3, -60 + i * 22);
      brush.line(1, -48 + i * 22, 45 - i * 3, -60 + i * 22);
    }
    botanical.push(density());
    brush.scaleBrushes(1 / 3);
    reset(737);
    brush.set('cpencil', '#141414', 9);
    brush.spline(
      [
        [-145, 0, 0.25],
        [-50, -2, 0.8],
        [55, 2, 0.6],
        [145, 0, 0.25],
      ],
      0.3
    );
    botanical.push(density());
    this.botanical = new Uint8Array(SIZE * SIZE * 4);
    botanical.forEach((channel, k) =>
      channel.forEach((v, i) => {
        this.botanical[i * 4 + k] = v;
      })
    );
  },
  capture(kind) {
    let binary = '';
    (kind === 'botanical' ? this.botanical : this.bytes).forEach((value) => {
      binary += String.fromCharCode(value);
    });
    return { width: SIZE, height: SIZE, data: btoa(binary) };
  },
};
