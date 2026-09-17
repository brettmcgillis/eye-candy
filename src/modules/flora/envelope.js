import composeForms from './forms';
import { randomUnit } from './vec';

function createWarp(p, rng) {
  const waves = Array.from({ length: 3 }, () => ({
    direction: randomUnit(rng),
    k: randomUnit(rng).map((v) => (v * rng.range(0.6, 1.6)) / p.crownRadius),
    phase: rng() * Math.PI * 2,
  }));
  const amplitude = (p.warp * p.crownRadius * 0.35) / waves.length;

  return (point) => {
    const out = [...point];

    waves.forEach(({ direction, k, phase }) => {
      const s =
        Math.sin(point[0] * k[0] + point[1] * k[1] + point[2] * k[2] + phase) *
        amplitude;

      out[0] += direction[0] * s;
      out[1] += direction[1] * s;
      out[2] += direction[2] * s;
    });

    return out;
  };
}

function createLean(p, rng, pivot) {
  const heading = rng() * Math.PI * 2;
  const axis = [Math.cos(heading), 0, Math.sin(heading)];
  const angle = p.asymmetry * rng.range(0.15, 0.7) * (rng() < 0.5 ? -1 : 1);
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return (point) => {
    const v = [point[0] - pivot[0], point[1] - pivot[1], point[2] - pivot[2]];
    const d = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
    const turned = [
      axis[1] * v[2] - axis[2] * v[1],
      axis[2] * v[0] - axis[0] * v[2],
      axis[0] * v[1] - axis[1] * v[0],
    ];

    return [0, 1, 2].map(
      (i) => pivot[i] + v[i] * c + turned[i] * s + axis[i] * d * (1 - c)
    );
  };
}

function placeCenter(component, p, stemAt, stemTop) {
  if (component.side) {
    const attach = stemAt(component.anchor);
    const out = component.size * 0.85;

    return [
      attach[0] + Math.cos(component.sideDirection) * out,
      attach[1] + component.size * 0.3,
      attach[2] + Math.sin(component.sideDirection) * out,
    ];
  }

  return [
    stemTop[0] + component.offset[0],
    stemTop[1] +
      p.crownRadius * p.crownLift * component.lift +
      component.offset[1],
    stemTop[2] + component.offset[2],
  ];
}

export default function buildEnvelope(p, rng, stemAt) {
  const stemTop = stemAt(1);
  const components = composeForms(p, rng);
  const warp = createWarp(p, rng);
  const lean = createLean(p, rng, stemTop);
  const totalMass = components.reduce((sum, c) => sum + c.mass, 0);
  const points = [];
  const lobes = components.map((component, index) => {
    const center = placeCenter(component, p, stemAt, stemTop);
    const count = Math.round((p.tips * component.mass) / totalMass);

    for (let i = 0; i < count; i += 1) {
      const local = component.sample();
      const wisp = rng() < p.wispChance;
      const stretch = wisp ? 1 + p.wispReach * rng.range(0.4, 1) : 1;
      const placed = lean(
        warp([
          center[0] + local[0] * stretch,
          center[1] + local[1] * stretch,
          center[2] + local[2] * stretch,
        ])
      );

      points.push({
        lobe: index,
        wisp,
        x: placed[0],
        y: placed[1],
        z: placed[2],
      });
    }

    return {
      accent: component.accent,
      anchor: component.anchor,
      center: lean(center),
      density: component.density,
      name: component.name,
      radii: component.radii,
      tint: component.tint,
    };
  });

  const sum = points.reduce(
    (acc, pt) => [acc[0] + pt.x, acc[1] + pt.y, acc[2] + pt.z],
    [0, 0, 0]
  );
  const n = Math.max(points.length, 1);

  return {
    centroid: sum.map((v) => v / n),
    height: points.reduce((top, pt) => Math.max(top, pt.y), stemTop[1]),
    lobes,
    points,
  };
}
