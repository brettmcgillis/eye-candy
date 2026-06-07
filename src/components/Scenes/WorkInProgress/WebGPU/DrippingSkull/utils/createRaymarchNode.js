import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  atan,
  clamp,
  cos,
  cross,
  distance,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  mix,
  mod,
  normalize,
  pow,
  reflect,
  screenUV,
  sign,
  sin,
  smoothstep,
  time,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { signedPerlinApprox } from '../../../../../elements/perlinNoiseBall/perlinNoiseNodes';

const TAU = Math.PI * 2;
const STEP_COUNT = 100;

const rotate2D = Fn(([input, angle]) => {
  const c = cos(angle);
  const s = sin(angle);
  return vec2(
    input.x.mul(c).sub(input.y.mul(s)),
    input.x.mul(s).add(input.y.mul(c))
  );
}).setLayout({
  name: 'rotate2D',
  type: 'vec2',
  inputs: [
    { name: 'input', type: 'vec2' },
    { name: 'angle', type: 'float' },
  ],
});

const hash31 = Fn(([input]) => {
  const p3 = fract(vec3(input).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
  p3.addAssign(dot(p3, p3.yzx.add(33.33)));
  return fract(p3.xxy.add(p3.yzz).mul(p3.zyx));
}).setLayout({
  name: 'hash31',
  type: 'vec3',
  inputs: [{ name: 'input', type: 'float' }],
});

const smin = Fn(([d1, d2, k]) => {
  const h = clamp(float(0.5).add(float(0.5).mul(d2.sub(d1).div(k))), 0, 1);
  return mix(d2, d1, h).sub(k.mul(h).mul(float(1).sub(h)));
}).setLayout({
  name: 'smin',
  type: 'float',
  inputs: [
    { name: 'd1', type: 'float' },
    { name: 'd2', type: 'float' },
    { name: 'k', type: 'float' },
  ],
});

const sdSegment = Fn(([input, height, radius]) => {
  const point = vec3(input).toVar();
  point.y.subAssign(clamp(point.y, 0, height));
  return length(point).sub(radius);
}).setLayout({
  name: 'sdSegment',
  type: 'float',
  inputs: [
    { name: 'input', type: 'vec3' },
    { name: 'height', type: 'float' },
    { name: 'radius', type: 'float' },
  ],
});

const sampleNoise = Fn(([input]) => {
  const base = signedPerlinApprox(input).mul(0.5).add(0.5);
  const green = signedPerlinApprox(input.add(vec3(17.13, 9.71, 4.29)))
    .mul(0.5)
    .add(0.5);
  const blue = signedPerlinApprox(input.add(vec3(31.77, 15.19, 28.41)))
    .mul(0.5)
    .add(0.5);
  return vec3(base, green, blue);
}).setLayout({
  name: 'sampleNoise',
  type: 'vec3',
  inputs: [{ name: 'input', type: 'vec3' }],
});

const fbm = Fn(([input, speed]) => {
  const point = vec3(input).toVar();
  const amplitude = float(0.5).toVar();
  const result = vec3(0, 0, 0).toVar();

  Loop({ start: 0, end: 3, type: 'int', condition: '<' }, () => {
    point.y.addAssign(time.mul(speed).mul(0.005).div(amplitude));
    const noise = sin(sampleNoise(point.div(amplitude)).mul(TAU));
    result.addAssign(noise.mul(amplitude));
    amplitude.divAssign(2);
  });

  return result;
}).setLayout({
  name: 'fbm',
  type: 'vec3',
  inputs: [
    { name: 'input', type: 'vec3' },
    { name: 'speed', type: 'float' },
  ],
});

const lookAtRay = Fn(([fromPos, toPos, uv, fov]) => {
  const z = normalize(toPos.sub(fromPos));
  const x = normalize(cross(z, vec3(0, 1, 0)));
  const y = normalize(cross(x, z));
  return normalize(z.mul(fov).add(x.mul(uv.x)).add(y.mul(uv.y)));
}).setLayout({
  name: 'lookAtRay',
  type: 'vec3',
  inputs: [
    { name: 'fromPos', type: 'vec3' },
    { name: 'toPos', type: 'vec3' },
    { name: 'uv', type: 'vec2' },
    { name: 'fov', type: 'float' },
  ],
});

const vectorAt = Fn(([fromPos, toPos, uv, fov]) => {
  const z = normalize(toPos.sub(fromPos));
  const x = normalize(cross(z, vec3(0, 1, 0)));
  const y = normalize(cross(x, z));
  return z.mul(fov).add(x.mul(uv.x)).add(y.mul(uv.y));
}).setLayout({
  name: 'vectorAt',
  type: 'vec3',
  inputs: [
    { name: 'fromPos', type: 'vec3' },
    { name: 'toPos', type: 'vec3' },
    { name: 'uv', type: 'vec2' },
    { name: 'fov', type: 'float' },
  ],
});

const createMap = (uniforms) =>
  Fn(([inputPoint, mouse]) => {
    const point = vec3(inputPoint).toVar();
    const originalPoint = vec3(inputPoint).toVar();

    // base sphere
    const dist = length(point).sub(1).toVar();

    // polar repeat for drip channels — driven by dripCount
    const angle = float(TAU).div(uniforms.dripCount);
    const polarAngle = atan(point.z, point.x).add(angle.mul(0.5)).toVar();
    const radialLength = length(point.xz).toVar();
    const cell = floor(polarAngle.div(angle)).toVar();
    polarAngle.assign(mod(polarAngle, angle).sub(angle.mul(0.5)));
    point.xz.assign(vec2(cos(polarAngle), sin(polarAngle)).mul(radialLength));
    If(abs(cell).greaterThanEqual(uniforms.dripCount.div(2)), () => {
      cell.assign(abs(cell));
    });

    const rng = hash31(cell).toVar();
    point.x.subAssign(0.5);
    rng.x.addAssign(sign(point.x).mul(0.5));
    point.x.assign(abs(point.x).sub(0.2));
    point.y.mulAssign(-1);

    const localTime = time.mul(uniforms.dripSpeed).mul(0.2).add(rng.x).toVar();
    const anim = fract(localTime).toVar();
    const wave = sin(anim.mul(3.14)).toVar();
    const height = float(0.7)
      .add(float(0.3).mul(pow(wave, 4)))
      .toVar();
    const size = float(0.03)
      .sub(float(0.03).mul(float(1).sub(wave)))
      .mul(uniforms.pointerRadius)
      .div(0.65)
      .toVar();

    const segment = sdSegment(point, height, size);
    dist.assign(smin(dist, segment, uniforms.dripBlend));

    // drip head — flies dripDropletFall units away then vanishes (was hardcoded 200,
    // which sent it way outside maxDist=4 and made blobs invisible)
    const headCenter = vec3(
      0,
      pow(anim, 10).mul(uniforms.dripDropletFall).add(height),
      0
    );
    const head = length(point.sub(headCenter)).sub(0.05);
    dist.assign(
      smin(dist, head, float(0.3).mul(pow(anim, 0.5)).mul(uniforms.dripBlend))
    );

    // mouse dent
    const mouseRadius = uniforms.pointerStrength.mul(0.5).add(0.1);
    const mouseBlend = uniforms.pointerStrength.mul(0.5).add(0.1);
    dist.assign(
      smin(
        dist,
        distance(originalPoint, mouse.negate()).sub(mouseRadius),
        mouseBlend
      )
    );

    // surface noise
    const seed = originalPoint.mul(uniforms.noiseScale.mul(0.025));
    const noise = fbm(seed, uniforms.dripSpeed);
    dist.subAssign(noise.x.mul(0.05).mul(uniforms.noiseStrength));

    return dist.mul(0.5);
  }).setLayout({
    name: 'mapDripSphere',
    type: 'float',
    inputs: [
      { name: 'inputPoint', type: 'vec3' },
      { name: 'mouse', type: 'vec3' },
    ],
  });

export default function createRaymarchNode(uniforms) {
  const map = createMap(uniforms);

  return Fn(() => {
    const aspect = uniforms.resolution.x.div(max(uniforms.resolution.y, 1));
    // screenUV.y is 0=top, 1=bottom in WebGPU (Vulkan convention).
    // Shadertoy uses y=0 at bottom, so we invert to match the reference.
    const uv = vec2(
      screenUV.x.sub(0.5).mul(aspect),
      float(0.5).sub(screenUV.y)
    ).toVar();

    // background — driven by bgColor uniform
    const color = uniforms.bgColor.mul(smoothstep(2, 0.5, length(uv))).toVar();

    const pos = vec3(0, 0, 3).toVar();
    const at = vec3(0, 0, 0);
    const cameraTilt = sin(time.mul(0.2)).mul(0.1);
    pos.yz.assign(rotate2D(pos.yz, cameraTilt));

    const ray = lookAtRay(pos, at, uv, 1).toVar();
    const mouse = vec3(0, 0, 0).toVar();

    If(uniforms.mouseActive.greaterThan(0.5), () => {
      const mouseUv = vec2(
        uniforms.mouseUv.x.sub(0.5).mul(aspect),
        uniforms.mouseUv.y.sub(0.5)
      );
      mouse.assign(vectorAt(pos, at, mouseUv.mul(2), -1).mul(-1));
    });

    const maxDist = float(4);
    const total = float(0).toVar();
    const shade = float(0).toVar();
    const hit = float(0).toVar();

    Loop(
      { start: 0, end: STEP_COUNT, type: 'int', condition: '<' },
      ({ i }) => {
        const dist = map(pos, mouse).toVar();

        If(
          dist
            .lessThan(total.div(max(uniforms.resolution.y, 1)))
            .or(total.greaterThan(maxDist)),
          () => {
            shade.assign(
              float(STEP_COUNT).sub(float(i)).div(float(STEP_COUNT))
            );
            hit.assign(total.lessThan(maxDist).select(1, 0));
            Break();
          }
        );

        ray.addAssign(
          vec3(total.mul(0.002), total.mul(0.002), total.mul(0.002))
        );
        pos.addAssign(ray.mul(dist));
        total.addAssign(dist);
      }
    );

    const noff = vec2(0.001, 0);
    const baseDist = map(pos, mouse).toVar();
    const normal = normalize(
      baseDist.sub(
        vec3(
          map(pos.sub(vec3(noff.x, 0, 0)), mouse),
          map(pos.sub(vec3(0, noff.x, 0)), mouse),
          map(pos.sub(vec3(0, 0, noff.x)), mouse)
        )
      )
    ).toVar();

    If(hit.greaterThan(0.001), () => {
      // IQ palette: a + b * cos(2π * freq + time * speed + uv.y * 3)
      // paletteA = midpoint color (from tintA+tintB/2 in JS)
      // paletteB = amplitude (from |tintB-tintA|/2 in JS)
      // paletteBrightness scales the result for glow
      const phase = time.mul(uniforms.paletteSpeed).add(uv.y.mul(3));
      const tint = uniforms.paletteA
        .add(uniforms.paletteB.mul(cos(vec3(1, 0.3, 6).mul(TAU).add(phase))))
        .mul(uniforms.paletteBrightness)
        .toVar();

      const baseLight = pow(
        dot(normal, vec3(0, -1, 0))
          .mul(0.5)
          .add(0.5),
        10
      );
      const reflected = reflect(ray, normal);
      const top = dot(reflected, vec3(0, 1, 0))
        .mul(0.4)
        .add(0.5);
      const glow = dot(normal, ray).mul(0.7).add(0.5);

      color.assign(tint.mul(baseLight));
      color.addAssign(vec3(0.7, 0.2, 0.7).mul(pow(clamp(top, 0, 1), 1.5)));
      color.addAssign(vec3(4, 1, 1).mul(pow(glow, 2)));
      color.mulAssign(pow(shade, 0.5));
    });

    return vec4(color, 1);
  })();
}
