function lobe(center, radius, stretch, accent) {
  return {
    accent,
    center,
    radii: [radius, radius * stretch, radius],
  };
}

function layoutLobes(p, rng, top) {
  const R = p.crownRadius;
  const S = p.crownStretch;
  const jitter = () => 1 + rng.signed() * p.lobeJitter;
  const accent = () => (rng() < p.accentAmount ? 1 : 0);
  const cy = top + R * p.crownLift;
  const lobes = [];

  if (p.crownShape === 'heart') {
    const offset = R * p.lobeSpread;

    [-1, 1].forEach((side) => {
      lobes.push(
        lobe(
          [side * offset, cy + R * 0.25, -R * 0.15],
          R * 0.62 * jitter(),
          S,
          0
        )
      );
    });
  } else if (p.crownShape === 'stack') {
    const tiers = Math.max(2, Math.round(p.lobeCount * 0.5));

    for (let i = 0; i < tiers; i += 1) {
      const t = i / (tiers - 1);

      lobes.push(
        lobe(
          [rng.signed() * R * 0.15, cy - R + t * R * 2.4, rng.signed() * 0.2],
          R * (0.62 - t * 0.22) * jitter(),
          S * 0.85,
          0
        )
      );
    }
  } else if (p.crownShape === 'fan') {
    lobes.push({
      accent: 0,
      center: [0, cy, 0],
      radii: [R * 1.2, R * S * 0.8, R * 0.55],
    });
  } else if (p.crownShape === 'cluster') {
    lobes.push(lobe([0, cy, 0], R * 0.55, S, 0));
  } else {
    lobes.push(lobe([0, cy, 0], R, S, 0));
  }

  const satellites =
    p.crownShape === 'stack' ? p.lobeCount - lobes.length : p.lobeCount;

  for (let i = 0; i < satellites; i += 1) {
    const theta = rng() * Math.PI * 2;
    const phi =
      p.crownShape === 'cluster' ? rng.range(0.2, 2.2) : rng.range(0.25, 1.6);
    const reach = R * p.lobeSpread * rng.range(0.7, 1.25);

    lobes.push(
      lobe(
        [
          Math.sin(phi) * Math.cos(theta) * reach,
          cy + Math.cos(phi) * reach * S,
          Math.sin(phi) * Math.sin(theta) * reach * 0.7,
        ],
        R * rng.range(0.25, 0.5) * jitter(),
        S,
        accent()
      )
    );
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
