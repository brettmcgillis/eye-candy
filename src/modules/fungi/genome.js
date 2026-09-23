/* eslint-disable no-param-reassign */
import { ALIEN_SWITCHES, ARCHETYPE_GENES, ARCHETYPE_NAMES } from './archetypes';
import rollPalette from './palette';

const INTEGER = new Set([
  'count',
  'fibers',
  'fibrils',
  'grid',
  'levels',
  'lobeCount',
  'lobes',
  'pleats',
  'ridgeCount',
  'stalks',
  'steps',
  'terraces',
  'tiers',
  'veilPoints',
  'veilTiers',
]);
const FIXED = new Set([
  'color',
  'footLean',
  'lane',
  'feed',
  'funnel',
  'grid',
  'kill',
  'mode',
  'phase',
  'ring',
  'ringAt',
  'scaleColor',
  'shape',
  'veil',
  'steps',
  'surface',
  'wartColor',
]);

const PICK_WEIGHTS = {
  amanita: 1,
  arcyria: 0.8,
  bloom: 1.3,
  bonnet: 1,
  coral: 0.8,
  fan: 1.2,
  funnel: 0.9,
  honeycomb: 0.9,
  inkcap: 0.8,
  lattice: 1.2,
  mycena: 1,
  parasol: 0.7,
  reticulum: 1,
  stemonitis: 1,
  stinkhorn: 1.1,
  terrace: 0.8,
};

function pickArchetype(rng) {
  const total = ARCHETYPE_NAMES.reduce(
    (sum, n) => sum + (PICK_WEIGHTS[n] ?? 1),
    0
  );
  let roll = rng() * total;

  return (
    ARCHETYPE_NAMES.find((name) => {
      roll -= PICK_WEIGHTS[name] ?? 1;

      return roll < 0;
    }) ?? ARCHETYPE_NAMES[0]
  );
}

function resolve(spec, rng) {
  if (Array.isArray(spec) && spec.length === 2 && typeof spec[0] === 'number') {
    return rng.range(spec[0], spec[1]);
  }
  if (spec && typeof spec === 'object' && !Array.isArray(spec)) {
    return Object.fromEntries(
      Object.entries(spec).map(([key, value]) => [key, resolve(value, rng)])
    );
  }

  return spec;
}

function eachGene(genome, visit) {
  ['stipe', 'cap', 'gills', 'fan', 'reaction', 'spor', 'coral'].forEach(
    (part) => {
      if (!genome[part]) return;
      Object.keys(genome[part]).forEach((key) => visit(genome[part], key));
    }
  );
}

function roundIntegers(genome) {
  eachGene(genome, (part, key) => {
    if (INTEGER.has(key) && typeof part[key] === 'number') {
      part[key] = Math.max(0, Math.round(part[key]));
    }
  });

  return genome;
}

function blend(a, b, w) {
  ['stipe', 'cap', 'gills', 'fan', 'reaction', 'spor', 'coral'].forEach(
    (name) => {
      if (!a[name] || !b[name]) return;
      Object.keys(a[name]).forEach((key) => {
        const x = a[name][key];
        const y = b[name][key];

        if (typeof x === 'number' && typeof y === 'number' && !FIXED.has(key)) {
          a[name][key] = x + (y - x) * w;
        } else if (w > 0.5 && y !== undefined && key !== 'mode') {
          a[name][key] = y;
        }
      });
    }
  );
}

// Jitters every scaling gene by `amount`: member variance within a clump, or
// the alien end's drift away from the field guide.
export function mutate(genome, rng, amount) {
  const out = structuredClone(genome);

  if (amount <= 0) return out;
  eachGene(out, (part, key) => {
    const v = part[key];

    if (typeof v !== 'number' || FIXED.has(key)) return;
    part[key] = v * (1 + rng.gauss() * amount * 0.3);
  });

  return roundIntegers(out);
}

export function rollGenome(rng, params) {
  const mycology = params.mycology ?? 0.8;
  const archetype =
    params.archetype && params.archetype !== 'auto'
      ? params.archetype
      : pickArchetype(rng);
  const spec = ARCHETYPE_GENES[archetype] ?? ARCHETYPE_GENES.amanita;
  let genome = { ...resolve(spec, rng), archetype };
  const alien = 1 - mycology;

  if (rng() < alien * 1.3) {
    const partners = ARCHETYPE_NAMES.filter(
      (name) => name !== archetype && ARCHETYPE_GENES[name].plan === spec.plan
    );

    if (partners.length > 0) {
      const partner = partners[Math.floor(rng() * partners.length)];

      blend(
        genome,
        resolve(ARCHETYPE_GENES[partner], rng),
        rng.range(0.1, 0.35 + alien * 0.5)
      );
      genome.hybrid = partner;
    }
  }

  genome = mutate(genome, rng, alien);

  const switches = ALIEN_SWITCHES[genome.plan] ?? [];
  const flips = Math.floor(alien * rng.range(0.4, 3.2));

  for (let i = 0; i < flips && switches.length > 0; i += 1) {
    switches[Math.floor(rng() * switches.length)](genome, rng);
  }

  genome.mycology = mycology;
  genome.size = params.size ?? 2.4;
  genome.glow = params.glow ?? 0;
  genome.palette = rollPalette(rng.fork('palette'), {
    glow: genome.glow,
    mycology,
    paletteShift: params.paletteShift ?? 0,
    hint: spec.palettes,
    plan: genome.plan,
  });

  return roundIntegers(genome);
}
