import { screenCoordinate, texture, uniform, wgslFn } from 'three/tsl';
import * as THREE from 'three/webgpu';

import inBatches from './inBatches';
import { TER_H_WGSL, TER_L_WGSL, TER_N, TER_T_WGSL } from './terrainWgsl';

const terHFn = wgslFn(TER_H_WGSL);
const terLFn = wgslFn(TER_L_WGSL);
const terTFn = wgslFn(TER_T_WGSL);

const TER_LO = -100;
const TER_RANGE = 52;
const WATER_Y = -85;
const TILE = 320;

function terrainTarget(type) {
  const rt = new THREE.RenderTarget(TER_N, TER_N, {
    depthBuffer: false,
    generateMipmaps: true,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearMipmapLinearFilter,
    type,
  });
  rt.texture.wrapS = THREE.RepeatWrapping;
  rt.texture.wrapT = THREE.RepeatWrapping;
  return rt;
}

function passMaterial(colorNode) {
  const material = new THREE.NodeMaterial();
  material.colorNode = colorNode;
  material.blending = THREE.NoBlending;
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;
  material.toneMapped = false;
  return material;
}

const fract = (v) => v - Math.floor(v);
const f32 = Math.fround;
function hash12js(x, y) {
  const a = fract(f32(x * f32(0.1031)));
  const b = fract(f32(y * f32(0.1031)));
  const k = f32(a * (b + 33.33) + b * (a + 33.33) + a * (a + 33.33));
  return fract(f32((a + k + b + k) * (a + k)));
}

// Nightscape's placeMasts(): the two highest summits at least 45 units
// apart, each a block of the height map that is the highest for ~30 units
// round, as (x, z, base height, flash phase).
function placeMasts(heights) {
  const B = 16;
  const NB = TER_N / B;
  const bh = new Float32Array(NB * NB).fill(-1e9);
  const bi = new Int32Array(NB * NB);
  for (let j = 0; j < TER_N; j += 1) {
    for (let i = 0; i < TER_N; i += 1) {
      const k = Math.floor(j / B) * NB + Math.floor(i / B);
      const y = heights[j * TER_N + i];
      if (y > bh[k]) {
        bh[k] = y;
        bi[k] = j * TER_N + i;
      }
    }
  }
  const peaks = [];
  for (let bj = 0; bj < NB; bj += 1) {
    for (let bx = 0; bx < NB; bx += 1) {
      const y = bh[bj * NB + bx];
      let top = y >= WATER_Y + 14;
      for (let dj = -2; dj <= 2 && top; dj += 1) {
        for (let di = -2; di <= 2 && top; di += 1) {
          if (di || dj) {
            top = bh[((bj + dj + NB) % NB) * NB + ((bx + di + NB) % NB)] <= y;
          }
        }
      }
      if (top) peaks.push({ i: bi[bj * NB + bx], y });
    }
  }
  peaks.sort((a, b) => b.y - a.y);
  const f = TILE / TER_N;
  const wrap = (d) => ((((d + TILE / 2) % TILE) + TILE) % TILE) - TILE / 2;
  const picked = [];
  peaks.forEach((p) => {
    if (picked.length >= 2) return;
    const x = ((p.i % TER_N) + 0.5) * f;
    const z = (Math.floor(p.i / TER_N) + 0.5) * f;
    if (picked.some((q) => Math.hypot(wrap(x - q.x), wrap(z - q.z)) < 45))
      return;
    picked.push({ x, y: p.y, z });
  });
  return picked.map(
    (p, k) =>
      new THREE.Vector4(p.x, p.z, p.y - 0.1, hash12js(k * 7.3 + 1.1, 3.7))
  );
}

const halfToFloat = (h) => {
  const e = (h >> 10) & 31; // eslint-disable-line no-bitwise
  const m = h & 1023; // eslint-disable-line no-bitwise
  const v = e === 0 ? m * 5.960464477539063e-8 : (1 + m / 1024) * 2 ** (e - 15);
  return h & 0x8000 ? -v : v; // eslint-disable-line no-bitwise
};

