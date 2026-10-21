const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function lab(r, g, b) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.9505);
  const y = f(0.2126 * lr + 0.7152 * lg + 0.0722 * lb);
  const z = f((0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.089);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const hex = (rgb) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

const distance2 = (a, b) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

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

// The subject's `k` inks: k-means over its pixels in CIELAB, seeded
// deterministically so a plot repeats exactly; darkest first.
export function imagePalette({ image, k, mask = null }) {
  const samples = [];
  const stride = Math.max(
    1,
    Math.floor(Math.sqrt((image.width * image.height) / 20000))
  );
  for (let y = 0; y < image.height; y += stride) {
    for (let x = 0; x < image.width; x += stride) {
      const i = y * image.width + x;
      if (!mask || mask.covered[i]) {
        const rgb = [
          image.data[i * 4],
          image.data[i * 4 + 1],
          image.data[i * 4 + 2],
        ];
        samples.push({ lab: lab(...rgb), rgb });
      }
    }
  }
  if (!samples.length || k < 1) return [];
  // k-means++ with the farthest sample as each next seed: no randomness.
  const centers = [samples[Math.floor(samples.length / 2)].lab];
  while (centers.length < Math.min(k, samples.length)) {
    let far = samples[0];
    let farD = -1;
    samples.forEach((sample) => {
      const d = Math.min(...centers.map((c) => distance2(c, sample.lab)));
      if (d > farD) {
        farD = d;
        far = sample;
      }
    });
    centers.push(far.lab);
  }
  const gather = () => {
    const groups = centers.map(() => ({
      lab: [0, 0, 0],
      n: 0,
      rgb: [0, 0, 0],
    }));
    samples.forEach((sample) => {
      let best = 0;
      centers.forEach((c, j) => {
        if (distance2(c, sample.lab) < distance2(centers[best], sample.lab)) {
          best = j;
        }
      });
      const group = groups[best];
      group.n += 1;
      for (let a = 0; a < 3; a += 1) {
        group.lab[a] += sample.lab[a];
        group.rgb[a] += sample.rgb[a];
      }
    });
    return groups;
  };
  let groups = gather();
  for (let round = 0; round < 16; round += 1) {
    groups.forEach((group, j) => {
      if (group.n) centers[j] = group.lab.map((v) => v / group.n);
    });
    groups = gather();
  }
  return groups
    .map((group, j) => ({
      color: hex(group.rgb.map((v) => v / Math.max(group.n, 1))),
      lab: centers[j],
      share: group.n / samples.length,
    }))
    .filter((entry) => entry.share > 0)
    .sort((a, b) => a.lab[0] - b.lab[0]);
}

// Each run split by the palette ink under it, smoothed so a stroke doesn't
// flicker between inks over a few pixels: { [color]: runs }.
export function colorRuns(
  runs,
  { image, mask = null, palette, pixelRatio = 1 }
) {
  const sample = colorAt({ image, mask, pixelRatio });
  const nearest = (rgb) => {
    if (!rgb) return -1;
    const point = lab(...rgb);
    let best = 0;
    palette.forEach((entry, j) => {
      if (distance2(entry.lab, point) < distance2(palette[best].lab, point)) {
        best = j;
      }
    });
    return best;
  };
  const byColor = {};
  runs.forEach((run) => {
    const raw = run.map((p) => nearest(sample(p.x, p.y)));
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
        const { color } = palette[current];
        byColor[color] ??= [];
        byColor[color].push(piece);
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
  return byColor;
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
