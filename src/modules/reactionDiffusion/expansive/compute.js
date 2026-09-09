import {
  Fn,
  float,
  instanceIndex,
  int,
  ivec2,
  mix,
  select,
  smoothstep,
  textureStore,
  vec2,
  vec4,
} from 'three/tsl';

const BLUR_WEIGHTS = [0.05, 0.09, 0.12, 0.15, 0.16, 0.15, 0.12, 0.09, 0.05];
const BLUR_NORMALIZE = 0.98;
const TAU = Math.PI * 2;

function clampCoord(coord, width, height) {
  return ivec2(coord.x.clamp(0, width - 1), coord.y.clamp(0, height - 1));
}

function gridCoord(width) {
  const x = instanceIndex.mod(width);
  const y = instanceIndex.div(width);
  return { coord: ivec2(int(x), int(y)), x, y };
}

// Classic sin-fract hash, fed normalised coordinates so the sin() argument
// stays small enough to scramble cleanly. `salt` shifts it per frame and per
// draw, so the three noise values a react step needs are independent.
function rand(uvNode, salt) {
  return uvNode.x
    .mul(127.1)
    .add(uvNode.y.mul(311.7))
    .add(salt)
    .sin()
    .mul(43758.5453123)
    .fract();
}

// A smooth, low-frequency spatial ramp for the colour channel to relax toward.
// Pure advection homogenises — every parcel eventually carries the same value
// and the palette collapses to one colour — so the colour is pulled gently
// back toward this while the flow keeps distorting it.
function paletteSource(uvNode) {
  return uvNode.x
    .mul(TAU * 1.5)
    .sin()
    .add(uvNode.y.mul(TAU * 1.1).sin())
    .mul(0.25)
    .add(0.5);
}

// `.load()` is texel-exact with no filtering, so bilinear interpolation is
// done by hand. The reference shader's advection offsets are only ever a
// texel or two, so sampling them at whole-texel precision quantises the flow
// away to nothing — the field then just diffuses to equilibrium and sits
// there instead of expanding.
//
// Returns both channels: .x is the reaction field, .y the colour coordinate
// riding along with it. Same four fetches either way.
function bilinearLoad(readTex, pos, width, height) {
  const base = pos.floor();
  const frac = pos.sub(base);
  const x0 = int(base.x);
  const y0 = int(base.y);
  const x1 = x0.add(1);
  const y1 = y0.add(1);

  const c00 = readTex.load(clampCoord(ivec2(x0, y0), width, height)).rg;
  const c10 = readTex.load(clampCoord(ivec2(x1, y0), width, height)).rg;
  const c01 = readTex.load(clampCoord(ivec2(x0, y1), width, height)).rg;
  const c11 = readTex.load(clampCoord(ivec2(x1, y1), width, height)).rg;

  return mix(mix(c00, c10, frac.x), mix(c01, c11, frac.x), frac.y);
}

// Same 9-tap separable kernel as the reference shader (Buffer B / Buffer C),
// run over both channels at once. Neighbours are clamped rather than wrapped:
// that clamp is the whole fix for the reference's tiling, which comes from its
// `fract(uv)` sampling.
function blurAxis(readTex, coord, width, height, spread, axis) {
  let sum = vec2(0, 0);
  for (let i = -4; i <= 4; i += 1) {
    const step = axis === 'x' ? ivec2(i, 0) : ivec2(0, i);
    const sampleCoord = clampCoord(coord.add(step.mul(spread)), width, height);
    sum = sum.add(readTex.load(sampleCoord).rg.mul(BLUR_WEIGHTS[i + 4]));
  }
  return sum.div(BLUR_NORMALIZE);
}

