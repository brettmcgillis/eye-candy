import { nearestInk, samplePalette } from './palette.mjs';

export { nearestInk, samplePalette };

// The render's colour at an output-pixel point (RGBA at × pixelRatio), or
// null off the subject.
function colorAt({ image, mask, pixelRatio }) {
  return (x, y) => {
    const px = Math.floor(x * pixelRatio);
    const py = Math.floor(y * pixelRatio);
    if (px < 0 || py < 0 || px >= image.width || py >= image.height) {
      return null;
    }
    const i = py * image.width + px;
    if (mask && !mask.covered[i]) return null;
    return [image.data[i * 4], image.data[i * 4 + 1], image.data[i * 4 + 2]];
  };
}

// The pixels of an RGBA image (inside `mask`) as palette samples, about
// 20 000 of them.
export function imageSamples({ image, mask = null, weight = 1 }) {
  const samples = [];
  const stride = Math.max(
    1,
    Math.floor(Math.sqrt((image.width * image.height) / 20000))
  );
  for (let y = 0; y < image.height; y += stride) {
    for (let x = 0; x < image.width; x += stride) {
      const i = y * image.width + x;
      if (!mask || mask.covered[i]) {
        samples.push({
          rgb: [
            image.data[i * 4],
            image.data[i * 4 + 1],
            image.data[i * 4 + 2],
          ],
          weight,
        });
      }
    }
  }
  return samples;
}

// The subject's `k` inks from its render: see samplePalette.
export function imagePalette({ image, k, mask = null, vivid = 0 }) {
  return samplePalette(imageSamples({ image, mask }), k, { vivid });
}

// An image's ink at an output-pixel point, or -1 off `mask`.
export function inkSampler({ image, mask = null, palette, pixelRatio = 1 }) {
  const sample = colorAt({ image, mask, pixelRatio });
  const nearest = nearestInk(palette);
  return (x, y) => {
    const rgb = sample(x, y);
    return rgb ? nearest(rgb) : -1;
  };
}

// Each run split by the ink `inkAt(x, y)` gives under it (-1: none, the run
// keeps its current ink), smoothed so a stroke doesn't flicker between inks
// over a few pixels: { [ink index]: runs }.
export function inkRuns(runs, inkAt) {
  const byInk = {};
  runs.forEach((run) => {
    const raw = run.map((p) => inkAt(p.x, p.y));
    const labels = raw.map((label, i) => {
      if (label < 0) return label;
      const votes = new Map();
      for (
        let j = Math.max(0, i - 3);
        j <= Math.min(raw.length - 1, i + 3);
        j += 1
      ) {
        if (raw[j] >= 0) votes.set(raw[j], (votes.get(raw[j]) ?? 0) + 1);
      }
      return [...votes].sort((a, b) => b[1] - a[1])[0][0];
    });
    let piece = [];
    let current = -2;
    const flush = () => {
      if (current >= 0 && piece.length > 1) {
        byInk[current] ??= [];
        byInk[current].push(piece);
      }
    };
    run.forEach((p, i) => {
      const label = labels[i] < 0 ? current : labels[i];
      if (label !== current) {
        flush();
        piece = current >= 0 && piece.length ? [piece.at(-1)] : [];
        current = label;
      }
      piece.push(p);
    });
    flush();
  });
  return byInk;
}

// Each run split by the palette ink of the render under it: { [color]: runs }.
export function colorRuns(
  runs,
  { image, mask = null, palette, pixelRatio = 1 }
) {
  const byInk = inkRuns(runs, inkSampler({ image, mask, palette, pixelRatio }));
  return Object.fromEntries(
    Object.entries(byInk).map(([ink, list]) => [palette[ink].color, list])
  );
}

// Tone as wiggle on any line work: each run resampled every `step` px and
// swung across itself by up to `amplitude` px times the tone there, once
// every `wavelength(tone)` px of travel.
export function wiggleRuns(
  runs,
  { amplitude, step = 0.75, tone, wavelength = (t) => 6 * (1.6 - t) }
) {
  return runs.map((run) => {
    const out = [];
    let phase = 0;
    for (let i = 1; i < run.length; i += 1) {
      const a = run[i - 1];
      const b = run[i];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = length ? -(b.y - a.y) / length : 0;
      const ny = length ? (b.x - a.x) / length : 0;
      const steps = Math.max(1, Math.ceil(length / step));
      for (let s = i === 1 ? 0 : 1; s <= steps; s += 1) {
        const x = a.x + ((b.x - a.x) * s) / steps;
        const y = a.y + ((b.y - a.y) * s) / steps;
        const t = tone(x, y);
        if (s > 0) phase += (2 * Math.PI * (length / steps)) / wavelength(t);
        const swing = amplitude * t * Math.sin(phase);
        out.push({ x: x + nx * swing, y: y + ny * swing });
      }
    }
    return out.length > 1 ? out : run;
  });
}
