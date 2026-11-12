// The Reversal knot's width over its height in reversal-inner.png.
const MASK_ASPECT = (294 / 215).toFixed(4);

// Ghosts along the line from the light through the frame's centre, as
// [distance along it (1 is the centre, 2 the mirror point), size (frame
// heights), kind (0 knot, 1 soft knot, 2 knot outline), blur, tint].
const GHOSTS = [
  [0.45, 0.035, 1, 1.0, [1.0, 0.8, 0.5, 0.25]],
  [0.8, 0.08, 0, 0.5, [0.4, 0.9, 0.8, 0.18]],
  [1.15, 0.025, 1, 1.0, [0.6, 1.0, 0.5, 0.3]],
  [1.45, 0.06, 2, 1.0, [0.7, 0.5, 1.0, 0.22]],
  [1.8, 0.13, 1, 3.0, [1.0, 0.6, 0.35, 0.08]],
  [2.3, 0.05, 0, 0.5, [0.5, 0.7, 1.0, 0.2]],
];

const f = (v) => Number(v).toFixed(4);
const GHOST_CALLS = GHOSTS.map(
  ([k, size, kind, blur, [r, g, b, a]]) =>
    `  col += flareGhost(uv, aspect, sunUV + axis * ${f(k)}, ${f(size)} * look.y, ${f(kind)}, ${f(blur)}, vec3f(${f(r * a)}, ${f(g * a)}, ${f(b * a)}), look.z, maskT, maskS);`
).join('\n');

// A lens flare whose aperture is the Reversal's inner knot: ghosts of the
// knot, a soft glow of it and its outline, with a little colour fringing,
// on the line from the sun (or, faintly, the moon) through the centre. It
// fades as the light is covered (read from the frame where the light sits)
// or leaves the frame. look: intensity, size, chroma, strength; `bright` is
// how bright the uncovered light reads in the frame.
const FLARE_WGSL = /* wgsl */ `
fn reversalFlare(uv: vec2f, aspect: f32, sunUV: vec2f, look: vec4f, tint: vec3f, bright: f32,
                 maskT: texture_2d<f32>, maskS: sampler, sceneT: texture_2d<f32>, sceneS: sampler) -> vec3f {
  if (look.w <= 0.0 || look.x <= 0.0) { return vec3f(0.0); }
  if (any(sunUV < vec2f(-0.02)) || any(sunUV > vec2f(1.02))) { return vec3f(0.0); }
  var lum = 0.0;
  for (var k = 0; k < 5; k++) {
    var o = vec2f(0.0);
    if (k > 0) { o = vec2f(cos(f32(k) * 1.5708), sin(f32(k) * 1.5708)) * 0.006 * vec2f(1.0 / aspect, 1.0); }
    let c = textureSampleLevel(sceneT, sceneS, clamp(sunUV + o, vec2f(0.0), vec2f(1.0)), 0.0).rgb;
    lum += dot(c, vec3f(0.2126, 0.7152, 0.0722));
  }
  let vis = smoothstep(0.15, 0.6, lum / 5.0 / bright)
          * (1.0 - smoothstep(0.42, 0.62, max(abs(sunUV.x - 0.5), abs(sunUV.y - 0.5))));
  if (vis <= 0.0) { return vec3f(0.0); }
  let axis = vec2f(0.5) - sunUV;
  var col = vec3f(0.0);
${GHOST_CALLS}
  return col * tint * look.x * look.w * vis;
}

fn flareGhost(uv: vec2f, aspect: f32, pos: vec2f, size: f32, kind: f32, blur: f32, tint: vec3f,
              chroma: f32, maskT: texture_2d<f32>, maskS: sampler) -> vec3f {
  let d = (uv - pos) * vec2f(aspect, 1.0) / size;
  if (dot(d, d) > 6.0) { return vec3f(0.0); }
  return tint * vec3f(
    flareMask(d * (1.0 + chroma), kind, blur, maskT, maskS),
    flareMask(d, kind, blur, maskT, maskS),
    flareMask(d * (1.0 - chroma), kind, blur, maskT, maskS)
  );
}

// Alpha is the Reversal's inner knot, the flare's only cookie: as is, as a
// glow (blurred a few mips), or as just its edges.
fn flareMask(d: vec2f, kind: f32, blur: f32, maskT: texture_2d<f32>, maskS: sampler) -> f32 {
  let st = vec2f(d.x / ${MASK_ASPECT}, -d.y) * 0.5 + 0.5;
  if (any(st < vec2f(0.0)) || any(st > vec2f(1.0))) { return 0.0; }
  let knot = textureSampleLevel(maskT, maskS, st, blur).a;
  if (kind < 0.5) { return knot; }
  if (kind < 1.5) { return textureSampleLevel(maskT, maskS, st, blur + 1.5).a; }
  let soft = textureSampleLevel(maskT, maskS, st, blur + 1.5).a;
  return clamp(abs(knot - soft) * 3.0, 0.0, 1.0);
}
`;

export default FLARE_WGSL;
