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

// Weighted k-means in CIELAB from farthest-first seeds (no randomness):
// `k` groups of { lab, rgb, w, n } as weighted means.
function kmeans(samples, k) {
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
      w: 0,
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
      group.w += sample.weight;
      for (let a = 0; a < 3; a += 1) {
        group.lab[a] += sample.lab[a] * sample.weight;
        group.rgb[a] += sample.rgb[a] * sample.weight;
      }
    });
    return groups;
  };
  let groups = gather();
  for (let round = 0; round < 16; round += 1) {
    groups.forEach((group, j) => {
      if (group.w) centers[j] = group.lab.map((v) => v / group.w);
    });
    groups = gather();
  }
  return groups
    .filter((group) => group.w > 0)
    .map((group) => ({
      lab: group.lab.map((v) => v / group.w),
      n: group.n,
      rgb: group.rgb.map((v) => v / group.w),
      w: group.w,
    }));
}

// Ward's merge: the pair whose union costs least (area-weighted squared
// distance) joins until `k` remain, so specks fold into their neighbours
// while large distinct areas keep an ink each.
function wardMerge(groups, k) {
  const list = groups.map((group) => ({ ...group }));
  while (list.length > k) {
    let best = [0, 1];
    let bestCost = Infinity;
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const cost =
          ((list[i].w * list[j].w) / (list[i].w + list[j].w)) *
          distance2(list[i].lab, list[j].lab);
        if (cost < bestCost) {
          bestCost = cost;
          best = [i, j];
        }
      }
    }
    const [i, j] = best;
    const a = list[i];
    const b = list[j];
    const w = a.w + b.w;
    list[i] = {
      lab: a.lab.map((v, c) => (v * a.w + b.lab[c] * b.w) / w),
      n: a.n + b.n,
      rgb: a.rgb.map((v, c) => (v * a.w + b.rgb[c] * b.w) / w),
      w,
    };
    list.splice(j, 1);
  }
  return list;
}

// `k` inks from colour samples ({ rgb, weight? }), darkest first: many
// small k-means clusters merged down by Ward's cost, so the inks follow the
// subject's large distinct areas rather than its outliers. `vivid` (0–2)
// weights samples by chroma, so a green dumpster outvotes a grey street.
export function samplePalette(input, k, { vivid = 0 } = {}) {
  const samples = input.map((sample) => {
    const point = lab(...sample.rgb);
    const chroma = Math.hypot(point[1], point[2]);
    return {
      lab: point,
      rgb: sample.rgb,
      weight: (sample.weight ?? 1) * (1 + (vivid * chroma) / 40),
    };
  });
  if (!samples.length || k < 1) return [];
  const total = samples.length;
  return wardMerge(kmeans(samples, Math.max(k, Math.min(24, k * 4))), k)
    .map((group) => ({
      color: hex(group.rgb),
      lab: group.lab,
      share: group.n / total,
    }))
    .sort((a, b) => a.lab[0] - b.lab[0]);
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

// rgb → the index of the nearest palette ink in CIELAB.
export function nearestInk(palette) {
  return (rgb) => {
    const point = lab(...rgb);
    let best = 0;
    palette.forEach((entry, j) => {
      if (distance2(entry.lab, point) < distance2(palette[best].lab, point)) {
        best = j;
      }
    });
    return best;
  };
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
