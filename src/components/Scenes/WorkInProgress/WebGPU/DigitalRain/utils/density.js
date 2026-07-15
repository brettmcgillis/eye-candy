import {
  Fn,
  Loop,
  dot,
  float,
  floor,
  fract,
  int,
  min,
  mix,
  step,
  time,
  uint,
  vec2,
  vec3,
} from 'three/tsl';

// Faithful port of ~/dev/examples/three-volumetric-clouds's cloud density —
// CloudsRenderer/shaders/{common,perlin,worley}.ts +
// CloudsRenderer/materials/CloudMaterial's getCloudDensity/
// getDimensionalProfile + CloudsRenderer/fbo/TextureA3D+TextureEnvelope's
// bake formulas — evaluated LIVE per raymarch sample instead of pre-baked
// into 3D/2D textures (the reference bakes for perf; this trades bake-once
// for eval-live, tunable via cloudSteps/cloudPerlinOctaves so it stays
// GPU-affordable). worleyFbmB/C, the envelope's cloud-type blend, and
// heightBlend/noiseComposite are all computed by the reference but never
// actually consumed by its own density formula — dropped here too, same
// visual result for less work.

// -- common.ts: hash33 + remap ----------------------------------------
const UI0 = 1597334673;
const UI1 = 3812015801;
const UI2 = 2798796415;
const UIF = 1 / 4294967295; // 1 / 0xffffffffU

function hash33(p) {
  const ix = p.x.toInt().toUint().mul(uint(UI0));
  const iy = p.y.toInt().toUint().mul(uint(UI1));
  const iz = p.z.toInt().toUint().mul(uint(UI2));
  const combined = ix.bitXor(iy).bitXor(iz);
  return vec3(
    combined.mul(uint(UI0)).toFloat().mul(UIF).mul(2).sub(1),
    combined.mul(uint(UI1)).toFloat().mul(UIF).mul(2).sub(1),
    combined.mul(uint(UI2)).toFloat().mul(UIF).mul(2).sub(1)
  );
}

// a/b/c/d must already be TSL float nodes (wrap JS literals with float()).
function remap(x, a, b, c, d) {
  return x.sub(a).div(b.sub(a)).mul(d.sub(c)).add(c);
}

// -- perlin.ts: tileable gradient noise + fbm --------------------------
function perlinNoise(x, freq) {
  const p = floor(x);
  const w = fract(x);
  const u = w
    .mul(w)
    .mul(w)
    .mul(w.mul(w.mul(6).sub(15)).add(10));

  const ga = hash33(p.add(vec3(0, 0, 0)).mod(freq));
  const gb = hash33(p.add(vec3(1, 0, 0)).mod(freq));
  const gc = hash33(p.add(vec3(0, 1, 0)).mod(freq));
  const gd = hash33(p.add(vec3(1, 1, 0)).mod(freq));
  const ge = hash33(p.add(vec3(0, 0, 1)).mod(freq));
  const gf = hash33(p.add(vec3(1, 0, 1)).mod(freq));
  const gg = hash33(p.add(vec3(0, 1, 1)).mod(freq));
  const gh = hash33(p.add(vec3(1, 1, 1)).mod(freq));

  const va = dot(ga, w.sub(vec3(0, 0, 0)));
  const vb = dot(gb, w.sub(vec3(1, 0, 0)));
  const vc = dot(gc, w.sub(vec3(0, 1, 0)));
  const vd = dot(gd, w.sub(vec3(1, 1, 0)));
  const ve = dot(ge, w.sub(vec3(0, 0, 1)));
  const vf = dot(gf, w.sub(vec3(1, 0, 1)));
  const vg = dot(gg, w.sub(vec3(0, 1, 1)));
  const vh = dot(gh, w.sub(vec3(1, 1, 1)));

  return va
    .add(u.x.mul(vb.sub(va)))
    .add(u.y.mul(vc.sub(va)))
    .add(u.z.mul(ve.sub(va)))
    .add(u.x.mul(u.y).mul(va.sub(vb).sub(vc).add(vd)))
    .add(u.y.mul(u.z).mul(va.sub(vc).sub(ve).add(vg)))
    .add(u.z.mul(u.x).mul(va.sub(vb).sub(ve).add(vf)))
    .add(
      u.x
        .mul(u.y)
        .mul(u.z)
        .mul(
          va.negate().add(vb).add(vc).sub(vd).add(ve).sub(vf).sub(vg).add(vh)
        )
    );
}

const FBM_GAIN = 2 ** -0.85; // exp2(-0.85)