// Reaction-diffusion step (reference Buffer A). The raw field is advected
// along the blurred field's own gradient — which points uphill, so a texel at
// the edge of a blob samples from inside it and the pattern grows outward.
// That advection is the "expansive" half; the subtracted (blur - raw) term is
// anti-diffusion, sharpening the front the blur keeps softening.
//
// The colour coordinate rides the exact same advection but takes none of the
// reaction, so colour is carried bodily through the flow — it smears and folds
// along the pattern rather than being a lookup recomputed from height.
export function createReactPass({
  gradientOffset,
  height,
  rawRead,
  rawWrite,
  blurredRead,
  uniforms,
  width,
}) {
  return Fn(() => {
    const { coord, x, y } = gridCoord(width);
    const pos = vec2(x.toFloat(), y.toFloat());
    const uvNode = pos.div(width);
    const offsetX = ivec2(gradientOffset, 0);
    const offsetY = ivec2(0, gradientOffset);

    const dx = blurredRead
      .load(clampCoord(coord.add(offsetX), width, height))
      .r.sub(blurredRead.load(clampCoord(coord.sub(offsetX), width, height)).r)
      .mul(0.5);
    const dy = blurredRead
      .load(clampCoord(coord.add(offsetY), width, height))
      .r.sub(blurredRead.load(clampCoord(coord.sub(offsetY), width, height)).r)
      .mul(0.5);

    const drift = vec2(dx, dy).mul(uniforms.expansionStrength);

    // Invisible wall at the bed's rim — the circle inscribed in the square
    // domain, which is exactly the disc the grains occupy.
    //
    // This advection is a *pull*: a texel takes the value from `pos + drift`,
    // so material travels by `-drift` and moves outward exactly when drift
    // points inward. Cancelling the inward-pointing radial part of the drift
    // near the rim therefore stops material being carried across it, and the
    // flow turns back along the wall instead.
    //
    // Reflecting the sample position instead — the obvious reading of "bounce"
    // — is not usable: at half strength it maps the entire exterior onto the
    // wall circle, and the degenerate ring that creates is a dead zone that
    // then eats inward and kills the whole simulation, because the
    // anti-diffusion term drives anything below its neighbours further down.
    const centre = vec2(width * 0.5, height * 0.5);
    const outward = pos.sub(centre);
    const radius = outward.length().max(1e-6);
    const wall = float(width * 0.5);
    const direction = outward.div(radius);
    const proximity = smoothstep(wall.mul(0.8), wall, radius);
    const inwardPull = direction.mul(
      direction.dot(drift).min(0).mul(proximity).mul(uniforms.boundaryBounce)
    );

    const advected = pos.add(drift.sub(inwardPull));

    const noiseValue = rand(uvNode, uniforms.time);
    const jitter = vec2(
      rand(uvNode, uniforms.time.add(19.19)).sub(0.5),
      rand(uvNode, uniforms.time.add(71.7)).sub(0.5)
    );
    const jittered = advected.add(jitter);

    const rawAdvected = bilinearLoad(rawRead, advected, width, height);
    const rawJittered = bilinearLoad(rawRead, jittered, width, height);
    const blurredJittered = bilinearLoad(blurredRead, jittered, width, height);

    const newRed = rawAdvected.x
      .add(noiseValue.sub(0.5).mul(uniforms.noiseAmount))
      .sub(uniforms.decayRate)
      .sub(blurredJittered.x.sub(rawJittered.x).mul(uniforms.reactionStrength))
      .clamp(0, 1);

    const newGreen = mix(
      rawAdvected.y,
      paletteSource(uvNode),
      uniforms.paletteRefresh
    ).clamp(0, 1);

    textureStore(rawWrite, coord, vec4(newRed, newGreen, 0, 1));
  })().compute(width * height);
}

export function createBlurPass({
  axis,
  height,
  readTex,
  spread,
  width,
  writeTex,
}) {
  return Fn(() => {
    const { coord } = gridCoord(width);
    const blurred = blurAxis(readTex, coord, width, height, spread, axis);
    textureStore(writeTex, coord, vec4(blurred.x, blurred.y, 0, 1));
  })().compute(width * height);
}

