import { positionLocal, wgslFn } from 'three/tsl';
import {
  BackSide,
  Mesh,
  MeshBasicNodeMaterial,
  PMREMGenerator,
  Scene,
  SphereGeometry,
} from 'three/webgpu';

const studio = wgslFn(`
fn skullStudio(p: vec3f, dark: f32, lacquer: f32) -> vec3f {
  let d = normalize(p);
  let surround = mix(1.0, 0.14, lacquer);
  let floorL = mix(0.6, 0.025, dark) * surround;
  let horizonL = mix(mix(0.5, 0.35, lacquer), mix(0.022, 0.18, lacquer), dark);
  let wallL = mix(0.4, 0.02, dark) * surround; let ceilingL = mix(0.06, 0.004, dark) * surround;
  var L = mix(horizonL, mix(wallL, ceilingL, smoothstep(0.3, 0.95, d.y)), smoothstep(0.0, 0.3, d.y));
  if (d.y < 0.0) { L = mix(horizonL, floorL, smoothstep(0.0, 0.3, -d.y)); }
  let flags = max(skullPanel(d, normalize(vec3f(1.0, 0.2, -0.15)), vec2f(0.45, 0.6), 0.0), skullPanel(d, normalize(vec3f(-1.0, 0.2, -0.35)), vec2f(0.45, 0.6), 0.0));
  L = mix(L, mix(0.015, 0.0, dark), clamp(flags, 0.0, 1.0));
  L += mix(20.0, 28.0, dark) * skullPanel(d, normalize(vec3f(-0.5, 0.9, 0.55)), vec2f(0.43, 0.54), 0.15);
  L += mix(3.0, 12.0, dark) * skullPanel(d, normalize(vec3f(0.5, 0.3, -1.0)), vec2f(0.12, 0.7), 0.1);
  L += dark * 2.5 * (skullPanel(d, normalize(vec3f(1.0, 0.15, 0.35)), vec2f(0.14, 1.1), 0.1) + skullPanel(d, normalize(vec3f(-1.0, 0.15, 0.25)), vec2f(0.14, 1.1), 0.1));
  L += lacquer * 6.0 * skullPanel(d, normalize(vec3f(0.65, 0.55, 1.0)), vec2f(0.12), 0.1);
  L += lacquer * 1.2 * skullPanel(d, normalize(vec3f(-0.1, -0.85, 1.0)), vec2f(0.22, 0.1), 0.1);
  L += lacquer * 4.0 * skullPanel(d, normalize(vec3f(1.0, 0.05, 0.45)), vec2f(0.1, 0.3), 0.1);
  return vec3f(1.0, 0.956, 0.896) * L;
}
fn skullPanel(d: vec3f, c: vec3f, size: vec2f, hot: f32) -> f32 {
  let k = dot(d, c);
  if (k <= 0.0) { return 0.0; }
  let t = normalize(cross(vec3f(0.0, 1.0, 0.0), c)); let b = cross(c, t);
  let uv = vec2f(dot(d, t), dot(d, b)) / (k * size);
  let r = pow(pow(abs(uv.x), 4.0) + pow(abs(uv.y), 4.0), 0.25);
  return (1.0 + hot - 2.0 * hot * r * r) * (1.0 - smoothstep(0.8, 1.0, r));
}`);

export default function createReflections(renderer, dark, lacquer) {
  const scene = new Scene();
  const material = new MeshBasicNodeMaterial({ side: BackSide });
  material.colorNode = studio(positionLocal, dark ? 1 : 0, lacquer ? 1 : 0);
  const mesh = new Mesh(new SphereGeometry(10, 64, 32), material);
  scene.add(mesh);
  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(scene, 0, 0.1, 100, { size: 256 });
  generator.dispose();
  mesh.geometry.dispose();
  material.dispose();
  return target;
}
