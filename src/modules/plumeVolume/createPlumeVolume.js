import {
  Fn,
  interleavedGradientNoise,
  max,
  min,
  perspectiveDepthToViewZ,
  rtt,
  screenCoordinate,
  screenUV,
  texture,
  texture3D,
  uniform,
  vec2,
  vec3,
  vec4,
  wgslFn,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Each spot is three texels of a 3·count × 1 float texture: position and
// range, direction and cos(outer), colour × intensity and cos(inner).
export const SPOT_TEXELS = 3;

// Every skip and stride is a whole number of steps, so each ray keeps its
// own jitter: a skip of any other length lands neighbouring rays on the same
// depths, and the slices show as rings.
//
// Smoke and fire as a volume lit the way Nightscape lights its clouds:
// Beer-Lambert through soot, a two-lobe Henyey-Greenstein phase, a short
// march toward the key light for self-shadow, and the sky's ambient. Near a
// trail the distance is measured exactly to its nearest segments (the baked
// guide only says which, and how far to skip), and the shape is the clouds'
// recipe: two octaves of billow carved by detail erosion, carried along the
// trail. Fire is emission over the first `fire.x` of each trail. Output is
// premultiplied.
//
// With `lick.x` > 0 the flames are carved into tongues: a rising,
// upright-stretched noise (`lick.y` speed, `lick.z` scale, `lick.w` vertical
// squash) that keeps nearly all of the base and only its peaks toward the
// flame tips, so the fire licks instead of filling a smooth tube.
//
// With `spots`, that many cone lights (sirens, headlamps) also light the
// smoke, and a thin haze (`haze.x` per unit length, thinning with height
// over `haze.w`) scatters them in clear air so their beams show. The haze
// only adds light; it never dims what is behind it.
function marchWgsl(samples, spots, blend) {
  const segs = samples - 1;
  const spotArgs = spots ? ', sT: texture_2d<f32>, haze: vec4f' : '';
  const skip = spots
    ? `let skip = max(floor(min((g.x - reach) * 0.8, select(1e3, haze.y, haze.x > 0.0)) / dt), 1.0) * dt;
      col += tr * plumeSpots(sT, p) * plumeHaze(haze, p) * skip;
      t += skip;`
    : 't += max(floor((g.x - reach) * 0.8 / dt), 1.0) * dt;';
  const spotLight = spots ? 'let spot = plumeSpots(sT, p);' : '';
  const spotScatter = spots ? ' + spot * haze.z' : '';
  const spotAir = spots
    ? 'col += tr * spot * plumeHaze(haze, p) * stride;'
    : '';
  const spotFns = spots
    ? `
fn plumeHaze(haze: vec4f, p: vec3f) -> f32 {
  return haze.x * exp(-max(p.y, 0.0) / haze.w);
}
fn plumeSpots(sT: texture_2d<f32>, p: vec3f) -> vec3f {
  var c = vec3f(0.0);
  for (var i = 0; i < ${spots}; i++) {
    let a = textureLoad(sT, vec2i(i * ${SPOT_TEXELS}, 0), 0);
    let v = p - a.xyz;
    let d2 = dot(v, v);
    if (d2 > a.w * a.w) { continue; }
    let b = textureLoad(sT, vec2i(i * ${SPOT_TEXELS} + 1, 0), 0);
    let e = textureLoad(sT, vec2i(i * ${SPOT_TEXELS} + 2, 0), 0);
    let d = sqrt(d2);
    let cone = smoothstep(b.w, e.w, dot(v / max(d, 1e-4), b.xyz));
    let fall = (1.0 - smoothstep(a.w * 0.5, a.w, d)) / (d2 + 0.3);
    c += e.rgb * cone * fall;
  }
  return c;
}`
    : '';
  return /* wgsl */ `
fn plumeMarch(eye: vec3f, dir: vec3f, tStart: f32, tEnd: f32, jitter: f32, stretch: f32,
              boxMin: vec3f, boxSize: vec3f, grid: vec3f, lightDir: vec3f, time: f32,
              flow: vec4f, shape: vec4f, fire: vec4f, detail: vec4f, lick: vec4f,
              lightCol: vec3f, ambLo: vec3f, ambHi: vec3f, albedo: vec3f, glowCol: vec3f,
              hot: vec3f, mid: vec3f, cool: vec3f,
              gT: texture_3d<f32>, gS: sampler, nT: texture_3d<f32>, nS: sampler,
              pT: texture_2d<f32>${spotArgs}) -> vec4f {
  let cosT = dot(dir, lightDir);
  let ph0 = mix(plumeHg(cosT, -0.22), plumeHg(cosT, 0.80), 0.70);
  let ph1 = mix(plumeHg(cosT, -0.11), plumeHg(cosT, 0.42), 0.70);
  let ph2 = mix(plumeHg(cosT, -0.05), plumeHg(cosT, 0.20), 0.70);
  let dt = detail.z;
  let budget = i32(detail.w);
  var dense = 0;
  var col = vec3f(0.0);
  var tr = 1.0;
  var entry = 0.0;
  var t = tStart + jitter * dt;
  for (var i = 0; i < 400; i++) {
    if (dense >= budget || t > tEnd || tr < 0.02) { break; }
    let p = eye + dir * t;
    let uvw = (p - boxMin) / boxSize;
    let g = textureSampleLevel(gT, gS, uvw, 0.0);
    let reach = plumeRadius(g.y, shape) * (1.0 + flow.y) + 0.6;
    if (g.x > reach) {
      ${skip}
      continue;
    }
    dense += 1;
    let voxel = clamp(vec3i(uvw * grid), vec3i(0), vec3i(grid) - 1);
    let ids = textureLoad(gT, voxel, 0);
    let near = plumeBlend(pT, i32(round(ids.z)), i32(round(ids.w)), p);
    let R = plumeRadius(near.s, shape);
    // Flow map: the noise slides along the trail in two phases a half
    // period apart, each reset while the other carries it, so the slide stays
    // bounded and segment joints never shear the pattern apart over time.
    let phase = time * flow.x / FLOW_PERIOD;
    let fa = fract(phase);
    let fb = fract(phase + 0.5);
    let wb = abs(fa * 2.0 - 1.0);
    let da = near.along * fa * FLOW_PERIOD;
    let db = near.along * fb * FLOW_PERIOD;
    let rise = vec3f(0.0, -time * 0.02, 0.0);
    let qa = (p - da) * flow.z + rise + near.salt;
    let qb = (p - db) * flow.z + rise + near.salt + FLOW_OFFSET;
    let bil = mix(plumeBillow(nT, nS, qa), plumeBillow(nT, nS, qb), wb);
    let tube = R - near.dist;
    let sd = tube + (bil - 0.5) * flow.y * (R * 1.4 + 0.4);
    let fine = mix(textureSampleLevel(nT, nS, qa * detail.y, 0.0).g,
                   textureSampleLevel(nT, nS, qb * detail.y, 0.0).g, wb);
    let er = (1.0 - fine) * detail.x;
    var d = clamp((sd + 0.1 - er * (1.0 - clamp(sd * 0.4, 0.0, 0.7))) * 4.0 / (0.5 + R), 0.0, 1.0);
    d *= flow.w * (1.0 - smoothstep(shape.z, 1.0, near.s));
    if (lick.x > 0.0) {
      let z = near.s / fire.x;
      let lq = (p - vec3f(0.0, time * lick.y, 0.0)) * vec3f(lick.z, lick.z * lick.w, lick.z) + near.salt * 7.0;
      let tongue = textureSampleLevel(nT, nS, lq, 0.0).b;
      let th = mix(0.2, 0.68, clamp(z, 0.0, 1.0));
      let mask = smoothstep(th - 0.08, th + 0.08, tongue);
      d *= mix(1.0, mask, lick.x * (1.0 - smoothstep(1.0, 1.6, z)));
    }
    var stride = dt;
    if (d < 0.02) { stride = dt * 2.0; }
    ${spotLight}
    if (d > 0.002) {
      if (entry == 0.0) { entry = t / stretch; }
      let temp = clamp(1.0 - near.s / fire.x + (bil - 0.5) * 0.9, 0.0, 1.0) * smoothstep(-0.3, 0.6, tube / R);
      let sigma = d * shape.w * mix(1.0, 0.35, temp);
      let flowAt = vec4f(rise + near.salt, wb);
      var od = 0.0;
      od += plumeShadowTap(gT, gS, nT, nS, p + lightDir * 0.25, da, db, flowAt, boxMin, boxSize, shape, flow) * 0.3;
      od += plumeShadowTap(gT, gS, nT, nS, p + lightDir * 0.8, da, db, flowAt, boxMin, boxSize, shape, flow) * 0.7;
      od += plumeShadowTap(gT, gS, nT, nS, p + lightDir * 2.2, da, db, flowAt, boxMin, boxSize, shape, flow) * 1.8;
      let k = flow.w * shape.w * fire.w;
      let lit = ph0 * exp(-od * k) + 0.34 * ph1 * exp(-od * k * 0.4) + 0.14 * ph2 * exp(-od * k * 0.17);
      let amb = mix(ambLo, ambHi, 1.0 - clamp(tube / R, 0.0, 1.0) * 0.7);
      let glow = exp(-max(near.s - fire.x, 0.0) * 14.0) * fire.z;
      let scatter = albedo * (lightCol * lit + amb + glowCol * glow * 1.5${spotScatter});
      let ramp = mix(mix(cool, mid, smoothstep(0.0, 0.5, temp)), hot, smoothstep(0.5, 1.0, temp));
      let emission = ramp * temp * temp * temp * fire.y * d;
      let a = exp(-sigma * stride);
      col += tr * (scatter * (1.0 - a) + emission * stride);
      tr *= a;
    }
    ${spotAir}
    t += stride;
  }
  // Alpha carries where the smoke starts (world units, 1/32 steps) and its
  // coverage, as Nightscape's cloud pass packs depth with transmittance.
  // Past 98% cover the rest is soot: call it opaque, so the last couple of
  // percent never lets a sunlit glint through.
  var cover = 1.0 - tr;
  if (tr < 0.02) {
    col /= cover;
    cover = 1.0;
  }
  return vec4f(col, floor(clamp(entry, 0.0, 4000.0) * 32.0) + clamp(cover, 0.0, 1.0) * 0.999);
}

const FLOW_PERIOD: f32 = 3.0;
const BLEND: f32 = ${blend.toFixed(4)};
const FLOW_OFFSET: vec3f = vec3f(0.31, 0.57, 0.13);

struct PlumeNear { dist: f32, s: f32, along: vec3f, salt: vec3f }
${spotFns}
fn plumeBillow(nT: texture_3d<f32>, nS: sampler, q: vec3f) -> f32 {
  let q2 = vec3f(2.0 * q.x + q.z, 2.0 * q.y, 2.0 * q.z - q.x);
  return 0.64 * textureSampleLevel(nT, nS, q, 0.0).r + 0.36 * textureSampleLevel(nT, nS, q2 + 0.37, 0.0).r;
}
// The trail's direction at point i, from its neighbours, so the flow turns
// smoothly through each joint instead of in steps.
fn plumeTangent(pT: texture_2d<f32>, i: i32, plume: i32) -> vec3f {
  let lo = textureLoad(pT, vec2i(max(i - 1, 0), plume), 0).xyz;
  let hi = textureLoad(pT, vec2i(min(i + 1, ${samples - 1}), plume), 0).xyz;
  return normalize(hi - lo);
}

fn plumeSegment(pT: texture_2d<f32>, id: i32, p: vec3f) -> PlumeNear {
  let plume = id / ${segs};
  let i = id % ${segs};
  let a = textureLoad(pT, vec2i(i, plume), 0);
  let b = textureLoad(pT, vec2i(i + 1, plume), 0);
  let trail = textureLoad(pT, vec2i(${samples}, plume), 0);
  let scale = trail.x;
  let ab = b.xyz - a.xyz;
  let h = clamp(dot(p - a.xyz, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  let along = normalize(mix(plumeTangent(pT, i, plume), plumeTangent(pT, i + 1, plume), h));
  return PlumeNear(length(p - a.xyz - ab * h) / scale, mix(a.w, b.w, h), along, trail.yzw);
}
// Where two trails come near each other, both are measured and blended
// over \`blend\` (in trail widths), so the field has no seam where the nearer
// one changes. Only two are known per voxel: where a third comes within the
// band, the pair changes from voxel to voxel and the blend seams on the
// guide's grid, so many trails packed together want a narrow band.
fn plumeBlend(pT: texture_2d<f32>, first: i32, second: i32, p: vec3f) -> PlumeNear {
  let a = plumeNearest(pT, first, p);
  if (second < 0) { return a; }
  let b = plumeNearest(pT, second, p);
  let w = smoothstep(-BLEND * 4.0 / 3.0, BLEND * 4.0 / 3.0, a.dist - b.dist);
  let h = clamp(0.5 + 0.5 * (b.dist - a.dist) / BLEND, 0.0, 1.0);
  let dist = mix(b.dist, a.dist, h) - BLEND * h * (1.0 - h);
  return PlumeNear(dist, mix(a.s, b.s, w), normalize(mix(a.along, b.along, w) + vec3f(0.0, 1e-4, 0.0)),
                   mix(a.salt, b.salt, w));
}
fn plumeNearest(pT: texture_2d<f32>, id: i32, p: vec3f) -> PlumeNear {
  let first = (id / ${segs}) * ${segs};
  var best = plumeSegment(pT, id, p);
  if (id > first) {
    let n = plumeSegment(pT, id - 1, p);
    if (n.dist < best.dist) { best = n; }
  }
  if (id < first + ${segs - 1}) {
    let n = plumeSegment(pT, id + 1, p);
    if (n.dist < best.dist) { best = n; }
  }
  return best;
}
fn plumeRadius(s: f32, shape: vec4f) -> f32 {
  return mix(shape.x, shape.y, pow(clamp(s, 0.0, 1.0), 0.7));
}
fn plumeShadowTap(gT: texture_3d<f32>, gS: sampler, nT: texture_3d<f32>, nS: sampler, p: vec3f,
                  da: vec3f, db: vec3f, flowAt: vec4f, boxMin: vec3f, boxSize: vec3f, shape: vec4f, flow: vec4f) -> f32 {
  let g = textureSampleLevel(gT, gS, (p - boxMin) / boxSize, 0.0);
  let R = plumeRadius(g.y, shape);
  let bil = mix(textureSampleLevel(nT, nS, (p - da) * flow.z + flowAt.xyz, 0.0).r,
                textureSampleLevel(nT, nS, (p - db) * flow.z + flowAt.xyz + FLOW_OFFSET, 0.0).r, flowAt.w);
  let sd = R - g.x + (bil - 0.5) * flow.y * (R * 1.4 + 0.4);
  return clamp(sd * 4.0 / (0.5 + R), 0.0, 1.0) * (1.0 - smoothstep(shape.z, 1.0, g.y));
}
fn plumeHg(c: f32, g: f32) -> f32 {
  let g2 = g * g;
  return (1.0 - g2) / (12.566 * pow(1.0 + g2 - 2.0 * g * c, 1.5));
}
`;
}

const marchFns = new Map();
function marchFn(samples, spots, blend) {
  const key = `${samples}:${spots}:${blend}`;
  if (!marchFns.has(key))
    marchFns.set(key, wgslFn(marchWgsl(samples, spots, blend)));
  return marchFns.get(key);
}

// The smoke's own upscale onto the frame: a bilinear blend of the four
// nearest smoke texels, each dropped where the scene at this pixel is nearer
// than that texel's smoke starts. Thin parts of the scene in front of the
// smoke stay crisp, and thin parts behind it never punch holes through it.
const compositeFn = wgslFn(/* wgsl */ `
fn plumeComposite(sceneCol: vec3f, uv: vec2f, sceneDist: f32, smokeT: texture_2d<f32>) -> vec4f {
  let size = vec2f(textureDimensions(smokeT));
  let st = uv * size - 0.5;
  let base = floor(st);
  let f = st - base;
  var rgb = vec3f(0.0);
  var a = 0.0;
  for (var k = 0; k < 4; k++) {
    let o = vec2f(f32(k % 2), f32(k / 2));
    let w = mix(1.0 - f.x, f.x, o.x) * mix(1.0 - f.y, f.y, o.y);
    let v = textureLoad(smokeT, clamp(vec2i(base + o), vec2i(0), vec2i(size) - 1), 0);
    let dq = floor(v.a);
    let keep = select(1.0, 0.0, sceneDist < dq / 32.0 - 0.05);
    rgb += v.rgb * w * keep;
    a += (v.a - dq) / 0.999 * w * keep;
  }
  // Behind smoke the scene is held to plain daylight brightness: a specular
  // glint is many times brighter than the sky, and a few percent of it
  // through thin smoke would draw a line.
  let behind = mix(sceneCol, min(sceneCol, vec3f(1.0)), clamp(a * 2.0, 0.0, 1.0));
  return vec4f(behind * (1.0 - a) + rgb, 1.0);
}
`);

// Every uniform the march reads. The consumer writes them: the look from
// its controls, the camera and `toLocal` (world to the volume's space) each
// frame. Inside a render-to-texture pass the built-in camera nodes describe
// the pass's own quad camera, so the scene camera comes in here.
export function createPlumeUniforms() {
  return {
    albedo: uniform(new THREE.Color()),
    ambHi: uniform(new THREE.Color()),
    ambLo: uniform(new THREE.Color()),
    cameraPosition: uniform(new THREE.Vector3()),
    cameraWorld: uniform(new THREE.Matrix4()),
    cool: uniform(new THREE.Color()),
    detail: uniform(new THREE.Vector4()),
    drawSize: uniform(new THREE.Vector2(1, 1)),
    far: uniform(1000),
    fire: uniform(new THREE.Vector4()),
    flow: uniform(new THREE.Vector4()),
    glowCol: uniform(new THREE.Color()),
    haze: uniform(new THREE.Vector4(0, 0.3, 1, 4)),
    hot: uniform(new THREE.Color()),
    lick: uniform(new THREE.Vector4()),
    lightCol: uniform(new THREE.Color()),
    lightDir: uniform(new THREE.Vector3(0, 1, 0)),
    mid: uniform(new THREE.Color()),
    near: uniform(0.1),
    projectionInverse: uniform(new THREE.Matrix4()),
    shape: uniform(new THREE.Vector4()),
    time: uniform(0),
    toLocal: uniform(new THREE.Matrix4()),
  };
}

// The scene camera's per-frame uniforms, from inside a useFrame.
// Call after the camera controls have moved the camera this frame (drei's
// OrbitControls update at priority -1): a stale camera leaves the volume a
// frame behind the scene whenever the view moves.
export function updatePlumeCamera(u, camera, gl) {
  camera.updateMatrixWorld();
  gl.getDrawingBufferSize(u.drawSize.value);
  u.cameraPosition.value.setFromMatrixPosition(camera.matrixWorld);
  u.cameraWorld.value.copy(camera.matrixWorld);
  u.projectionInverse.value.copy(camera.projectionMatrixInverse);
  const { far, near } = u;
  near.value = camera.near;
  far.value = camera.far;
}

// A float texture for `count` spot lights, written with `writeSpot` and
// flagged for upload once a frame.
export function createSpotTexture(count) {
  const data = new Float32Array(Math.max(count, 1) * SPOT_TEXELS * 4);
  const tex = new THREE.DataTexture(
    data,
    Math.max(count, 1) * SPOT_TEXELS,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

// One spot, in the volume's space. `color` is linear and already multiplied
// by intensity; angles are cosines, outer < inner.
export function writeSpot(
  tex,
  i,
  { color, cosInner, cosOuter, dir, position, range }
) {
  const d = tex.image.data;
  const o = i * SPOT_TEXELS * 4;
  d.set([position.x, position.y, position.z, range], o);
  d.set([dir.x, dir.y, dir.z, cosOuter], o + 4);
  d.set([color.r, color.g, color.b, cosInner], o + 8);
}

// The scene camera's ray through this pixel, in world space, and how far
// along it the opaque scene is (depth read `spread` full-resolution texels
// either side, the farthest kept).
function sceneRay(scenePass, u, spread) {
  const ndc = vec2(
    screenUV.x.mul(2).sub(1),
    screenUV.y.oneMinus().mul(2).sub(1)
  );
  const view = u.projectionInverse.mul(vec4(ndc, 1, 1));
  const viewDir = view.xyz.div(view.w).normalize();
  const depthTex = scenePass.getTextureNode('depth');
  let depth = depthTex.sample(screenUV).r;
  if (spread) {
    const o = spread.div(u.drawSize);
    depth = max(
      max(
        depthTex.sample(screenUV.add(o)).r,
        depthTex.sample(screenUV.sub(o)).r
      ),
      max(
        depthTex.sample(screenUV.add(vec2(o.x, o.y.negate()))).r,
        depthTex.sample(screenUV.add(vec2(o.x.negate(), o.y))).r
      )
    );
  }
  return {
    dir: u.cameraWorld.mul(vec4(viewDir, 0)).xyz,
    dist: perspectiveDepthToViewZ(depth, u.near, u.far).div(viewDir.z),
  };
}

// The fire and smoke for a scene pass: marched in the volume's space
// (`toLocal`) at reduced resolution (`smoke`, an RTT node to rescale), then
// laid over the scene at full resolution (`frame`). `bounds` and `guide`
// come from plumeBounds / bakePlumeGuide, `points` from plumePointsTexture
// with the same `pathSamples`, `noise` is the tileable 3D noise. `blend` is
// how far, in trail widths, neighbouring trails melt into each other.
export default function createPlumeVolume({
  blend = 0.6,
  bounds,
  guide,
  noise,
  pathSamples,
  points,
  spotTexture = null,
  spots = 0,
  u,
}) {
  const boxMin = vec3(...bounds.min);
  const boxMax = vec3(...bounds.min.map((v, k) => v + bounds.size[k]));
  const march = marchFn(pathSamples, spots, blend);
  return (scenePass) => {
    const marched = Fn(() => {
      const ray = sceneRay(scenePass, u, vec2(0.5, 0.5));
      const eye = u.toLocal.mul(vec4(u.cameraPosition, 1)).xyz;
      const toModel = u.toLocal.mul(vec4(ray.dir, 0)).xyz;
      const stretch = toModel.length();
      const dir = toModel.div(stretch).toVar();
      // Off axis by a hair: a ray exactly in a box face's plane divides by
      // zero, and those rays form straight lines on screen.
      const slab = dir.add(vec3(1.3e-5, 1.7e-5, 1.1e-5));
      const t0 = boxMin.sub(eye).div(slab);
      const t1 = boxMax.sub(eye).div(slab);
      const lo = min(t0, t1);
      const hi = max(t0, t1);
      return march({
        eye,
        dir,
        tStart: max(max(max(lo.x, lo.y), lo.z), 0),
        tEnd: min(min(min(hi.x, hi.y), hi.z), ray.dist.mul(stretch)),
        jitter: interleavedGradientNoise(screenCoordinate),
        stretch,
        boxMin,
        boxSize: vec3(...bounds.size),
        grid: vec3(...bounds.grid),
        lightDir: u.toLocal.mul(vec4(u.lightDir, 0)).xyz.normalize(),
        time: u.time,
        flow: u.flow,
        shape: u.shape,
        fire: u.fire,
        detail: u.detail,
        lick: u.lick,
        lightCol: u.lightCol,
        ambLo: u.ambLo,
        ambHi: u.ambHi,
        albedo: u.albedo,
        glowCol: u.glowCol,
        hot: u.hot,
        mid: u.mid,
        cool: u.cool,
        gT: texture3D(guide),
        gS: texture3D(guide),
        nT: texture3D(noise),
        nS: texture3D(noise),
        pT: texture(points),
        ...(spots ? { sT: texture(spotTexture), haze: u.haze } : {}),
      });
    })();
    const smoke = rtt(marched, null, null, { type: THREE.FloatType });
    smoke.renderTarget.texture.minFilter = THREE.NearestFilter;
    smoke.renderTarget.texture.magFilter = THREE.NearestFilter;
    const frame = compositeFn({
      sceneCol: scenePass.rgb,
      uv: screenUV,
      sceneDist: sceneRay(scenePass, u, null).dist,
      smokeT: smoke,
    });
    return { frame, smoke };
  };
}
