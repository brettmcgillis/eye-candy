const FBM_GAIN = 0.5;
const FBM_LACUNARITY = 2.03;

// Measured maximum slope of fbm1 at three octaves. Callers that displace a
// parameter by an fbm term need it to know how far they can push before the
// displacement folds the function they are warping.
export const FBM3_MAX_SLOPE = 4.1;

function hash1(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return (s - Math.floor(s)) * 2 - 1;
}

export function hash01(n) {
  return hash1(n) * 0.5 + 0.5;
}

function valueNoise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i) * (1 - u) + hash1(i + 1) * u;
}

export function fbm1(x, octaves = 4) {
  let sum = 0;
  let total = 0;
  let amp = 1;
  let freq = 1;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * valueNoise1(x * freq);
    total += amp;
    amp *= FBM_GAIN;
    freq *= FBM_LACUNARITY;
  }
  return sum / total;
}
