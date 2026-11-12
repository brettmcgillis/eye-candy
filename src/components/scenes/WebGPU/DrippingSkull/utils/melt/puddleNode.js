import {
  positionLocal,
  texture,
  transformNormalToView,
  uniform,
  varying,
  wgsl,
  wgslFn,
} from 'three/tsl';
import { DataTexture, FloatType, RGBAFormat } from 'three/webgpu';

// eslint-disable-next-line import/no-unresolved
import source from './puddle.wgsl?raw';

const surface = wgslFn(
  `
fn skullPuddle(p: vec3f, tex: texture_2d<f32>, ripples: texture_2d<f32>, rect: vec4f, texel: vec2f, floorY: f32, clock: f32, steep: f32) -> mat3x3f {
  let h = meltPuddleH(tex, p.xz, rect, texel);
  let ripple = meltRipple(p.xz, clock, h, ripples);
  let e = texel * rect.zw;
  let hx = meltPuddleH(tex, p.xz + vec2f(e.x, 0.0), rect, texel) - meltPuddleH(tex, p.xz - vec2f(e.x, 0.0), rect, texel);
  let hz = meltPuddleH(tex, p.xz + vec2f(0.0, e.y), rect, texel) - meltPuddleH(tex, p.xz - vec2f(0.0, e.y), rect, texel);
  let n = normalize(vec3f(-steep * hx / (2.0 * e.x) - ripple.y, 1.0, -steep * hz / (2.0 * e.y) - ripple.z));
  return mat3x3f(vec3f(p.x, floorY + h + ripple.x, p.z), n, vec3f(0.0));
}`,
  [wgsl(source)]
);

export default function createPuddleNodes(puddle) {
  const u = puddle.uniforms;
  const heightTexture = texture(u.puddleNow.value);
  const clock = uniform(0);
  const data = new Float32Array(32);
  const ripples = new DataTexture(data, 8, 1, RGBAFormat, FloatType);
  const rippleTexture = texture(ripples);
  const rect = uniform(u.puddleRect.value);
  const texel = uniform(u.puddleTexel.value);
  const floor = uniform(u.floorY.value);
  const evaluate = (p, steep) =>
    surface(p, heightTexture, rippleTexture, rect, texel, floor, clock, steep);
  return {
    position: evaluate(positionLocal, 1).element(0),
    normal: transformNormalToView(
      evaluate(varying(positionLocal), 2).element(1)
    ),
    sync() {
      heightTexture.value = u.puddleNow.value;
      clock.value = u.puddleTime.value;
      u.puddleRipples.value.forEach((r, i) => r.toArray(data, i * 4));
      ripples.needsUpdate = true;
    },
    dispose() {
      ripples.dispose();
    },
  };
}
