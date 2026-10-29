import { snoiseVec3 } from 'three/addons/tsl/math/curlNoise.js';
import {
  Fn,
  If,
  Loop,
  cameraPosition,
  exp,
  float,
  floor,
  fract,
  frameId,
  fwidth,
  hue,
  instanceIndex,
  instancedArray,
  interleavedGradientNoise,
  max,
  min,
  mix,
  modelWorldMatrix,
  modelWorldMatrixInverse,
  mx_noise_vec3 as mxNoiseVec3,
  positionLocal,
  positionWorld,
  screenCoordinate,
  smoothstep,
  storageTexture,
  texture3D,
  textureStore,
  uniform,
  uvec3,
  vec3,
  vec4,
} from 'three/tsl';
import {
  BackSide,
  CustomBlending,
  HalfFloatType,
  LinearFilter,
  MeshBasicNodeMaterial,
  OneFactor,
  OneMinusSrcAlphaFactor,
  RGBAFormat,
  RepeatWrapping,
  Storage3DTexture,
} from 'three/webgpu';
import * as THREE from 'three/webgpu';

const BASE_CELLS = 32;
const PRESSURE_ITERATIONS = 6;
export const SIM_STEP = 1 / 120;

function createStorage3D(name, [x, y, z], wrap = false) {
  const texture = new Storage3DTexture(x, y, z);
  texture.name = name;
  texture.format = RGBAFormat;
  texture.type = HalfFloatType;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  if (wrap) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.wrapR = RepeatWrapping;
  }
  return texture;
}

// Blackbody-ish ramp from the example: cool red, mid orange, hot white.
const fireRamp = (u, t) => {
  const color = mix(vec3(0), u.endColor, smoothstep(0.05, 0.35, t)).toVar();
  color.assign(mix(color, u.midColor, smoothstep(0.35, 0.65, t)));
  color.assign(mix(color, u.startColor, smoothstep(0.65, 1, t)));
  return color;
};

// The box the flame lives in, the camera ray through it in box space, the
// wax test and the faded heat a march reads, shared by every look.
function flameRay(size, u) {
  const half = vec3(size[0] / 2, size[1] / 2, size[2] / 2);
  const eye = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz;
  const exit = positionLocal;
  const dir = exit.sub(eye).normalize().toVar();
  const inv = vec3(1).div(dir);
  const t0 = half.negate().sub(eye).mul(inv);
  const t1 = half.sub(eye).mul(inv);
  const tNear = max(max(min(t0.x, t1.x), min(t0.y, t1.y)), min(t0.z, t1.z));
  const start = max(tNear, 0);
  const span = max(exit.sub(eye).length().sub(start), 0);
  const stepSize = span.div(float(u.steps)).toVar();
  const jitter = fract(
    interleavedGradientNoise(screenCoordinate).add(
      float(frameId).mul(0.618033988749895)
    )
  );
  return {
    dir,
    eye,
    start,
    stepSize,
    travelled: start.add(jitter.mul(stepSize)).toVar(),
  };
}

// Where the camera ray first enters the wax, in the same `t` the march
// uses (the candle matrix is rigid). The candle is a cylinder of its widest
// body radius between the rims, less a crater pocket at each end: a ray in
// through a crater mouth meets wax only where it leaves the pocket, through
// the pool or the wall. Analytic, so wax far outside the flame's box still
// hides it — the bottom flame behind the candle's lower end, say.
const FAR = 1e6;

function cylinderSpan(o, d, radius) {
  const a = d.x.mul(d.x).add(d.z.mul(d.z)).max(1e-8);
  const b = o.x.mul(d.x).add(o.z.mul(d.z));
  const c = o.x.mul(o.x).add(o.z.mul(o.z)).sub(radius.mul(radius));
  const disc = b.mul(b).sub(a.mul(c));
  const root = disc.max(0).sqrt();
  const enter = b.negate().sub(root).div(a);
  const leave = b.negate().add(root).div(a);
  const hit = disc.greaterThan(0);
  return {
    enter: hit.select(enter, float(FAR)),
    leave: hit.select(leave, float(-FAR)),
  };
}

