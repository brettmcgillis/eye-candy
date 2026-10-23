// The colour science a colour plot shares, dependency-free so the CLIs'
// plain-Node plot writer and the kernels load the same file.
const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export function lab(r, g, b) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.9505);
  const y = f(0.2126 * lr + 0.7152 * lg + 0.0722 * lb);
  const z = f((0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.089);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export const hex = (rgb) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

export const distance2 = (a, b) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

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
      mass: 0,
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
      group.mass += sample.mass ?? 1;
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
      mass: group.mass,
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
      mass: a.mass + b.mass,
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
      mass: sample.weight ?? 1,
      rgb: sample.rgb,
      weight: (sample.weight ?? 1) * (1 + (vivid * chroma) / 40),
    };
  });
  if (!samples.length || k < 1) return [];
  const total = samples.length;
  const totalWeight = input.reduce(
    (sum, sample) => sum + (sample.weight ?? 1),
    0
  );
  return wardMerge(kmeans(samples, Math.max(k, Math.min(24, k * 4))), k)
    .map((group) => ({
      color: hex(group.rgb),
      lab: group.lab,
      // `share` counts samples, `mass` their input weight (a folded sample
      // stands for many pixels).
      mass: group.mass / totalWeight,
      share: group.n / total,
    }))
    .sort((a, b) => a.lab[0] - b.lab[0]);
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

// Colours closer than one pen can tell apart (ΔE < 8) fold together first,
// heaviest first, so Ward's area-weighted merge never spends two inks on one
// colour drawn in quantity. Samples are `{ rgb, weight }`.
const CLOSE = 8 ** 2;
export function foldClose(colors) {
  const folded = [];
  [...colors]
    .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1))
    .forEach((color) => {
      const point = lab(...color.rgb);
      const near = folded.find((entry) => distance2(entry.lab, point) < CLOSE);
      if (!near) {
        folded.push({ ...color, lab: point, weight: color.weight ?? 1 });
        return;
      }
      const add = color.weight ?? 1;
      const weight = near.weight + add;
      near.rgb = near.rgb.map(
        (v, c) => (v * near.weight + color.rgb[c] * add) / weight
      );
      near.weight = weight;
    });
  return folded;
}
