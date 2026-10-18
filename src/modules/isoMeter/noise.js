/* eslint-disable no-bitwise */
import { createLcg } from './rng';

const YWRAPB = 4;
const YWRAP = 1 << YWRAPB;
const ZWRAPB = 8;
const ZWRAP = 1 << ZWRAPB;
const SIZE = 4095;

const scaledCosine = (i) => 0.5 * (1 - Math.cos(i * Math.PI));

export default function createNoise(seed, { octaves = 4, falloff = 0.5 } = {}) {
  const lcg = createLcg(seed);
  const perlin = new Float64Array(SIZE + 1);
  for (let i = 0; i <= SIZE; i += 1) perlin[i] = lcg.next();

  const state = { falloff, octaves };

  const noise = (px, py = 0, pz = 0) => {
    const x = Math.abs(px);
    const y = Math.abs(py);
    const z = Math.abs(pz);
    let xi = Math.floor(x);
    let yi = Math.floor(y);
    let zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let r = 0;
    let ampl = 0.5;
    for (let o = 0; o < state.octaves; o += 1) {
      let of = xi + (yi << YWRAPB) + (zi << ZWRAPB);
      const rxf = scaledCosine(xf);
      const ryf = scaledCosine(yf);
      let n1 = perlin[of & SIZE];
      n1 += rxf * (perlin[(of + 1) & SIZE] - n1);
      let n2 = perlin[(of + YWRAP) & SIZE];
      n2 += rxf * (perlin[(of + YWRAP + 1) & SIZE] - n2);
      n1 += ryf * (n2 - n1);
      of += ZWRAP;
      n2 = perlin[of & SIZE];
      n2 += rxf * (perlin[(of + 1) & SIZE] - n2);
      let n3 = perlin[(of + YWRAP) & SIZE];
      n3 += rxf * (perlin[(of + YWRAP + 1) & SIZE] - n3);
      n2 += ryf * (n3 - n2);
      n1 += scaledCosine(zf) * (n2 - n1);
      r += n1 * ampl;
      ampl *= state.falloff;
      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      zi <<= 1;
      zf *= 2;
      if (xf >= 1) {
        xi += 1;
        xf -= 1;
      }
      if (yf >= 1) {
        yi += 1;
        yf -= 1;
      }
      if (zf >= 1) {
        zi += 1;
        zf -= 1;
      }
    }
    return r;
  };

  noise.detail = (lod, fall) => {
    if (lod > 0) state.octaves = lod;
    if (fall > 0) state.falloff = fall;
  };

  return noise;
}