function slabSpan(o, d, lo, hi) {
  const dy = d.y.abs().lessThan(1e-6).select(float(1e-6), d.y);
  const a = lo.sub(o.y).div(dy);
  const b = hi.sub(o.y).div(dy);
  return { enter: min(a, b), leave: max(a, b) };
}

const both = (p, q) => ({
  enter: max(p.enter, q.enter),
  leave: min(p.leave, q.leave),
});

function waxEntry(u, eye, dir) {
  const o = u.candleMatrix.mul(vec4(eye, 1)).xyz;
  const d = u.candleMatrix.mul(vec4(dir, 0)).xyz;
  const body = both(
    cylinderSpan(o, d, u.outerR),
    slabSpan(o, d, u.rimY.negate(), u.rimY)
  );
  const pocket = cylinderSpan(o, d, u.innerR);
  const top = both(pocket, slabSpan(o, d, u.poolY, u.rimY));
  const bottom = both(
    pocket,
    slabSpan(o, d, u.rimY.negate(), u.poolY.negate())
  );
  const entry = max(body.enter, 0).toVar();
  If(entry.greaterThanEqual(top.enter).and(entry.lessThan(top.leave)), () => {
    entry.assign(top.leave);
  });
  If(
    entry.greaterThanEqual(bottom.enter).and(entry.lessThan(bottom.leave)),
    () => {
      entry.assign(bottom.leave);
    }
  );
  return entry.lessThan(body.leave).select(entry, float(FAR));
}

const uvwOfBox = (size, p) => p.div(vec3(...size)).add(0.5);

function boxFade(uvw) {
  const edge = min(uvw, vec3(1).sub(uvw));
  return smoothstep(0, 0.05, min(edge.x, edge.z))
    .mul(smoothstep(0, 0.05, uvw.y))
    .mul(smoothstep(0, 0.25, float(1).sub(uvw.y)));
}

function flameMaterialBase() {
  const material = new MeshBasicNodeMaterial();
  Object.assign(material, {
    blendDst: OneMinusSrcAlphaFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
    blendSrc: OneFactor,
    blendSrcAlpha: OneFactor,
    blending: CustomBlending,
    depthTest: false,
    depthWrite: false,
    side: BackSide,
    transparent: true,
  });
  return material;
}

// Ray-marches the dye inside the flame's box only (VolumeNodeMaterial
// marches the whole camera ray, far too coarse for a candle-sized volume)
// and stops where the wax hides it, so the wick shows through the flame's
// dark core. Output is premultiplied: emission plus soot absorption.
function createRealisticFlame({ dyeRead, size, u }) {
  const material = flameMaterialBase();
  material.fragmentNode = Fn(() => {
    const { dir, eye, stepSize, travelled } = flameRay(size, u);
    const light = vec3(0).toVar();
    const transmittance = float(1).toVar();
    const wax = waxEntry(u, eye, dir);
    Loop(u.steps, () => {
      const p = eye.add(dir.mul(travelled));
      const hidden = travelled.greaterThan(wax).select(float(1), float(0));
      const uvw = uvwOfBox(size, p);
      const dye = dyeRead.sample(uvw).level(0);
      const soot = dye.r;
      const temperature = dye.g;
      const age = dye.b;
      const fuel = dye.a;
      const fade = boxFade(uvw);

      const heat = temperature.mul(u.heatScale).clamp(0, 1);
      const luminous = smoothstep(0.03, 0.11, age).mul(
        float(1).sub(smoothstep(0.15, 0.75, fuel))
      );
      const yellow = fireRamp(u, heat)
        .mul(heat.pow(2.2))
        .mul(luminous)
        .mul(u.glow);
      const blue = u.blueColor
        .mul(u.blue)
        .mul(smoothstep(0.04, 0.6, temperature))
        .mul(float(1).sub(smoothstep(0.03, 0.1, age)))
        .mul(float(1).sub(smoothstep(0.05, 0.4, fuel)))
        .mul(6);
      const emission = yellow.add(blue).mul(u.intensity).mul(fade);
      const extinction = soot.mul(22).mul(fade);
      const shown = float(1).sub(hidden);
      light.addAssign(emission.mul(transmittance).mul(stepSize).mul(shown));
      transmittance.mulAssign(
        exp(extinction.mul(stepSize).mul(shown).negate())
      );
      travelled.addAssign(stepSize);
    });

    return vec4(hue(light, u.hue), float(1).sub(transmittance));
  })();
  return material;
}

