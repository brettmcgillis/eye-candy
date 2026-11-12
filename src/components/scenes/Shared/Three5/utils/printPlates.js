/* eslint-disable no-continue */
const INKS = ['#b85272', '#317e9c', '#e0b548', '#36303d'];
const rgb = (hex) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
const density = (channels) =>
  channels.map((v) => -Math.log(Math.max(0.025, v)));

function separate(target, vectors) {
  const amounts = vectors.map(() => 0);
  const remaining = [...target];
  for (let iteration = 0; iteration < 5; iteration += 1)
    vectors.forEach((ink, index) => {
      const previous = amounts[index];
      const dot = ink.reduce(
        (sum, v, channel) => sum + v * (remaining[channel] + previous * v),
        0
      );
      const norm = ink.reduce((sum, v) => sum + v * v, 0);
      const next = Math.min(1, Math.max(0, dot / norm));
      for (let c = 0; c < 3; c += 1) remaining[c] += (previous - next) * ink[c];
      amounts[index] = next;
    });
  return amounts;
}

export default function printPlates(source, config) {
  const size = 512;
  const input = document.createElement('canvas');
  input.width = size;
  input.height = size;
  const context = input.getContext('2d');
  context.drawImage(source, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const inks = INKS.slice(0, config.printInks);
  const vectors = inks.map((ink) => density(rgb(ink)));
  const cell = config.printCell;
  const paperWhite = density(rgb(config.paper));
  const plates = inks.map((ink, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    const angle = ((config.printAngle + index * 30) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.translate(
      size / 2 + Math.cos(index * 2.4) * config.printRegistration,
      size / 2 + Math.sin(index * 2.4) * config.printRegistration
    );
    ctx.rotate(angle);
    for (let y = -size; y <= size; y += cell)
      for (let x = -size; x <= size; x += cell) {
        const px = Math.round(x * cos - y * sin + size / 2);
        const py = Math.round(x * sin + y * cos + size / 2);
        if (px < 0 || py < 0 || px >= size || py >= size) continue;
        const offset = (py * size + px) * 4;
        const target = density([
          pixels[offset] / 255,
          pixels[offset + 1] / 255,
          pixels[offset + 2] / 255,
        ]);
        const relative = target.map((value, channel) =>
          Math.max(0, value - paperWhite[channel])
        );
        const amount = separate(relative, vectors)[index];
        if (amount < 0.006) continue;
        if (config.printDots === 'lines')
          ctx.fillRect(
            x - cell / 2,
            y - (cell * amount) / 2,
            cell + 0.2,
            cell * amount
          );
        else {
          ctx.beginPath();
          ctx.arc(x, y, Math.sqrt(amount / Math.PI) * cell, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    return canvas;
  });
  const composite = document.createElement('canvas');
  composite.width = size;
  composite.height = size;
  const ctx = composite.getContext('2d');
  ctx.fillStyle = config.paper;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'multiply';
  plates.forEach((plate) => ctx.drawImage(plate, 0, 0));
  return { composite, plates, inks };
}