// Final shaping pass: the reaction field is coherent and lively, but it lives
// in a narrow band that drifts around (measured p05..p95 of ~0.80..0.92 at one
// point, ~0.60..0.88 at another). Mapped straight to sand height that reads as
// a flat bed that never crosses a cull threshold. Subtracting a wide blur is a
// high-pass: it removes exactly that drifting DC level, so the output stays
// centred on 0.5 indefinitely and `fieldContrast` has a predictable range to
// work in. This is the job the reference shader's Image pass does with its
// fixed `field*2.0 - 1.0` stretch — done drift-free, since sand has no
// equivalent of a screen you can re-expose.
//
// The vertical half of the wide blur is folded in here rather than run as its
// own pass, so shaping costs one dispatch instead of two.
export function createShapePass({
  blurredRead,
  height,
  outputWrite,
  spread,
  uniforms,
  wideRead,
  width,
}) {
  return Fn(() => {
    const { coord } = gridCoord(width);
    const wide = blurAxis(wideRead, coord, width, height, spread, 'y');
    const current = blurredRead.load(coord);
    const shaped = current.r
      .sub(wide.x)
      .mul(uniforms.fieldContrast)
      .add(0.5)
      .clamp(0, 1);

    // A high-pass alone maps ground the pattern hasn't reached yet (all zero)
    // to a mid 0.5 — indistinguishable from the pattern's own mid-tone, which
    // would erase the whole point of the seeded growth modes. The wide blur is
    // already a local "is there anything here" measure, so gate on it: empty
    // ground stays at 0 and reads as bare floor until the pattern arrives.
    const presence = smoothstep(0, 0.25, wide.x);

    textureStore(
      outputWrite,
      coord,
      vec4(shaped.mul(presence), current.g, 0, 1)
    );
  })().compute(width * height);
}

// Writes noise inside a circle (in normalised [0,1] domain space) and zero
// everywhere else, clearing whatever was there. A huge `seedRadius` fills the
// whole domain (always-on, closest to the reference); a small one seeds a
// single patch the react/blur loop then grows outward from.
//
// This is the destructive one — it's for starting a run, not for adding to a
// running one. See createInjectPass.
export function createSeedPass({
  blurredWrite,
  height,
  rawWrite,
  uniforms,
  width,
}) {
  return Fn(() => {
    const { coord, x, y } = gridCoord(width);
    const fx = x.toFloat().div(width);
    const fy = y.toFloat().div(height);
    const uvNode = vec2(fx, fy);
    const offsetX = fx.sub(uniforms.seedCenterX);
    const offsetY = fy.sub(uniforms.seedCenterY);
    const dist = offsetX.mul(offsetX).add(offsetY.mul(offsetY)).sqrt();
    const inSeed = dist.lessThan(uniforms.seedRadius);
    const noiseValue = rand(uvNode, uniforms.seedSalt).mul(
      select(inSeed, float(1), float(0))
    );
    const value = vec4(noiseValue, paletteSource(uvNode), 0, 1);

    textureStore(rawWrite, coord, value);
    textureStore(blurredWrite, coord, value);
  })().compute(width * height);
}

// Drops a soft-edged blob of fresh noise into the *running* field, leaving
// everything outside it untouched. Clearing the whole domain and re-seeding
// (what the old cycle did) flattens the entire simulation for a second or two
// and reads as a hard reset; blending a blob in instead keeps the established
// pattern alive while the new seed grows into it.
//
// The blob also carries its own colour coordinate, so each drop blooms as a
// distinct hue that the flow then smears through everything already there.
export function createInjectPass({
  blurredRead,
  blurredWrite,
  height,
  rawRead,
  rawWrite,
  uniforms,
  width,
}) {
  return Fn(() => {
    const { coord, x, y } = gridCoord(width);
    const fx = x.toFloat().div(width);
    const fy = y.toFloat().div(height);
    const uvNode = vec2(fx, fy);
    const dist = vec2(
      fx.sub(uniforms.seedCenterX),
      fy.sub(uniforms.seedCenterY)
    ).length();

    // Feathered to nothing at the rim so the drop has no visible edge against
    // the pattern it lands in, and scaled by `injectStrength` so the caller can
    // spread one drop over many frames. Applying it at full strength in a
    // single frame is what made a drop snap straight to its final height and
    // colour instead of welling up.
    const falloff = smoothstep(
      uniforms.seedRadius.mul(0.35),
      uniforms.seedRadius,
      dist
    )
      .oneMinus()
      .mul(uniforms.injectStrength);
    const noiseValue = rand(uvNode, uniforms.seedSalt);
    const dropColor = uniforms.seedSalt.mul(0.618).fract();

    const rawPrev = rawRead.load(coord);
    const blurredPrev = blurredRead.load(coord);

    textureStore(
      rawWrite,
      coord,
      vec4(
        mix(rawPrev.r, noiseValue, falloff),
        mix(rawPrev.g, dropColor, falloff),
        0,
        1
      )
    );
    textureStore(
      blurredWrite,
      coord,
      vec4(
        mix(blurredPrev.r, noiseValue, falloff),
        mix(blurredPrev.g, dropColor, falloff),
        0,
        1
      )
    );
  })().compute(width * height);
}