// Cartoon: the hottest heat along each ray, quantised into `u.bands` flat
// fire colours, solid inside the outer band and edged in ink where it
// crosses it. The sim still moves underneath, so the flat flame flickers.
function createToonFlame({ dyeRead, size, u }) {
  const material = flameMaterialBase();
  material.fragmentNode = Fn(() => {
    const { dir, eye, stepSize, travelled } = flameRay(size, u);
    const hottest = float(0).toVar();
    const wax = waxEntry(u, eye, dir);
    Loop(u.steps, () => {
      const p = eye.add(dir.mul(travelled));
      const hidden = travelled.greaterThan(wax).select(float(1), float(0));
      const uvw = uvwOfBox(size, p);
      const heat = dyeRead
        .sample(uvw)
        .level(0)
        .g.mul(u.heatScale)
        .mul(boxFade(uvw))
        .mul(float(1).sub(hidden));
      hottest.assign(max(hottest, heat));
      travelled.addAssign(stepSize);
    });
    const outer = float(0.08);
    const band = hottest
      .sub(outer)
      .div(float(0.95).sub(outer))
      .clamp(0, 0.999)
      .mul(u.bands)
      .floor()
      .div(max(u.bands.sub(1), 1))
      .toVar();
    const flat = fireRamp(u, band.mul(0.5).add(0.5)).mul(
      band.mul(0.5).add(1.3)
    );
    const ink = smoothstep(
      float(0),
      fwidth(hottest).mul(2.2),
      hottest.sub(outer)
    );
    const inside = hottest.greaterThan(outer).select(float(1), float(0));
    const colour = mix(u.ink, hue(flat, u.hue), ink);
    return vec4(colour.mul(inside), inside);
  })();
  return material;
}

// Clay: the first surface where the heat crosses a threshold, refined by
// bisection, shaded as matte plasticine — normals from the field's
// gradient bent by thumb marks, an orange skin with the yellow core showing
// where it is hot just beneath. Stepped on twos with the rest of the stage.
function createClayFlame({ dyeRead, size, u }) {
  const material = flameMaterialBase();
  const level = float(0.2);
  const heatAt = (p) => {
    const uvw = uvwOfBox(size, p);
    return dyeRead.sample(uvw).level(0).g.mul(u.heatScale).mul(boxFade(uvw));
  };
  material.fragmentNode = Fn(() => {
    const { dir, eye, stepSize, travelled } = flameRay(size, u);
    const hit = float(-1).toVar();
    const wax = waxEntry(u, eye, dir);
    Loop(u.steps, () => {
      const p = eye.add(dir.mul(travelled));
      If(hit.lessThan(0), () => {
        If(travelled.greaterThan(wax), () => {
          hit.assign(-2);
        }).ElseIf(heatAt(p).greaterThan(level), () => {
          hit.assign(travelled);
        });
      });
      travelled.addAssign(stepSize);
    });
    const shown = hit.greaterThan(0);
    const lo = hit.sub(stepSize).toVar();
    const hi = hit.toVar();
    Loop(5, () => {
      const mid = lo.add(hi).mul(0.5);
      If(heatAt(eye.add(dir.mul(mid))).greaterThan(level), () => {
        hi.assign(mid);
      }).Else(() => {
        lo.assign(mid);
      });
    });
    const p = eye.add(dir.mul(hi));
    const e = 0.02;
    const gradient = vec3(
      heatAt(p.add(vec3(e, 0, 0))).sub(heatAt(p.sub(vec3(e, 0, 0)))),
      heatAt(p.add(vec3(0, e, 0))).sub(heatAt(p.sub(vec3(0, e, 0)))),
      heatAt(p.add(vec3(0, 0, e))).sub(heatAt(p.sub(vec3(0, 0, e))))
    );
    const thumb = mxNoiseVec3(p.mul(46)).mul(0.25).mul(u.prints);
    const local = gradient.negate().normalize().add(thumb).normalize();
    const normal = modelWorldMatrix.mul(vec4(local, 0)).xyz.normalize();
    const key = max(normal.dot(vec3(0.45, 0.8, 0.55).normalize()), 0);
    const facing = max(
      normal.dot(cameraPosition.sub(positionWorld).normalize()),
      0
    );
    const core = smoothstep(0.45, 0.75, heatAt(p.add(dir.mul(0.03))));
    const skin = mix(u.midColor, u.startColor, core);
    const shade = key.mul(0.45).add(0.55).add(float(1).sub(facing).mul(0.25));
    return vec4(
      hue(skin.mul(shade).mul(u.intensity.mul(0.4).add(0.85)), u.hue).mul(
        shown.select(float(1), float(0))
      ),
      shown.select(float(1), float(0))
    );
  })();
  return material;
}

