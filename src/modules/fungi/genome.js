import {
  ARCHETYPE_GENES,
  ARCHETYPE_NAMES,
  NUMERIC_GENES,
  SURFACE_GENES,
} from './archetypes';
import { rollMycelium } from './mycelium';

const HYMENIA = ['gills', 'pores', 'teeth', 'ridges', 'smooth'];
const ROTS = ['collapse', 'deliquesce', 'wither'];
const SIGNED = new Set(['stipeTaper']);
const INTEGER = new Set(['gillCount', 'lobes', 'warts']);
const SURFACE = new Set(SURFACE_GENES);
const FLOOR = {
  capHeight: 0.04,
  capPower: 0.8,
  capRadius: 0.025,
  lobeSharp: 1,
  stipeRadius: 0.04,
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const GENE_SPAN = Object.fromEntries(
  NUMERIC_GENES.map((gene) => {
    const values = ARCHETYPE_NAMES.flatMap(
      (name) => ARCHETYPE_GENES[name][gene]
    );
    return [gene, [Math.min(...values), Math.max(...values)]];
  })
);

export function hslHex(h, s, l) {
  const hue = ((h % 1) + 1) % 1;
  const sat = clamp(s, 0, 1);
  const lit = clamp(l, 0, 1);
  const a = sat * Math.min(lit, 1 - lit);
  const channel = (n) => {
    const k = (n + hue * 12) % 12;
    const c = lit - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

function limitGene(gene, value, alien) {
  const [lo, hi] = GENE_SPAN[gene];
  const slack = (hi - lo) * 0.5 * alien;
  const floor = SIGNED.has(gene)
    ? lo - slack
    : Math.max(FLOOR[gene] ?? 0, lo - slack);
  const bounded = clamp(value, floor, hi + slack);
  if (gene === 'arc') return clamp(bounded, 0.2, 1);
  if (gene === 'closure') return clamp(bounded, 0, 0.95);
  if (gene === 'ringAt') return clamp(bounded, 0.05, 0.95);
  return INTEGER.has(gene) ? Math.round(bounded) : bounded;
}

function rollHsl(rng, [h0, h1, s0, s1, l0, l1], shift, alien) {
  return [
    rng.range(h0, h1) + shift,
    rng.range(s0, s1) + alien * rng.range(0, 0.35),
    rng.range(l0, l1),
  ];
}

function rollPalette(rng, primary, params, alien) {
  // A field-guide specimen keeps its field-guide colours; hue drifts only as
  // far as the roll is alien.
  const shift =
    params.paletteShift * alien +
    (alien > 0.3 ? rng.gauss() * alien * 0.35 : 0);
  const tone = (range) => hslHex(...rollHsl(rng, range, shift, alien));
  const glowHue =
    alien > 0.5 && rng.chance(alien) ? rng() : rng.range(0.28, 0.36);

  const threads =
    alien > 0.4 && rng.chance(alien * 0.6)
      ? hslHex(rng(), rng.range(0.4, 0.8), rng.range(0.55, 0.8))
      : hslHex(
          rng.range(0.08, 0.14),
          rng.range(0.05, 0.3),
          rng.range(0.82, 0.94)
        );
  const capHsl = rollHsl(rng, pick(rng, primary.palette.cap), shift, alien);
  const capTone = hslHex(...capHsl);
  const accentRange = Array.isArray(primary.palette.accent[0])
    ? pick(rng, primary.palette.accent)
    : primary.palette.accent;
  const zoneShift = rng.chance(0.5)
    ? rng.range(0.05, 0.15)
    : rng.range(0.4, 0.6);
  return {
    accent: tone(accentRange),
    bead: tone(accentRange),
    mycelium: primary.palette.mycelium
      ? tone(primary.palette.mycelium)
      : threads,
    cap: capTone,
    zone: hslHex(
      capHsl[0] + (rng.chance(0.6) ? rng.signed() * 0.04 : zoneShift),
      clamp(capHsl[1] + rng.signed() * 0.2, 0.05, 1),
      capHsl[2] > 0.5
        ? capHsl[2] - rng.range(0.3, 0.45)
        : capHsl[2] + rng.range(0.25, 0.4)
    ),
    glow: hslHex(glowHue, 0.9, 0.6),
    hymenium: tone(primary.palette.hymenium),
    spore: tone(primary.palette.spore),
    stipe: tone(primary.palette.stipe),
  };
}

// The traits no field guide lists; each is gated by how alien the roll is.
function rollAlienTraits(rng, genes, plan, alien) {
  const traits = { coil: 0, tiers: 1, twist: 0 };
  if (alien <= 0) return traits;

  if (plan === 'agaric' && rng.chance(alien * 0.3)) {
    traits.tiers = 2 + Math.floor(rng() * 3);
  }
  if (rng.chance(alien * 0.4)) traits.twist = rng.signed() * 1.6 * alien;
  if (plan !== 'bracket' && rng.chance(alien * 0.3)) {
    traits.coil = rng.range(0.3, 1) * alien;
  }
  if (rng.chance(alien * 0.5)) {
    Object.assign(genes, {
      lobeDepth: rng.range(0.1, 0.3),
      lobeSharp: rng.range(2, 6),
      lobes: 3 + Math.floor(rng() * 6),
    });
  }
  // One to three surface traits at the alien end, never all of them: a
  // specimen wearing every trait reads as noise rather than a species.
  const count = Math.floor(rng() * alien * 3.5);
  const pool = [...SURFACE_GENES];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const [gene] = pool.splice(Math.floor(rng() * pool.length), 1);
    Object.assign(genes, { [gene]: Math.max(genes[gene], rng.range(0.45, 1)) });
  }
  return traits;
}

// One genome for the whole cluster; members jitter it (memberGenome).
export function rollGenome(rng, params) {
  const alien = 1 - params.mycology;
  const name =
    params.archetype === 'auto' ? pick(rng, ARCHETYPE_NAMES) : params.archetype;
  const primary = ARCHETYPE_GENES[name];
  const partnerName = rng.chance(alien * 0.9)
    ? pick(
        rng,
        ARCHETYPE_NAMES.filter((other) => other !== name)
      )
    : name;
  const partner = ARCHETYPE_GENES[partnerName];
  const mix =
    partnerName === name ? 0 : rng.range(0.15, 0.5) * Math.min(1, alien * 1.5);

  const genes = Object.fromEntries(
    NUMERIC_GENES.map((gene) => {
      const own = rng.range(...primary[gene]);
      const other = rng.range(...partner[gene]);
      const [lo, hi] = GENE_SPAN[gene];
      const blended = lerp(own, other, mix);
      if (SURFACE.has(gene)) return [gene, Math.max(0, blended)];
      const mutated = blended + rng.gauss() * alien * 0.25 * (hi - lo);
      return [gene, limitGene(gene, mutated, alien)];
    })
  );

  let { hymenium } = primary;
  if (rng.chance(mix) || rng.chance(alien * 0.25)) {
    hymenium = rng.chance(0.5) ? partner.hymenium : pick(rng, HYMENIA);
  }
  const rot = rng.chance(alien * 0.4) ? pick(rng, ROTS) : primary.rot;
  const traits = rollAlienTraits(rng, genes, primary.plan, alien);
  const glows = params.glow > 0 || rng.chance(primary.glow + alien * 0.2);

  return {
    ...genes,
    ...traits,
    alien,
    archetype: name,
    glow: glows ? Math.max(params.glow, rng.range(0.4, 1)) : 0,
    hybrid: partnerName === name ? null : partnerName,
    hymenium: hymenium === 'gills' && genes.gillCount < 8 ? 'pores' : hymenium,
    habitHint: primary.habit ?? null,
    mycelium: rollMycelium(rng.fork('mycelium'), alien, primary.mycelium),
    palette: rollPalette(rng, primary, params, alien),
    plan: primary.plan,
    rot,
    size: params.size,
  };
}

// A member of the cluster: its own small variation on the shared genome, with
// every length made absolute for this member's scale.
export function memberGenome(genome, rng, variance, scale) {
  const jitter = (gene, amount = 0.12) => {
    const [lo, hi] = GENE_SPAN[gene];
    return limitGene(
      gene,
      genome[gene] + rng.gauss() * variance * amount * (hi - lo),
      genome.alien
    );
  };
  const size = genome.size * scale;
  const capRadius = size * jitter('capRadius', 0.06);

  return {
    ...genome,
    bend: jitter('bend', 0.4),
    capHeight: jitter('capHeight'),
    capPower: jitter('capPower'),
    capR: capRadius,
    stipeH: size * jitter('stipeHeight', 0.2),
    stipeR: capRadius * jitter('stipeRadius', 0.08),
  };
}
