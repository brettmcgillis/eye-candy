import { decode, fullBitmap } from './genome';
import {
  BITMAP_ROWS,
  LEG_ROW_START,
  MAX_TENTACLES,
  TEMPERAMENT_GENES,
} from './params';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function hslToRgb(h, s, l) {
  const k = (n) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

  return [f(0), f(8), f(4)];
}

function bitmapFeatures(genome) {
  const a = fullBitmap(genome, 0);
  const b = fullBitmap(genome, 1);
  const width = a[0].length;
  let filled = 0;
  let eyes = 0;
  let animatedLegs = 0;
  let feet = 0;

  for (let r = 0; r < BITMAP_ROWS; r += 1) {
    for (let x = 0; x < width; x += 1) {
      filled += a[r][x];

      if (r >= LEG_ROW_START && a[r][x] !== b[r][x]) {
        animatedLegs += 1;
      }

      const enclosed =
        r > 0 &&
        r < 5 &&
        !a[r][x] &&
        x > 0 &&
        x < width - 1 &&
        a[r][x - 1] &&
        a[r][x + 1] &&
        (a[r - 1][x] || a[r + 1][x]);

      if (enclosed) {
        eyes += 1;
      }
    }
  }

  for (let x = 0; x < width; x += 1) {
    feet += a[BITMAP_ROWS - 1][x] || b[BITMAP_ROWS - 1][x] ? 1 : 0;
  }

  const depthAvg = genome.rows.reduce((s, v) => s + v, 0) / BITMAP_ROWS;

  return {
    animatedLegs,
    density: filled / (width * BITMAP_ROWS),
    depthAvg,
    eyes,
    feet,
    filled,
  };
}

function planBody(genome, bits, tentacleNorm) {
  const g = genome.genes;

  if (genome.plan === 'invader') {
    return {
      agility: clamp01(
        (bits.animatedLegs / 8) * 0.6 + (bits.feet / 8) * 0.25 + 0.15
      ),
      mass: clamp01(
        bits.density *
          (0.55 + 0.45 * bits.depthAvg) *
          (0.8 + 0.4 * g.depth) *
          1.6
      ),
      perception: clamp01((bits.eyes / 4) * 0.75 + tentacleNorm * 0.3),
      sturdiness: clamp01(
        bits.density * 0.55 + bits.depthAvg * 0.3 + g.depth * 0.15
      ),
    };
  }

  if (genome.plan === 'blob') {
    return {
      agility: clamp01(
        g.ifsPulse * 0.5 + g.ifsTempo * 0.35 + (1 - g.ifsRadius) * 0.15
      ),
      mass: clamp01(g.ifsCount * 0.35 + g.ifsRadius * 0.45 + g.ifsBlend * 0.2),
      perception: clamp01(
        g.ifsRange * 0.5 + (bits.eyes / 4) * 0.2 + tentacleNorm * 0.3
      ),
      sturdiness: clamp01(
        g.ifsBlend * 0.45 + (1 - g.ifsRange) * 0.3 + g.ifsFalloff * 0.25
      ),
    };
  }

  return {
    agility: clamp01(
      g.swimUndulate * 0.4 + g.swimTail * 0.35 + (1 - g.swimFin) * 0.25
    ),
    mass: clamp01(g.swimWidth * 0.45 + g.swimFin * 0.3 + g.swimLength * 0.25),
    perception: clamp01(
      g.swimHead * 0.55 + tentacleNorm * 0.3 + (bits.eyes / 4) * 0.15
    ),
    sturdiness: clamp01(0.1 + g.swimFin * 0.25 + g.swimWidth * 0.15),
  };
}

export function tentacleCount(genome) {
  return Math.min(
    MAX_TENTACLES,
    Math.floor(genome.genes.tentacles * (MAX_TENTACLES + 1))
  );
}

export default function express(genome, world = {}) {
  const bits = bitmapFeatures(genome);
  const tentacles = tentacleCount(genome);
  const tentacleNorm = tentacles / MAX_TENTACLES;
  const body = planBody(genome, bits, tentacleNorm);
  const temperament = Object.fromEntries(
    TEMPERAMENT_GENES.map((name) => [name, genome.genes[name]])
  );
  const size = 0.55 + body.mass * 0.95;
  const speed =
    ((0.7 + body.agility * 2.4) / (0.75 + body.mass * 0.5)) *
    (1 - tentacleNorm * 0.15);
  const lifespan =
    (70 + 150 * temperament.lifespan) *
    (1.15 - body.mass * 0.3) *
    (world.lifespanScale ?? 1);
  const { hue } = genome.genes;
  const saturation = decode(genome, 'saturation');
  const lightness = decode(genome, 'lightness');

  return {
    body,
    colors: {
      accent: hslToRgb(
        (hue + decode(genome, 'accentShift') + 1) % 1,
        saturation,
        Math.min(0.8, lightness + 0.18)
      ),
      base: hslToRgb(hue, saturation, lightness),
    },
    features: { ...bits, tentacles },
    plan: genome.plan,
    stats: {
      armor: 0.1 + body.sturdiness * 0.9,
      attack:
        size *
          (0.15 + temperament.diet * 0.85) *
          (0.35 + temperament.aggression * 0.65) +
        tentacleNorm * 0.12,
      capacity: 1 + size,
      fertilityThreshold: 0.92 - temperament.fertility * 0.4,
      lifespan,
      maturity: lifespan * 0.16,
      metabolism:
        (0.05 + 0.08 * size * size + 0.02 * body.perception) *
        (world.metabolismScale ?? 1),
      sense: 2.5 + body.perception * 7.5,
      size,
      speed,
    },
    temperament,
  };
}
