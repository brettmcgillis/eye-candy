const clamp = (value) => Math.min(1, Math.max(0, value));

export function animationBuffers(size) {
  const canvas = () => {
    const output = document.createElement('canvas');
    output.width = size;
    output.height = size;
    return output;
  };
  const mask = document.createElement('canvas');
  mask.width = 192;
  mask.height = 192;
  return {
    canvas: canvas(),
    source: canvas(),
    scratch: canvas(),
    inkMask: canvas(),
    mask,
    pixels: mask.getContext('2d').createImageData(192, 192),
  };
}

export function compositeReveal(
  buffers,
  source,
  field,
  phase,
  config,
  diagnostic
) {
  const { data } = buffers.pixels;
  for (let i = 0; i < field.values.length; i += 1) {
    let alpha = clamp(
      (phase - field.values[i] + config.revealSoftness) / config.revealSoftness
    );
    if (phase <= 0) alpha = 0;
    if (phase >= 1) alpha = 1;
    data[i * 4] = 255;
    data[i * 4 + 1] = 255;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = alpha * 255;
  }
  buffers.mask.getContext('2d').putImageData(buffers.pixels, 0, 0);
  const size = buffers.canvas.width;
  const ctx = buffers.canvas.getContext('2d');
  ctx.fillStyle = diagnostic ? '#000000' : config.paper;
  ctx.fillRect(0, 0, size, size);
  if (diagnostic) {
    ctx.drawImage(buffers.mask, 0, 0, size, size);
    return;
  }
  const scratch = buffers.scratch.getContext('2d');
  scratch.clearRect(0, 0, size, size);
  scratch.drawImage(source, 0, 0, size, size);
  scratch.globalCompositeOperation = 'destination-in';
  scratch.drawImage(buffers.mask, 0, 0, size, size);
  scratch.globalCompositeOperation = 'source-over';
  ctx.drawImage(buffers.scratch, 0, 0);
}

function revealInk(buffers, ink, shape, phase, config, ctx) {
  if (phase >= 1) {
    ctx.drawImage(ink, 0, 0);
    return;
  }
  if (phase <= 0) return;
  const size = buffers.canvas.width;
  const mask = buffers.inkMask.getContext('2d');
  mask.clearRect(0, 0, size, size);
  mask.save();
  mask.scale(size / 768, size / 768);
  mask.strokeStyle = '#ffffff';
  mask.lineWidth = 28 + config.strokeWeight * config.brushScale * 8;
  mask.lineCap = 'round';
  mask.lineJoin = 'round';
  const { points } = shape;
  const end = phase * points.length;
  mask.beginPath();
  mask.moveTo(...points[0]);
  for (let i = 1; i <= Math.floor(end); i += 1)
    mask.lineTo(...points[i % points.length]);
  const index = Math.floor(end);
  const a = points[index % points.length];
  const b = points[(index + 1) % points.length];
  const t = end - index;
  mask.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
  mask.stroke();
  mask.restore();
  const scratch = buffers.scratch.getContext('2d');
  scratch.clearRect(0, 0, size, size);
  scratch.drawImage(ink, 0, 0);
  scratch.globalCompositeOperation = 'destination-in';
  scratch.drawImage(buffers.inkMask, 0, 0);
  scratch.globalCompositeOperation = 'source-over';
  ctx.drawImage(buffers.scratch, 0, 0);
}

export function compositeSequence(
  buffers,
  target,
  animation,
  phase,
  config,
  inkOnly = false
) {
  const ctx = target.getContext('2d');
  ctx.fillStyle = config.paper;
  ctx.fillRect(0, 0, target.width, target.height);
  let ink = phase;
  let wash = phase;
  if (config.sequenceOrder === 'ink then wash') {
    ink = clamp(phase / config.sequenceInkShare);
    wash = clamp(
      (phase - config.sequenceInkShare) / (1 - config.sequenceInkShare)
    );
  }
  if (config.sequenceOrder === 'wash then ink') {
    wash = clamp(phase / (1 - config.sequenceInkShare));
    ink = clamp(
      (phase - 1 + config.sequenceInkShare) / config.sequenceInkShare
    );
  }
  const paintInks = () =>
    animation.inks.forEach((layer, i) =>
      revealInk(
        buffers,
        layer,
        animation.shapes[i],
        clamp(ink * animation.inks.length - i),
        config,
        ctx
      )
    );
  const paintWashes = () => {
    if (inkOnly) return;
    animation.layers.forEach((layer, i) => {
      ctx.globalAlpha = clamp(
        (wash * animation.layers.length - i) / config.sequenceFade
      );
      ctx.drawImage(layer, 0, 0);
      ctx.globalAlpha = 1;
    });
  };
  if (config.sequenceOrder === 'ink then wash') {
    paintInks();
    paintWashes();
  } else {
    paintWashes();
    paintInks();
  }
}

export function drawMorphReference(canvas, config, shapes) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.fillStyle = config.paper;
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.scale(size / 768, size / 768);
  ctx.strokeStyle = config.ink;
  ctx.lineWidth = 2.5;
  shapes.forEach((shape) => {
    ctx.beginPath();
    ctx.moveTo(...shape.points[0]);
    shape.points.slice(1).forEach((p) => ctx.lineTo(...p));
    ctx.closePath();
    ctx.stroke();
  });
  ctx.restore();
}
