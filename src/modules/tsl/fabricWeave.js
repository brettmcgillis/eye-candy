import {
  Fn,
  abs,
  cos,
  float,
  floor,
  fract,
  fwidth,
  length,
  max,
  min,
  mix,
  mx_fractal_noise_float as mxFractalNoise,
  normalize,
  positionView,
  sign,
  sin,
  smoothstep,
  uv as uvAttribute,
  vec2,
} from 'three/tsl';

const { PI } = Math;

// Mean of max(warp, weft) over a full weave period, measured numerically.
// Occlusion and roughness are centred on it so turning the weave up textures
// the panel without also dimming it — otherwise every preset's flag colour
// would need retuning to compensate.
const WEAVE_MEAN = 0.5451;

// three's perturbNormalArb, parameterised on the base normal rather than
// reading normalView. A material that sets normalNode never reaches the
// built-in normalMap/bumpMap path, so the composition has to be explicit.
const perturbNormal = Fn(([surfPos, surfNorm, dHdx, dHdy]) => {
  const sigmaX = surfPos.dFdx();
  const sigmaY = surfPos.dFdy();
  const r1 = sigmaY.cross(surfNorm);
  const r2 = surfNorm.cross(sigmaX);
  const det = sigmaX.dot(r1);
  const grad = sign(det).mul(dHdx.mul(r1).add(dHdy.mul(r2)));
  return normalize(abs(det).mul(surfNorm).sub(grad));
});

// Cheap per-thread hash so the weave is not machine-perfect.
function threadHash(n) {
  return fract(sin(n.mul(12.9898)).mul(43758.5453));
}

// Plain weave: warp threads run along V, weft along U, and which of the two
// sits on top flips with the parity of the cell. Driving both from one parity
// term is what makes each thread read as continuous — rising over its
// neighbour, dipping under the next — instead of a checkerboard of tiles.
function weaveHeight(p, { threadsU, threadsV, slub }) {
  const t = vec2(p.x.mul(threadsU), p.y.mul(threadsV));
  const cell = floor(t);
  const f = t.sub(cell);

  const parity = cos(t.x.add(t.y).mul(PI)).mul(0.5).add(0.5);
  const warpGain = threadHash(cell.x)
    .mul(slub)
    .add(float(1).sub(slub.mul(0.5)));
  const weftGain = threadHash(cell.y.add(7.3))
    .mul(slub)
    .add(float(1).sub(slub.mul(0.5)));

  const warp = sin(f.x.mul(PI)).mul(parity).mul(warpGain);
  const weft = sin(f.y.mul(PI)).mul(float(1).sub(parity)).mul(weftGain);

  return max(warp, weft);
}

// Distance to the nearest edge in world-proportional units, so a hem on a
// non-square panel is the same width all the way round.
function edgeDistance(p, aspectU, aspectV) {
  const du = min(p.x, p.x.oneMinus()).mul(aspectU);
  const dv = min(p.y, p.y.oneMinus()).mul(aspectV);
  return min(du, dv);
}

/**
 * Procedural woven-fabric surface detail for a cloth panel.
 *
 * Returns nodes to compose onto a material rather than a finished material,
 * because the caller already owns colorNode/roughnessNode/normalNode.
 *
 * Every parameter is expected to be a uniform node so the look stays live
 * without rebuilding the shader.
 */
