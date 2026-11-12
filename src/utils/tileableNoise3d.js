/* eslint-disable no-bitwise */
import * as THREE from 'three/webgpu';

import { mulberry32 } from '@utils/noise2d';

// Nightscape's tileable 3D noise, ported as is: R billow (Perlin-Worley),
// G detail Worley, B smooth Perlin, each stretched to its 0.5%–99.5% range.
export default function buildNoise(N = 64, seed = 90210) {
  const rnd = mulberry32(seed);
  const gradCache = {};
  const ptCache = {};
  function grads(P) {
    if (gradCache[P]) return gradCache[P];
    const g = new Float32Array(P * P * P * 3);
    for (let i = 0; i < P * P * P; i += 1) {
      let x;
      let y;
      let z;
      let l;
      do {
        x = rnd() * 2 - 1;
        y = rnd() * 2 - 1;
        z = rnd() * 2 - 1;
        l = x * x + y * y + z * z;
      } while (l > 1 || l < 1e-4);
      l = Math.sqrt(l);
      g[i * 3] = x / l;
      g[i * 3 + 1] = y / l;
      g[i * 3 + 2] = z / l;
    }
    gradCache[P] = g;
    return g;
  }
  function points(P) {
    if (ptCache[P]) return ptCache[P];
    const p = new Float32Array(P * P * P * 3);
    for (let i = 0; i < p.length; i += 1) p[i] = rnd();
    ptCache[P] = p;
    return p;
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const wrap = (v, P) => ((v % P) + P) % P;
  function perlin(x, y, z, P) {
    const g = grads(P);
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;
    const x0 = wrap(xi, P);
    const y0 = wrap(yi, P);
    const z0 = wrap(zi, P);
    const x1 = (x0 + 1) % P;
    const y1 = (y0 + 1) % P;
    const z1 = (z0 + 1) % P;
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);
    const d = (a, b, c, dx, dy, dz) => {
      const k = 3 * (a + P * (b + P * c));
      return g[k] * dx + g[k + 1] * dy + g[k + 2] * dz;
    };
    const n000 = d(x0, y0, z0, xf, yf, zf);
    const n100 = d(x1, y0, z0, xf - 1, yf, zf);
    const n010 = d(x0, y1, z0, xf, yf - 1, zf);
    const n110 = d(x1, y1, z0, xf - 1, yf - 1, zf);
    const n001 = d(x0, y0, z1, xf, yf, zf - 1);
    const n101 = d(x1, y0, z1, xf - 1, yf, zf - 1);
    const n011 = d(x0, y1, z1, xf, yf - 1, zf - 1);
    const n111 = d(x1, y1, z1, xf - 1, yf - 1, zf - 1);
    const nx00 = n000 + u * (n100 - n000);
    const nx10 = n010 + u * (n110 - n010);
    const nx01 = n001 + u * (n101 - n001);
    const nx11 = n011 + u * (n111 - n011);
    const nxy0 = nx00 + v * (nx10 - nx00);
    const nxy1 = nx01 + v * (nx11 - nx01);
    return nxy0 + w * (nxy1 - nxy0);
  }
  function worley(x, y, z, P) {
    const pts = points(P);
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    let md = 1e9;
    for (let dz = -1; dz <= 1; dz += 1) {
      const cz = zi + dz;
      const wz = wrap(cz, P);
      for (let dy = -1; dy <= 1; dy += 1) {
        const cy = yi + dy;
        const wy = wrap(cy, P);
        for (let dx = -1; dx <= 1; dx += 1) {
          const cx = xi + dx;
          const wx = wrap(cx, P);
          const k = 3 * (wx + P * (wy + P * wz));
          const px = cx + pts[k] - x;
          const py = cy + pts[k + 1] - y;
          const pz = cz + pts[k + 2] - z;
          const d2 = px * px + py * py + pz * pz;
          if (d2 < md) md = d2;
        }
      }
    }
    return Math.min(Math.sqrt(md), 1);
  }

  const T = N * N * N;
  const R = new Float32Array(T);
  const G = new Float32Array(T);
  const B = new Float32Array(T);
  let idx = 0;
  for (let iz = 0; iz < N; iz += 1) {
    for (let iy = 0; iy < N; iy += 1) {
      for (let ix = 0; ix < N; ix += 1, idx += 1) {
        const x = (ix + 0.5) / N;
        const y = (iy + 0.5) / N;
        const z = (iz + 0.5) / N;
        const p =
          (perlin(x * 4, y * 4, z * 4, 4) +
            0.5 * perlin(x * 8, y * 8, z * 8, 8) +
            0.25 * perlin(x * 16, y * 16, z * 16, 16)) /
          1.75;
        const w4 = 1 - worley(x * 4, y * 4, z * 4, 4);
        const w8 = 1 - worley(x * 8, y * 8, z * 8, 8);
        const w16 = 1 - worley(x * 16, y * 16, z * 16, 16);
        const w32 = 1 - worley(x * 32, y * 32, z * 32, 32);
        R[idx] =
          0.6 * (0.625 * w4 + 0.25 * w8 + 0.125 * w16) + 0.4 * (p * 0.5 + 0.5);
        G[idx] = 0.5 * w8 + 0.3 * w16 + 0.2 * w32;
        B[idx] =
          perlin(x * 2, y * 2, z * 2, 2) +
          0.5 * perlin(x * 4, y * 4, z * 4, 4) +
          0.25 * perlin(x * 8, y * 8, z * 8, 8) +
          0.125 * perlin(x * 16, y * 16, z * 16, 16);
      }
    }
  }
  const range = (a) => {
    const s = Float32Array.from(a).sort();
    return [s[Math.floor(s.length * 0.005)], s[Math.floor(s.length * 0.995)]];
  };
  const rr = range(R);
  const gr = range(G);
  const br = range(B);
  const data = new Uint8Array(T * 4);
  const q = (v, r) =>
    Math.max(0, Math.min(255, Math.round(((v - r[0]) / (r[1] - r[0])) * 255)));
  for (let i = 0; i < T; i += 1) {
    data[i * 4] = q(R[i], rr);
    data[i * 4 + 1] = q(G[i], gr);
    data[i * 4 + 2] = q(B[i], br);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.Data3DTexture(data, N, N, N);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.wrapR = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

let shared = null;

// One copy for the sky and the smoke: the build is most of a second of CPU.
export function sharedNoise() {
  if (!shared) shared = buildNoise();
  return shared;
}