function createFlameMaterial({ look, ...rest }) {
  if (look === 'cartoon') return createToonFlame(rest);
  if (look === 'clay') return createClayFlame(rest);
  return createRealisticFlame(rest);
}

// The candle flame as a small buoyant fluid: the webgpu_volume_fire
// solver (semi-Lagrangian advection, buoyancy against soot weight, thermal
// and ambient curl turbulence, Jacobi pressure projection) on a box round
// the wick, emitting heat, soot and fuel round the wick's tip instead of a
// teapot's vertices. Dye is r soot, g temperature, b age, a unburnt fuel —
// the dark core a real candle flame has above its wick.
export default function createFireSim({
  forceHeight = null,
  resolution = 1,
  size,
}) {
  // Forces scale with this height, not the box's: the example's solver
  // scales them by its box, so a taller box would burn a thinner flame.
  const force = forceHeight ?? size[1];
  // Cubic cells: the vertical count follows the box's aspect.
  const across = Math.max(8, Math.round(BASE_CELLS * resolution));
  const grid = [
    across,
    Math.max(8, Math.round((across * size[1]) / size[0])),
    Math.max(8, Math.round((across * size[2]) / size[0])),
  ];
  const [GX, GY, GZ] = grid;
  const CELLS = GX * GY * GZ;
  const TEXEL = vec3(1 / GX, 1 / GY, 1 / GZ);
  const world = new THREE.Vector3(...size);
  const uWorld = uniform(world.clone());

  const u = {
    blue: uniform(0.85),
    blueColor: uniform(new THREE.Color('#2f5bff')),
    buoyancy: uniform(3),
    candleMatrix: uniform(new THREE.Matrix4()),
    innerR: uniform(0),
    outerR: uniform(0),
    poolY: uniform(0),
    rimY: uniform(-100),
    cooling: uniform(2),
    dissipation: uniform(0.8),
    dt: uniform(SIM_STEP),
    emit: uniform(1),
    emitFuel: uniform(1),
    emitSoot: uniform(0.25),
    emitTemperature: uniform(5.5),
    endColor: uniform(new THREE.Color('#d42a05')),
    glow: uniform(40),
    heatScale: uniform(1.05),
    hue: uniform(0),
    ink: uniform(new THREE.Color('#1a1013')),
    prints: uniform(0.5),
    bands: uniform(3),
    intensity: uniform(1),
    midColor: uniform(new THREE.Color('#ff9a2e')),
    sourceA: uniform(new THREE.Vector3()),
    sourceB: uniform(new THREE.Vector3()),
    sourceRadius: uniform(0.03),
    startColor: uniform(new THREE.Color('#fff1c4')),
    steps: uniform(72, 'int'),
    time: uniform(0),
    turbFrequency: uniform(5),
    turbulence: uniform(0.5),
    turbulenceDecay: uniform(0.1),
    velDamping: uniform(0.25),
    weight: uniform(0.15),
    wind: uniform(new THREE.Vector3()),
  };

  const velA = createStorage3D('flame velocity A', grid);
  const velB = createStorage3D('flame velocity B', grid);
  const dyeA = createStorage3D('flame dye A', grid);
  const dyeB = createStorage3D('flame dye B', grid);
  const divergence = createStorage3D('flame divergence', grid);
  const pressA = createStorage3D('flame pressure A', grid);
  const pressB = createStorage3D('flame pressure B', grid);
  const curlTex = createStorage3D('flame curl noise', grid, true);

  const dyeRead = texture3D(dyeA);
  const dyeWrite = storageTexture(dyeB).toWriteOnly();
  const curlRead = texture3D(curlTex);
  const exported = instancedArray(CELLS, 'vec4').setName('flameField');

  const voxel = (id) => uvec3(id.mod(GX), id.div(GX).mod(GY), id.div(GX * GY));
  const uvwOf = (coord) =>
    vec3(coord)
      .add(0.5)
      .div(vec3(GX, GY, GZ));
  const aspect = vec3(size[0] / size[1], 1, size[2] / size[1]);

  const curlPass = Fn(() => {
    const coord = voxel(instanceIndex);
    const p = uvwOf(coord).mul(aspect);
    const freq = u.turbFrequency;
    const e = float(0.1).div(freq);
    const dx = vec3(e, 0, 0);
    const dy = vec3(0, e, 0);
    const dz = vec3(0, 0, e);
    const x0 = snoiseVec3(p.sub(dx).mul(freq));
    const x1 = snoiseVec3(p.add(dx).mul(freq));
    const y0 = snoiseVec3(p.sub(dy).mul(freq));
    const y1 = snoiseVec3(p.add(dy).mul(freq));
    const z0 = snoiseVec3(p.sub(dz).mul(freq));
    const z1 = snoiseVec3(p.add(dz).mul(freq));
    const curl = vec3(
      y1.z.sub(y0.z).sub(z1.y).add(z0.y),
      z1.x.sub(z0.x).sub(x1.z).add(x0.z),
      x1.y.sub(x0.y).sub(y1.x).add(y0.x)
    ).mul(5);
    textureStore(curlTex, coord, vec4(curl, 0)).toWriteOnly();
  })()
    .compute(CELLS)
    .setName('flameCurl');

  const advectVelocity = Fn(() => {
    const coord = voxel(instanceIndex);
    const uvw = uvwOf(coord);
    const vel = texture3D(velA, uvw, 0).xyz;
    const back = uvw.sub(vel.div(uWorld).mul(u.dt));
    const next = texture3D(velA, back, 0).xyz.toVar();

    const dye = dyeRead.sample(uvw).level(0);
    const soot = dye.r;
    const temperature = dye.g;
    const age = dye.b;

    const lift = temperature.mul(u.buoyancy).sub(soot.mul(u.weight)).mul(force);
    next.addAssign(vec3(0, lift, 0).mul(u.dt));

    const thermalAt = uvw.add(
      vec3(
        u.time.mul(0.11),
        age.negate().mul(0.6).sub(u.time.mul(0.9)),
        age.mul(0.13).add(u.time.mul(0.07))
      ).div(u.turbFrequency)
    );
    const decay = age
      .mul(u.turbulenceDecay.negate())
      .exp()
      .mul(smoothstep(0.04, 0.35, age));
    const thermal = curlRead
      .sample(thermalAt)
      .level(0)
      .xyz.mul(u.turbulence)
      .mul(temperature)
      .mul(decay);
    const ambientAt = uvw
      .mul(0.5)
      .add(vec3(0, u.time.mul(0.25), u.time.mul(0.06)).div(u.turbFrequency));
    const ambient = curlRead
      .sample(ambientAt)
      .level(0)
      .xyz.mul(u.turbulence.mul(0.2))
      .mul(soot);
    next.addAssign(thermal.add(ambient).mul(force).mul(u.dt));

    // A draught pushes the gas sideways, harder the hotter it is.
    next.addAssign(
      u.wind.mul(temperature.clamp(0, 1).mul(0.8).add(0.2)).mul(u.dt)
    );

    next.mulAssign(max(float(1).sub(u.velDamping.mul(u.dt)), 0));
    const edge = min(uvw, vec3(1).sub(uvw));
    next.mulAssign(smoothstep(0, 0.08, min(edge.x, min(edge.y, edge.z))));
    textureStore(velB, coord, vec4(next, 0)).toWriteOnly();
  })()
    .compute(CELLS)
    .setName('flameAdvectVelocity');

  const divergencePass = Fn(() => {
    const coord = voxel(instanceIndex);
    const uvw = uvwOf(coord);
    const r = texture3D(velB, uvw.add(vec3(TEXEL.x, 0, 0)), 0).x;
    const l = texture3D(velB, uvw.sub(vec3(TEXEL.x, 0, 0)), 0).x;
    const t = texture3D(velB, uvw.add(vec3(0, TEXEL.y, 0)), 0).y;
    const b = texture3D(velB, uvw.sub(vec3(0, TEXEL.y, 0)), 0).y;
    const f = texture3D(velB, uvw.add(vec3(0, 0, TEXEL.z)), 0).z;
    const k = texture3D(velB, uvw.sub(vec3(0, 0, TEXEL.z)), 0).z;
    const div = r.sub(l).add(t.sub(b)).add(f.sub(k)).mul(0.5);
    textureStore(divergence, coord, vec4(div, 0, 0, 0)).toWriteOnly();
  })()
    .compute(CELLS)
    .setName('flameDivergence');

  const jacobi = (read, write, name) =>
    Fn(() => {
      const coord = voxel(instanceIndex);
      const uvw = uvwOf(coord);
      const sum = texture3D(read, uvw.add(vec3(TEXEL.x, 0, 0)), 0)
        .x.add(texture3D(read, uvw.sub(vec3(TEXEL.x, 0, 0)), 0).x)
        .add(texture3D(read, uvw.add(vec3(0, TEXEL.y, 0)), 0).x)
        .add(texture3D(read, uvw.sub(vec3(0, TEXEL.y, 0)), 0).x)
        .add(texture3D(read, uvw.add(vec3(0, 0, TEXEL.z)), 0).x)
        .add(texture3D(read, uvw.sub(vec3(0, 0, TEXEL.z)), 0).x);
      const div = texture3D(divergence, uvw, 0).x;
      textureStore(
        write,
        coord,
        vec4(sum.sub(div).div(6), 0, 0, 0)
      ).toWriteOnly();
    })()
      .compute(CELLS)
      .setName(name);
  const jacobiAB = jacobi(pressA, pressB, 'flameJacobiAB');
  const jacobiBA = jacobi(pressB, pressA, 'flameJacobiBA');

  const project = Fn(() => {
    const coord = voxel(instanceIndex);
    const uvw = uvwOf(coord);
    const gradient = vec3(
      texture3D(pressA, uvw.add(vec3(TEXEL.x, 0, 0)), 0).x.sub(
        texture3D(pressA, uvw.sub(vec3(TEXEL.x, 0, 0)), 0).x
      ),
      texture3D(pressA, uvw.add(vec3(0, TEXEL.y, 0)), 0).x.sub(
        texture3D(pressA, uvw.sub(vec3(0, TEXEL.y, 0)), 0).x
      ),
      texture3D(pressA, uvw.add(vec3(0, 0, TEXEL.z)), 0).x.sub(
        texture3D(pressA, uvw.sub(vec3(0, 0, TEXEL.z)), 0).x
      )
    ).mul(0.5);
    const vel = texture3D(velB, uvw, 0).xyz.sub(gradient);
    textureStore(velA, coord, vec4(vel, 0)).toWriteOnly();
  })()
    .compute(CELLS)
    .setName('flameProject');

  // Distance from a point (box uvw) to the wick's burning segment, in world
  // units.
  const sourceDistance = (uvw) => {
    const p = uvw.sub(0.5).mul(uWorld);
    const ab = u.sourceB.sub(u.sourceA);
    const h = p.sub(u.sourceA).dot(ab).div(ab.dot(ab)).clamp(0, 1);
    return p.sub(u.sourceA.add(ab.mul(h))).length();
  };

  // Advects the dye and emits round the wick in one pass, so the write
  // never races a second pass over the same texture.
  const advectDye = Fn(() => {
    const coord = voxel(instanceIndex);
    const uvw = uvwOf(coord);
    const vel = texture3D(velA, uvw, 0).xyz;
    const back = uvw.sub(vel.div(uWorld).mul(u.dt));
    const dye = dyeRead.sample(back).level(0);
    const soot = dye.r
      .mul(max(float(1).sub(u.dissipation.mul(u.dt)), 0))
      .toVar();
    const temperature = dye.g
      .mul(max(float(1).sub(u.cooling.mul(u.dt)), 0))
      .toVar();
    const fuel = dye.a.mul(exp(u.dt.mul(-7))).toVar();
    const cells = vec3(GX, GY, GZ);
    const nearest = floor(back.mul(cells)).add(0.5).div(cells);
    const age = dyeRead.sample(nearest).level(0).b.add(u.dt).toVar();

    const distance = sourceDistance(uvw);
    const shell = exp(distance.div(u.sourceRadius).pow(2).negate()).toVar();
    const core = exp(distance.div(u.sourceRadius.mul(0.45)).pow(2).negate());
    const flicker = fract(
      interleavedGradientNoise(vec3(coord).xy.add(u.time.mul(60)))
    )
      .mul(0.3)
      .add(0.85);
    const rate = shell.mul(u.emit).mul(flicker).mul(u.dt);
    const addSoot = u.emitSoot.mul(rate);
    const addHeat = u.emitTemperature.mul(rate);
    If(rate.greaterThan(1e-5), () => {
      const total = soot.add(addSoot);
      age.assign(mix(age, 0, rate.mul(20).clamp(0, 1)));
      soot.assign(total);
      temperature.addAssign(addHeat);
      fuel.assign(max(fuel, core.mul(u.emitFuel).mul(u.emit.clamp(0, 1))));
    });
    temperature.assign(temperature.clamp(0, 12));
    If(soot.add(temperature).lessThanEqual(0.004), () => {
      age.assign(0);
    });
    textureStore(
      dyeWrite,
      coord,
      vec4(soot, temperature, age, fuel)
    ).toWriteOnly();
  })()
    .compute(CELLS)
    .setName('flameAdvectDye');

  const clears = [velA, velB, pressA, pressB, divergence, dyeA, dyeB].map(
    (texture) =>
      Fn(() => {
        textureStore(texture, voxel(instanceIndex), vec4(0)).toWriteOnly();
      })()
        .compute(CELLS)
        .setName(`clear ${texture.name}`)
  );

  const exportField = Fn(() => {
    const coord = voxel(instanceIndex);
    exported
      .element(instanceIndex)
      .assign(dyeRead.sample(uvwOf(coord)).level(0));
  })()
    .compute(CELLS)
    .setName('flameExport');

  let accumulator = 0;
  let ready = false;

  function stepOnce(renderer) {
    renderer.compute(advectVelocity);
    renderer.compute(divergencePass);
    for (let i = 0; i < PRESSURE_ITERATIONS; i += 1) {
      renderer.compute(i % 2 === 0 ? jacobiAB : jacobiBA);
    }
    renderer.compute(project);
    renderer.compute(advectDye);
    const read = dyeRead.value;
    dyeRead.value = dyeWrite.value;
    dyeWrite.value = read;
  }

  return {
    grid,
    size,
    uniforms: u,

    reset(renderer) {
      clears.forEach((pass) => renderer.compute(pass));
      dyeRead.value = dyeA;
      dyeWrite.value = dyeB;
      if (!ready) renderer.compute(curlPass);
      ready = true;
      accumulator = 0;
      u.time.value = 0;
    },

    // Runs whole sim steps for `delta` seconds; `before(t)` sets the
    // signal-driven uniforms at each step's clock.
    advance(renderer, delta, before) {
      if (!ready) this.reset(renderer);
      accumulator += Math.min(delta, 1 / 6);
      while (accumulator >= SIM_STEP) {
        u.time.value += SIM_STEP;
        before?.(u.time.value);
        stepOnce(renderer);
        accumulator -= SIM_STEP;
      }
    },

    // The dye field as a CPU grid (x fastest), for the plot's isotherms.
    async read(renderer) {
      renderer.compute(exportField);
      const buffer = await renderer.getArrayBufferAsync(exported.value);
      return { data: new Float32Array(buffer), grid, size };
    },

    material: (look) => createFlameMaterial({ dyeRead, look, size, u }),

    dispose() {
      [velA, velB, dyeA, dyeB, divergence, pressA, pressB, curlTex].forEach(
        (texture) => texture.dispose()
      );
    },
  };
}