export default function fabricWeave({
  uvNode = uvAttribute(),
  amount,
  threadsU,
  threadsV,
  depth,
  slub,
  aspectU = float(1),
  aspectV = float(1),
  panelWidth = float(1),
  weaveShade,
  weaveRoughness,
  hemWidth,
  hemDepth,
  stitchPitch,
  wearScale,
  wearAmount,
}) {
  const cfg = { threadsU, threadsV, slub };

  // A thread narrower than a pixel turns into shimmer, so dissolve the weave
  // as it approaches that limit and let the hem and wear carry on alone.
  const threadUV = vec2(uvNode.x.mul(threadsU), uvNode.y.mul(threadsV));
  const footprint = length(fwidth(threadUV));
  const resolvable = smoothstep(0.35, 1.1, footprint).oneMinus();

  const hemEdge = edgeDistance(uvNode, aspectU, aspectV);
  const hemSoft = hemWidth.mul(0.12).add(0.0005);
  const hemBand = smoothstep(
    hemWidth.sub(hemSoft),
    hemWidth.add(hemSoft),
    hemEdge
  ).oneMinus();

  // Stitch line set in from the fold, dashed along whichever edge is nearest.
  const alongU = min(uvNode.y, uvNode.y.oneMinus()).lessThan(
    min(uvNode.x, uvNode.x.oneMinus())
  );
  const run = alongU.select(uvNode.x, uvNode.y);
  const stitchOffset = abs(hemEdge.sub(hemWidth.mul(0.55)));
  const stitchCore = smoothstep(
    hemWidth.mul(0.06),
    hemWidth.mul(0.14),
    stitchOffset
  ).oneMinus();
  const dash = smoothstep(0.42, 0.5, fract(run.mul(stitchPitch)));
  const stitch = stitchCore.mul(dash).mul(hemBand);

  const wear = mxFractalNoise(uvNode.mul(wearScale), 3, 2, 0.5)
    .mul(0.5)
    .add(0.5)
    .clamp(0, 1);

  // Two independent reliefs, both in world units. A thread's rise scales with
  // its own pitch, so `depth` stays meaningful at any thread count; a hemmed
  // fold is a couple of millimetres of stacked fabric whatever the weave is
  // doing, so tying it to pitch would make it vanish on a fine cloth.
  const weaveRelief = depth.mul(panelWidth).div(threadsU.max(1.0));
  const foldRelief = hemDepth.mul(panelWidth).mul(0.001);

  const height = (p) => {
    const woven = weaveHeight(p, cfg).mul(resolvable).mul(weaveRelief);
    const edge = edgeDistance(p, aspectU, aspectV);
    const fold = smoothstep(
      hemWidth.sub(hemSoft),
      hemWidth.add(hemSoft),
      edge
    ).oneMinus();
    const stitchOff = abs(edge.sub(hemWidth.mul(0.55)));
    const stitchAt = smoothstep(
      hemWidth.mul(0.06),
      hemWidth.mul(0.14),
      stitchOff
    ).oneMinus();
    const runAt = alongU.select(p.x, p.y);
    const dashAt = smoothstep(0.42, 0.5, fract(runAt.mul(stitchPitch)));
    return woven
      .add(fold.mul(foldRelief))
      .add(stitchAt.mul(dashAt).mul(fold).mul(foldRelief.mul(0.6)));
  };

  const h = height(uvNode);
  const dHdx = height(uvNode.add(uvNode.dFdx())).sub(h);
  const dHdy = height(uvNode.add(uvNode.dFdy())).sub(h);

  // The derivative form wants world-unit height change per pixel, which the
  // reliefs above already supply.
  const scaledDx = dHdx.mul(amount);
  const scaledDy = dHdy.mul(amount);

  // Shading fades toward the weave's mean, not toward zero height: fading the
  // height instead would drive occlusion to its darkest value exactly when the
  // weave stops being visible, dimming the panel as it recedes.
  const weave = mix(float(WEAVE_MEAN), weaveHeight(uvNode, cfg), resolvable);

  // Valleys between threads catch less light than the crowns, and weathering
  // is patchy in both directions rather than uniformly dirty. Both are
  // expressed as a signed swing about the mean so the panel keeps its
  // brightness however far the weave is pushed.
  const swing = weave.sub(WEAVE_MEAN).div(WEAVE_MEAN);
  const weathering = wear.sub(0.5).mul(wearAmount).mul(0.5);
  const shade = swing
    .mul(weaveShade)
    .add(1)
    .add(weathering)
    .sub(stitch.mul(0.2))
    .clamp(0, 1.6);
  const shadeNode = mix(float(1), shade, amount);

  const roughnessDelta = swing
    .negate()
    .mul(weaveRoughness)
    .add(wear.sub(0.5).mul(wearAmount).mul(0.25))
    .mul(amount);

  return {
    normalNode: (baseNormal) =>
      perturbNormal(positionView, baseNormal, scaledDx, scaledDy),
    shadeNode,
    roughnessDelta,
    heightNode: h,
  };
}
