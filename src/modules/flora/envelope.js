function layoutLobes(p, rng, top) {
  const count = Math.max(1, Math.round(p.lobeCount * rng.range(0.55, 1.5)));
  const lobes = [];
  const cursor = [0, top + p.crownRadius * p.crownLift, 0];
  let size = p.crownRadius * rng.range(0.6, 1);

  for (let i = 0; i < count; i += 1) {
    const jitter = 1 + rng.signed() * p.lobeJitter;

    lobes.push({
      accent: rng() < p.accentAmount ? 1 : 0,
      center: [...cursor],
      radii: [
        size * jitter,
        size * p.crownStretch * (1 + rng.signed() * p.lobeJitter * 0.5),
        size * jitter,
      ],
    });

    const theta = rng() * Math.PI * 2;
    const reach = size * p.lobeSpread * rng.range(0.35, 1.5);

    cursor[0] += Math.cos(theta) * reach;
    cursor[1] += size * p.lobeRise * rng.range(0.15, 1.5);
    cursor[2] += Math.sin(theta) * reach * 0.7;
    size *= p.lobeFalloff + (1 - p.lobeFalloff) * rng();
  }

  return lobes;
}

export default function buildEnvelope(p, rng, stemTop) {
  const lobes = layoutLobes(p, rng, stemTop[1]).map((l) => ({
    ...l,
    center: [l.center[0] + stemTop[0], l.center[1], l.center[2] + stemTop[2]],
    tint: rng(),
    volume: l.radii[0] * l.radii[1] * l.radii[2],
  }));

  const total = lobes.reduce((sum, l) => sum + l.volume, 0);
  const exponent = 1 / 3 + (0.07 - 1 / 3) * p.shellBias;
  const points = [];

  lobes.forEach((l, index) => {
    const count = Math.round((p.tips * l.volume) / total);

    for (let i = 0; i < count; ) {
      const z = rng.signed();
      const t = rng() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      const keep = 1 - p.crownOpen * (1 - (z + 1) / 2) ** 1.5;

      if (rng() < keep) {
        i += 1;
        const wisp = rng() < p.wispChance;
        const r =
          rng() ** exponent * (wisp ? 1 + p.wispReach * rng.range(0.4, 1) : 1);

        points.push({
          lobe: index,
          wisp,
          x: l.center[0] + s * Math.cos(t) * r * l.radii[0],
          y: l.center[1] + z * r * l.radii[1],
          z: l.center[2] + s * Math.sin(t) * r * l.radii[2],
        });
      }
    }
  });

  const centroid = lobes.reduce(
    (acc, l) => {
      const w = l.volume / total;

      return [
        acc[0] + l.center[0] * w,
        acc[1] + l.center[1] * w,
        acc[2] + l.center[2] * w,
      ];
    },
    [0, 0, 0]
  );

  return { centroid, lobes, points };
}
