import {
  instanceIndex,
  normalLocal,
  positionLocal,
  texture,
  transformNormalToView,
  wgslFn,
} from 'three/tsl';

const dropSurface = wgslFn(`
fn skullDrop(p: vec3f, n: vec3f, drops: texture_2d<f32>, index: u32) -> mat3x3f {
  let a = textureLoad(drops, vec2i(0, i32(index)), 0);
  let b = textureLoad(drops, vec2i(1, i32(index)), 0);
  let lower = textureLoad(drops, vec2i(2, i32(index)), 0).x;
  let speed = length(b.xyz);
  var axis = vec3f(0.0, 1.0, 0.0);
  if (speed > 1e-4) { axis = -b.xyz / speed; }
  let along = dot(p, axis);
  let stretch = select(lower, b.w, along > 0.0);
  let normal = normalize(n - axis * dot(n, axis) * (1.0 - 1.0 / stretch));
  return mat3x3f(a.xyz + (p + axis * along * (stretch - 1.0)) * a.w, normal, vec3f(0.0));
}`);

export default function createDropNodes(drops) {
  const sample = dropSurface(
    positionLocal,
    normalLocal,
    texture(drops.tex),
    instanceIndex
  );
  return {
    position: sample.element(0),
    normal: transformNormalToView(sample.element(1)),
  };
}
