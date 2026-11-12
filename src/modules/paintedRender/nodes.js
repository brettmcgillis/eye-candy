import { Color } from 'three';
import {
  Fn,
  If,
  cos,
  float,
  floor,
  fract,
  fwidth,
  hash,
  int,
  mix,
  select,
  sin,
  smoothstep,
  texture,
  uint,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';

import { hashPaintSeed } from '@modules/painted';

import paintPaletteColors from './palette';
import createPigmentTexture from './pigment';
import { acquireWashTexture } from './wash';

export default function createPaintState() {
  const map = createPigmentTexture();
  const nativeTexture = acquireWashTexture();
  const washMap = nativeTexture.map;
  const u = {
    bleed: uniform(0),
    pooling: uniform(0),
    hatchRoughness: uniform(0),
    strokeRoughness: uniform(0),
    followPalette: uniform(0),
    paletteOn: uniform(0),
    palette: [0, 1, 2].map(() => uniform(new Color('#514a45'))),
    grain: uniform(0.18),
    seed: uniform(0, 'uint'),
    ink: uniform(new Color('#514a45')),
    opacity: uniform(0.75),
    paper: uniform(new Color('#f6f2e9')),
    scale: uniform(1),
    style: uniform(0),
  };
  const sample = (coord) => texture(map, coord.fract());
  function field(coord, seed) {
    if (seed === undefined)
      throw new Error('A painted fill requires its own stable identity');
    const identity = seed.toUint().bitXor(u.seed);
    const phase = vec2(hash(identity.add(17)), hash(identity.add(71))).mul(11);
    const p = coord.add(phase);
    const random = (key, salt) =>
      hash(
        uint(int(key.x))
          .mul(374761393)
          .bitXor(uint(int(key.y)).mul(668265263))
          .bitXor(identity)
          .add(salt)
      );
    const cell = floor(p);
    const f = p.sub(cell);
    const blend = f.mul(f).mul(vec2(3).sub(f.mul(2)));
    function corner(x, y) {
      const key = cell.add(vec2(x, y));
      const angle = random(key, 0).mul(6.283185);
      const local = p.sub(key);
      const turned = vec2(
        local.x.mul(cos(angle)).sub(local.y.mul(sin(angle))),
        local.x.mul(sin(angle)).add(local.y.mul(cos(angle)))
      );
      const offset = vec2(random(key, 19), random(key, 73)).sub(0.5).mul(0.35);
      return sample(turned.mul(0.14).add(offset).add(0.5));
    }
    return mix(
      mix(corner(0, 0), corner(1, 0), blend.x),
      mix(corner(0, 1), corner(1, 1), blend.x),
      blend.y
    );
  }
  function grainAt(coord, seed) {
    const cell = floor(coord);
    const f = coord.sub(cell);
    const blend = f.mul(f).mul(vec2(3).sub(f.mul(2)));
    const identity = seed.toUint().bitXor(u.seed);
    const value = (x, y) => {
      const key = cell.add(vec2(x, y));
      return hash(
        uint(int(key.x))
          .mul(374761393)
          .bitXor(uint(int(key.y)).mul(668265263))
          .bitXor(identity)
      );
    };
    return mix(
      mix(value(0, 0), value(1, 0), blend.x),
      mix(value(0, 1), value(1, 1), blend.x),
      blend.y
    );
  }
  function inkFor(base) {
    return mix(u.ink, base.mul(0.38), u.followPalette);
  }
  function colorFor(base, role = 1) {
    return mix(base, u.palette[role], u.paletteOn.mul(u.followPalette));
  }
  function washMark(coord, seed, triangle = float(0)) {
    const identity = seed.toUint().bitXor(u.seed);
    const variant = floor(hash(identity.add(317)).mul(16)).add(
      triangle.mul(16)
    );
    const angle = floor(hash(identity.add(41)).mul(4))
      .mul(1.5707963)
      .mul(float(1).sub(triangle));
    const q = coord.sub(0.5);
    const turned = vec2(
      q.x.mul(cos(angle)).sub(q.y.mul(sin(angle))),
      q.x.mul(sin(angle)).add(q.y.mul(cos(angle)))
    );
    const warp = vec2(
      grainAt(coord.mul(4), seed.toUint().add(71)),
      grainAt(coord.mul(4), seed.toUint().add(137))
    )
      .sub(0.5)
      .mul(0.045);
    const at = turned
      .mul(
        mix(
          hash(identity.add(53)).mul(0.1).add(0.7),
          hash(identity.add(53)).mul(0.08).add(0.74),
          triangle
        )
      )
      .add(float(0.5).add(triangle.mul(0.035)))
      .add(warp);
    const tile = vec2(variant.mod(4), floor(variant.div(4)));
    const inside = at.x
      .greaterThan(0)
      .and(at.y.greaterThan(0))
      .and(at.x.lessThan(1))
      .and(at.y.lessThan(1));
    return texture(
      washMap,
      at.clamp(0.005, 0.995).add(tile).div(vec2(4, 8))
    ).mul(inside.select(1, 0));
  }
  function washField(coord, seed) {
    const shift = vec2(
      grainAt(coord.mul(0.61), seed.toUint().add(419)),
      grainAt(coord.mul(0.61), seed.toUint().add(653))
    )
      .sub(0.5)
      .mul(0.55);
    const point = coord.add(shift);
    const cell = floor(point);
    const patches = [];
    for (let y = 0; y < 2; y += 1)
      for (let x = 0; x < 2; x += 1) {
        const key = cell.add(vec2(x, y));
        const identity = uint(int(key.x))
          .mul(374761393)
          .bitXor(uint(int(key.y)).mul(668265263))
          .bitXor(seed.toUint());
        const delta = point.sub(key);
        const support = float(1).sub(
          smoothstep(0.8, 1, delta.x.abs().max(delta.y.abs()))
        );
        patches.push(washMark(delta.mul(0.55).add(0.5), identity).mul(support));
      }
    const density = float(1).sub(
      patches.reduce(
        (dry, patch) => dry.mul(float(1).sub(patch.r.mul(0.45))),
        float(1)
      )
    );
    const pool = patches.reduce((sum, patch) => sum.add(patch.b), float(0));
    return vec3(density, 0, pool.mul(0.35));
  }
  function hatch(projection, along, seed) {
    const line = floor(projection.add(0.5));
    const identity = seed
      .toUint()
      .bitXor(u.seed)
      .bitXor(uint(int(line)).mul(747796405));
    const phase = hash(identity.add(17));
    const wobble = sin(along.mul(2.7).add(phase.mul(21)))
      .mul(0.12)
      .add(sin(along.mul(8.1).add(phase.mul(37))).mul(0.035));
    const displacement = phase
      .sub(0.5)
      .mul(0.35)
      .add(wobble)
      .mul(u.hatchRoughness);
    const pressure = sin(along.mul(1.3).add(phase.mul(19)))
      .mul(0.45)
      .add(1);
    const width = fwidth(projection)
      .max(0.001)
      .mul(0.6)
      .mul(mix(float(1), pressure, u.hatchRoughness));
    const distance = fract(projection.add(displacement).add(0.5))
      .sub(0.5)
      .abs();
    const primary = float(1).sub(smoothstep(width.mul(0.2), width, distance));
    const echo = fract(
      projection.add(displacement.mul(0.6)).add(phase.mul(0.15)).add(0.62)
    )
      .sub(0.5)
      .abs();
    return primary.max(
      float(1)
        .sub(smoothstep(width.mul(0.15), width.mul(0.7), echo))
        .mul(u.hatchRoughness)
        .mul(0.3)
    );
  }
  function treat(
    base,
    coord,
    {
      seed,
      edge = float(0),
      bounded = false,
      stamp = false,
      boundary = null,
      washUV = null,
      triangle = float(0),
    } = {}
  ) {
    if (seed === undefined)
      throw new Error('A painted fill requires its own stable identity');
    return Fn(() => {
      const result = base.toVar();
      If(u.style.greaterThan(0.5), () => {
        const point = coord.mul(u.scale);
        const mark = field(point, seed);
        const grain = grainAt(point.mul(113), seed.toUint().add(641))
          .sub(0.5)
          .mul(u.grain);
        const density = mark.r
          .mul(1.6)
          .add(0.32)
          .add(edge.mul(0.25))
          .add(grain)
          .clamp(0, 1)
          .mul(u.opacity)
          .toVar();
        if (bounded) {
          const inset = coord.min(float(1).sub(coord));
          const inside = inset.x.min(inset.y);
          const margin = mark.r.mul(0.1).add(0.025);
          const wet = inside.sub(margin).div(0.035).clamp(0, 1);
          const rim = float(1).sub(
            inside.sub(margin).abs().div(0.04).clamp(0, 1)
          );
          density.assign(
            density
              .add(rim.mul(0.2).mul(u.opacity))
              .clamp(0, 1)
              .mul(wet.mul(wet).mul(float(3).sub(wet.mul(2))))
          );
        }
        If(u.bleed.add(u.pooling).greaterThan(0.001), () => {
          const native =
            bounded || stamp
              ? washMark(washUV ?? coord, seed, triangle)
              : washField(point, seed);
          const wetDensity = native.r
            .mul(1.8)
            .add(native.b.mul(u.pooling).mul(1.5))
            .add(grain.mul(native.r))
            .clamp(0, 1)
            .mul(u.opacity)
            .toVar();
          if (boundary) {
            const margin = field(point.mul(2), seed.toUint().add(397))
              .r.mul(0.09)
              .add(0.035);
            const wet = smoothstep(margin, margin.add(0.035), boundary);
            const rim = float(1).sub(
              smoothstep(0.01, 0.045, boundary.sub(margin).abs())
            );
            wetDensity.assign(
              wetDensity.add(rim.mul(u.pooling).mul(0.35)).clamp(0, 1).mul(wet)
            );
          }
          density.assign(
            mix(density, wetDensity, u.bleed)
              .add(native.b.mul(u.pooling).mul(0.2))
              .clamp(0, 1)
          );
        });
        const wash = mix(u.paper, base, density);
        const pencil = hatch(
          point.x.add(point.y.mul(0.5)).mul(24),
          point.y.mul(8),
          seed
        );
        const sketch = mix(
          mix(u.paper, base, density.mul(0.3)),
          inkFor(base),
          pencil.mul(0.7).add(edge.mul(0.45)).clamp(0, 1)
        );
        result.assign(select(u.style.greaterThan(1.5), sketch, wash));
      });
      return result;
    })();
  }

  return {
    map,
    sample,
    field,
    grainAt,
    washMark,
    washField,
    hatch,
    inkFor,
    colorFor,
    treat,
    u,
    apply(config) {
      u.seed.value = hashPaintSeed(
        config.seed ??
          config.generationSeed ??
          config.fieldSeed ??
          config.blobSeed ??
          config.haloSeed ??
          config.volleySeed ??
          'painted'
      );
      u.bleed.value = config.paintBleed ?? 0;
      u.pooling.value = config.paintPooling ?? 0;
      u.hatchRoughness.value = config.paintHatchRoughness ?? 0;
      u.strokeRoughness.value = config.paintStrokeRoughness ?? 0;
      u.followPalette.value = config.paintFollowPalette ? 1 : 0;
      const colors = paintPaletteColors(config);
      u.paletteOn.value = colors ? 1 : 0;
      colors?.forEach((value, index) => u.palette[index].value.set(value));
      u.style.value = { watercolor: 1, pencil: 2 }[config.paintStyle] ?? 0;
      u.opacity.value = config.paintOpacity ?? 0.75;
      u.scale.value = config.paintScale ?? 1;
      u.grain.value = config.paintGrain ?? 0.18;
      u.ink.value.set(config.paintInk ?? '#514a45');
      u.paper.value.set(config.paintPaper ?? '#f6f2e9');
    },
    dispose() {
      map.dispose();
      nativeTexture.dispose();
    },
  };
}
