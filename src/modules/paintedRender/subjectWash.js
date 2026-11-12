import {
  Fn,
  If,
  color,
  dot,
  mix,
  normalize,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';

export default function subjectWash(painting, base, coordinates, normal, seed) {
  const point = coordinates.mul(painting.u.scale);
  const mark = painting.field(point, seed);
  const deposit = mark.r;
  const second = painting.field(
    point.mul(0.73).add(vec2(0.31, 0.47)),
    seed.add(19)
  ).r;
  const light = dot(normal, normalize(vec3(-0.8, 0.55, 0.2)))
    .mul(0.5)
    .add(0.5);
  const broken = light.add(deposit.sub(0.25).mul(0.2));
  const shadow = smoothstep(0.4, 0.68, broken).oneMinus();
  const midtone = smoothstep(0.66, 0.9, broken).oneMinus();
  const coverage = shadow.mul(0.75).add(midtone.mul(0.25));
  const legacyPigment = mix(
    color('#7c8eaa'),
    color('#b8a183'),
    second.mul(1.5).clamp(0, 1)
  );
  const pigment = mix(
    legacyPigment,
    mix(
      painting.colorFor(base.mul(0.65), 0),
      painting.colorFor(base, 2),
      second.mul(1.5).clamp(0, 1)
    ),
    painting.u.followPalette
  );
  const grain = painting
    .field(point.mul(19.3), seed.add(71))
    .r.sub(0.3)
    .mul(painting.u.grain);
  const density = coverage
    .mul(deposit.mul(0.8).add(0.55).add(grain))
    .mul(painting.u.opacity)
    .mul(painting.u.style.greaterThan(1.5).select(0.2, 1))
    .clamp(0, 1);
  const paper = mix(painting.u.paper, base, 0.12);
  const paintedDensity = Fn(() => {
    const amount = density.toVar();
    If(painting.u.bleed.greaterThan(0.001), () => {
      const native = painting.washField(point, seed);
      const wet = density
        .mul(native.r.mul(2).clamp(0, 1))
        .add(native.b.mul(painting.u.pooling).mul(0.4))
        .clamp(0, 1);
      amount.assign(mix(density, wet, painting.u.bleed));
    });
    return amount;
  })();
  const wash = mix(paper, pigment, paintedDensity);
  const nativePencil = painting.field(
    vec2(point.x.add(point.y.mul(0.35)), point.y.mul(2)),
    seed
  ).g;
  const pencil = mix(
    nativePencil,
    painting.hatch(
      point.x.add(point.y.mul(0.35)).mul(24),
      point.y.mul(8),
      seed
    ),
    painting.u.hatchRoughness
  );
  const edge = smoothstep(0.04, 0.22, normal.z.abs()).oneMinus();
  const ink = shadow
    .mul(pencil)
    .mul(painting.u.style.greaterThan(1.5).select(1.6, 0.32))
    .add(edge.mul(pencil.mul(0.8).add(0.3)))
    .clamp(0, 0.75);
  return mix(wash, painting.inkFor(pigment), ink);
}