// Nightscape's flooded-mountain bakes: height, then colour / horizons and
// town lights from it, each in strips spread over frames, then the heights
// read back to stand radio masts on the two highest summits. The light
// (moonlight or sunlight and its shadows) is double-buffered and follows
// the key light as it moves.
export default function createTerrain({ seed }) {
  const terH = terrainTarget(THREE.HalfFloatType);
  const terA = [0, 1].map(() => terrainTarget(THREE.UnsignedByteType));
  const terB = terrainTarget(THREE.UnsignedByteType);
  const terC = terrainTarget(THREE.UnsignedByteType);
  const terL = terrainTarget(THREE.HalfFloatType);
  const u = {
    lightDirs: [0, 1].map(() => uniform(new THREE.Vector3(0, 1, 0))),
    mast0: uniform(new THREE.Vector4()),
    mast1: uniform(new THREE.Vector4()),
    mastN: uniform(0),
    mix: uniform(0),
    top: uniform(TER_LO + TER_RANGE),
  };

  const heightMaterial = passMaterial(
    terHFn({ fragCoord: screenCoordinate, seed })
  );
  const terLMaterial = (mode, lightDir) =>
    passMaterial(
      terLFn({
        fragCoord: screenCoordinate,
        mode: uniform(mode),
        lightDir,
        hT: texture(terH.texture),
        hS: texture(terH.texture),
      })
    );
  const litMaterials = u.lightDirs.map((dir) => terLMaterial(0, dir));
  const albedoMaterial = terLMaterial(1, u.lightDirs[0]);
  const horizonMaterial = terLMaterial(2, u.lightDirs[0]);
  const townMaterial = passMaterial(
    terTFn({
      fragCoord: screenCoordinate,
      seed,
      hT: texture(terH.texture),
      hS: texture(terH.texture),
    })
  );

  const strips = (rt, material, n) =>
    Array.from({ length: n }, (_, s) => ({ material, n, rt, s }));
  const groundJobs = [
    ...strips(terH, heightMaterial, 4),
    ...strips(terB, albedoMaterial, 2),
    ...strips(terC, horizonMaterial, 4),
    ...strips(terL, townMaterial, 8),
  ];
  const quad = new THREE.QuadMesh(heightMaterial);
  let jobs = [];
  let generation = 0;
  // Light double-buffer, as the clouds': `shown` is the buffer the mix
  // fades toward, `slot` the one being lit (-1 idle).
  const light = { dirty: true, fade: 1, shown: 0, slot: -1 };
  const LIGHT_FADE = 0.4;

  async function readMasts(renderer, at) {
    const buf = await renderer.readRenderTargetPixelsAsync(
      terH,
      0,
      0,
      TER_N,
      TER_N
    );
    if (at !== generation) return;
    const heights = new Float32Array(TER_N * TER_N);
    let top = -1e9;
    for (let i = 0; i < heights.length; i += 1) {
      const y = TER_LO + halfToFloat(buf[i * 4]) * TER_RANGE;
      heights[i] = y;
      if (y > top) top = y;
    }
    u.top.value = top + 0.3;
    const masts = placeMasts(heights);
    if (masts[0]) u.mast0.value.copy(masts[0]);
    if (masts[1]) u.mast1.value.copy(masts[1]);
    u.mastN.value = masts.length;
  }

  return {
    textures: {
      terA: terA.map((rt) => rt.texture),
      terB: terB.texture,
      terC: terC.texture,
      terH: terH.texture,
      terL: terL.texture,
    },
    uniforms: u,

    // Everything from the heights on (the seed moved the ground).
    rebuild() {
      generation += 1;
      jobs = [...groundJobs];
      light.dirty = true;
    },

    // Re-light into the spare buffer once the key light has moved, then
    // cross-fade onto it.
    follow(key, delta) {
      if (light.slot < 0 && light.fade >= 1 && !jobs.length) {
        const moved = key.angleTo(u.lightDirs[light.shown].value) > 0.01;
        if (light.dirty || moved) {
          const slot = 1 - light.shown;
          light.slot = slot;
          light.dirty = false;
          u.lightDirs[slot].value.copy(key);
          jobs = strips(terA[slot], litMaterials[slot], 8);
          jobs[jobs.length - 1].done = () => {
            light.shown = slot;
            light.slot = -1;
            light.fade = 0;
          };
        }
      }
      light.fade = Math.min(1, light.fade + delta / LIGHT_FADE);
      u.mix.value = light.shown === 1 ? light.fade : 1 - light.fade;
    },

    // Every strip now instead of one a frame, ground then light toward
    // `key`, letting the GPU drain every few strips, for a scene that waits
    // to show until its ground is ready.
    async prebake(renderer, key, settle) {
      this.rebuild();
      const run = () =>
        inBatches([...jobs], 6, settle, () => this.step(renderer));
      await run();
      this.follow(key, 0);
      await run();
      light.fade = 1;
      u.mix.value = light.shown === 1 ? 1 : 0;
    },

    // One strip per frame; the heights are read back once they are done.
    step(renderer) {
      const job = jobs.shift();
      if (!job) return;
      const h = TER_N / job.n;
      job.rt.scissor.set(0, job.s * h, TER_N, h);
      job.rt.scissorTest = true;
      quad.material = job.material;
      renderer.setRenderTarget(job.rt);
      quad.render(renderer);
      if (job.rt === terH && job.s === job.n - 1)
        readMasts(renderer, generation);
      job.done?.();
    },

    dispose() {
      [terH, ...terA, terB, terC, terL].forEach((rt) => rt.dispose());
      [
        heightMaterial,
        townMaterial,
        albedoMaterial,
        horizonMaterial,
        ...litMaterials,
      ].forEach((m) => m.dispose());
    },
  };
}
