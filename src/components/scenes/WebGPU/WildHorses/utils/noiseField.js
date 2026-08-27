import { snoise } from 'three/addons/tsl/math/curlNoise.js';
import { Fn, float, mix, normalize, vec2, vec3 } from 'three/tsl';

// Port of wolf2's noise.frag MRT pass. The reference renders height, a derived
// bump normal and a two-channel wind vector into a 64x64 float target that the
// grass and floor both sample; here the same three functions are evaluated
// analytically in the vertex/fragment graphs, which keeps the two consumers in
// lockstep without an offscreen target.
export const FIELD_UV_SCALE = 0.5;

export const fieldHeight = /* @__PURE__ */ Fn(
  ([uv, noiseScale, time, seed]) => {
    return snoise(
      vec3(uv.x.mul(noiseScale), uv.y.mul(noiseScale).add(time), seed)
    );
  }
);

export const fieldNormal = /* @__PURE__ */ Fn(
  ([uv, noiseScale, time, seed]) => {
    const step = float(1.0);
    const left = fieldHeight(
      uv.add(vec2(step.negate(), 0)),
      noiseScale,
      time,
      seed
    );
    const right = fieldHeight(uv.add(vec2(step, 0)), noiseScale, time, seed);
    const down = fieldHeight(
      uv.add(vec2(0, step.negate())),
      noiseScale,
      time,
      seed
    );
    const up = fieldHeight(uv.add(vec2(0, step)), noiseScale, time, seed);

    const va = normalize(vec3(2.0, right.sub(left), 0.0));
    const vb = normalize(vec3(0.0, up.sub(down), -2.0));

    return va.cross(vb);
  }
);

export const fieldWind = /* @__PURE__ */ Fn(([uv, noiseScale, time]) => {
  const x = snoise(
    vec3(uv.x.mul(noiseScale), uv.y.mul(noiseScale).add(time), time)
  );
  const y = snoise(
    vec3(uv.y.mul(noiseScale).add(time), uv.x.mul(noiseScale), time)
  );

  return vec2(x, y);
});

// wolf2 darkens the ground and grass with a soft radial blob under the animal
// rather than a real shadow map; contrast on v exaggerates the falloff toward
// the horizon so the blob still reads at grazing angles.
export const shadowBlob = /* @__PURE__ */ Fn(
  ([uv, center, radius, strength]) => {
    const contrasted = vec2(uv.x, uv.y.sub(0.5).mul(0.5).add(0.5).clamp(0, 1));
    const falloff = contrasted.distance(center).smoothstep(radius, 0.0);

    return falloff.mul(strength);
  }
);

export function terrainUv(position, extent) {
  const u = position.x.div(extent).mul(0.5).add(0.5);
  const v = float(1.0).sub(position.z.div(extent).mul(0.5).add(0.5));

  return vec2(u, v);
}

export function worldToFieldUv(x, z, extent) {
  return [x / extent / 2 + 0.5, 1 - (z / extent / 2 + 0.5)];
}

export const blendToOne = /* @__PURE__ */ Fn(([value, amount]) => {
  return mix(value, float(1.0), amount);
});