// octaves is a live node (like mx_fractal_noise_float) so cloudPerlinOctaves
// can be tuned from Leva without a material rebuild.
function perlinFbm(pIn, freqIn, octavesIn) {
  const freq = float(freqIn).toVar();
  const p = vec3(pIn).toVar();
  const amp = float(1).toVar();
  const noise = float(0).toVar();

  Loop(int(octavesIn), () => {
    noise.addAssign(amp.mul(perlinNoise(p.mul(freq), freq)));
    amp.mulAssign(FBM_GAIN);
    freq.mulAssign(2);
  });

  // mix(1, noise, 0.5)*2 - 1 algebraically reduces to abs(noise); kept as
  // the literal reference sequence rather than pre-simplified.
  const mixed = mix(float(1), noise, 0.5);
  return mixed.mul(2).sub(1).abs();
}

// -- worley.ts: tileable 3D worley noise + fbm --------------------------
const WORLEY_OFFSETS = [];
for (let x = -1; x <= 1; x += 1) {
  for (let y = -1; y <= 1; y += 1) {
    for (let z = -1; z <= 1; z += 1) {
      WORLEY_OFFSETS.push([x, y, z]);
    }
  }
}

function worleyNoise(uv, freq) {
  const id = floor(uv);
  const p = fract(uv);
  const minDist = float(10000).toVar();

  WORLEY_OFFSETS.forEach(([ox, oy, oz]) => {
    const offset = vec3(ox, oy, oz);
    const h = hash33(id.add(offset).mod(freq)).mul(0.5).add(0.5).add(offset);
    const d = p.sub(h);
    minDist.assign(min(minDist, dot(d, d)));
  });

  return float(1).sub(minDist);
}

function worleyFbm(p, freq) {
  const freq2 = freq.mul(2);
  const freq4 = freq.mul(4);
  return worleyNoise(p.mul(freq), freq)
    .mul(0.625)
    .add(worleyNoise(p.mul(freq2), freq2).mul(0.25))
    .add(worleyNoise(p.mul(freq4), freq4).mul(0.125));
}

// -- TextureEnvelope: per-(x,z) min/max cloud height --------------------
// stratus/cumulus/cumulonimbus type-blend and the alpha channel are baked
// by the reference too but never read by getDimensionalProfile — dropped.
const ENVELOPE_MIN_HEIGHT = 0.25;
const ENVELOPE_SCALE = 2;
// hash(2.0) from TextureEnvelopeMaterial's own 1D hash (fract(sin(n)*43758.5453)),
// a fixed seed offset — precomputed once in JS rather than re-derived on GPU.
const ENVELOPE_SEED = (() => {
  const v = Math.sin(2.0) * 43758.5453;
  return ((v % 1) + 1) % 1;
})();

function envelopeMaxHeight(uv) {
  const scaledUv = uv.add(ENVELOPE_SEED * 1000).mul(ENVELOPE_SCALE);
  const perlinA = perlinNoise(
    vec3(scaledUv.x, scaledUv.y, 0),
    float(ENVELOPE_SCALE)
  );
  return remap(perlinA, float(-1), float(1), float(0), float(1));
}

function getDimensionalProfile(p) {
  const maxHeight = envelopeMaxHeight(p.xz);
  const minHeight = float(ENVELOPE_MIN_HEIGHT);

  const clampedHeight = p.y.mul(step(minHeight, p.y)).mul(step(p.y, maxHeight));
  let height = remap(clampedHeight, minHeight, maxHeight, float(0), float(1));
  height = height.sub(0.5).abs().mul(2);
  height = float(1).sub(height);

  const edgeGradient = p.xz.sub(vec2(0.5)).length().mul(2).saturate();
  return height.mul(float(1).sub(edgeGradient));
}

// Shared cloud density field. Both CloudVolume's raymarch and VoxelCutout's
// compute kernel call this with the SAME `field` uniforms (see
// hooks/useCloudField.js), so the voxelized section reads as excised from
// the cloud itself, not a lookalike volume.
const cloudDensity = Fn(({ worldPos, field }) => {
  const p = worldPos
    .sub(field.center)
    .add(field.halfSize)
    .div(field.halfSize.mul(2));

  const coord = p.mul(field.tileScale).toVar();
  coord.x.assign(coord.x.add(time.mul(field.scrollSpeed)));
  coord.assign(coord.mod(1));

  const seedOffset = hash33(vec3(field.seed)).mul(100);
  const bakePos = coord.add(seedOffset);

  const worleyFbmA = worleyFbm(bakePos, field.noiseFreq);
  const perlinFbmVal = perlinFbm(bakePos, field.noiseFreq, field.perlinOctaves);
  const perlinWorley = remap(
    perlinFbmVal,
    float(0),
    float(1),
    worleyFbmA,
    float(1)
  );

  const dimensionalProfile = getDimensionalProfile(p);
  return perlinWorley.sub(float(1).sub(dimensionalProfile)).saturate();
});

export default cloudDensity;
