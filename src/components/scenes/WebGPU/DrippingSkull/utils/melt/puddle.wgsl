fn meltBilinear(tex: texture_2d<f32>, uv: vec2f) -> f32 {
  let dims = vec2i(textureDimensions(tex));
  let p = uv * vec2f(dims) - 0.5; let i = vec2i(floor(p)); let f = fract(p);
  let a = textureLoad(tex, clamp(i, vec2i(0), dims - 1), 0).r;
  let b = textureLoad(tex, clamp(i + vec2i(1, 0), vec2i(0), dims - 1), 0).r;
  let c = textureLoad(tex, clamp(i + vec2i(0, 1), vec2i(0), dims - 1), 0).r;
  let d = textureLoad(tex, clamp(i + vec2i(1, 1), vec2i(0), dims - 1), 0).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
fn meltPuddleH(tex: texture_2d<f32>, xz: vec2f, rect: vec4f, texel: vec2f) -> f32 {
  let st = (xz - rect.xy) / rect.zw / texel - 0.5;
  let i = floor(st); let f = st - i; let g = 1.0 - f;
  let w0 = g * g * g / 6.0; let w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0;
  let w2 = (4.0 - 6.0 * g * g + 3.0 * g * g * g) / 6.0; let w3 = f * f * f / 6.0;
  let s0 = w0 + w1; let s1 = w2 + w3;
  let c0 = (i - 0.5 + w1 / s0) * texel; let c1 = (i + 1.5 + w3 / s1) * texel;
  let h = s0.y * (s0.x * meltBilinear(tex, c0) + s1.x * meltBilinear(tex, vec2f(c1.x, c0.y)))
    + s1.y * (s0.x * meltBilinear(tex, vec2f(c0.x, c1.y)) + s1.x * meltBilinear(tex, c1));
  if (h <= 0.0) { return h; }
  return 0.07 * pow(min(h / 0.07, 1.0), 0.6) + max(h - 0.07, 0.0);
}
fn meltRipple(xz: vec2f, clock: f32, h: f32, ripples: texture_2d<f32>) -> vec3f {
  var sum = vec3f(0.0);
  for (var i = 0; i < 8; i++) {
    let r = textureLoad(ripples, vec2i(i, 0), 0); let age = clock - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 1.0) { continue; }
    let d = xz - r.xy; let dist = length(d) + 1e-5; let x = (dist - 0.4 * age) / 0.035;
    let g = r.w * exp(-x * x - 3.0 * age) / (1.0 + 5.0 * age) * smoothstep(1.2, 2.2, 0.1 * age / r.w);
    sum += vec3f(g, (-2.0 * x * g / 0.035) * d / dist);
  }
  return sum * smoothstep(0.035, 0.0595, h);
}
