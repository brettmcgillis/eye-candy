// The alien/earthly axis: 0 is Flora's free-form growth, 1 pulls a plant
// toward how a real one is built, and between is a mix. It is a bias on the
// parameters and on the dice — not a separate generator — so every other
// control keeps working exactly as it did.
//
// What "earthly" means here, concretely: one inflorescence rather than an
// average of several, tips in a real arrangement rather than a cloud,
// proportions that hold between stem and crown, leaves and an involucre
// present, a modest stem, and ornaments that read as florets rather than dice.

// Forms a real plant would be built from, weighted by how common the
// arrangement is; a ring or a helix is not a thing a flower does.
const EARTHLY_FORMS = {
  blob: 1,
  bowl: 3,
  capitulum: 3.4,
  cone: 2.5,
  corymb: 2.8,
  doubleHelix: 0.04,
  fan: 1.5,
  helix: 0.08,
  bottlebrush: 1.8,
  panicle: 2.4,
  plume: 2,
  protea: 1.9,
  raceme: 2.6,
  ring: 0.12,
  spray: 1,
  spadix: 2.1,
  thistle: 1.8,
  trihelix: 0.05,
  umbel: 3,
  weep: 1.5,
};

// Ornaments a flower could plausibly carry: petals and hearts read as florets,
// spheres as buds or berries; the dice are the alien end.
const EARTHLY_SHAPES = {
  d10: 0.05,
  d12: 0.05,
  d20: 0.15,
  d4: 0.05,
  d6: 0.05,
  d8: 0.1,
  heart: 1.2,
  petal: 2.5,
  sphere: 1.5,
};

export const botanyOf = (p) => Math.min(1, Math.max(0, p.botany ?? 0));

const mix = (from, to, t) => from + (to - from) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Weight a name list by how earthly each option is, so the dice drift toward
// real arrangements as the axis rises rather than switching over at a
// threshold.
export function weightedPick(rng, names, weights, botany) {
  const scored = names.map((name) => ({
    name,
    weight: mix(1, weights[name] ?? 1, botany),
  }));
  const total = scored.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;

  return (
    scored.find((item) => {
      roll -= item.weight;

      return roll < 0;
    }) ?? scored[scored.length - 1]
  ).name;
}

export const pickForm = (rng, names, botany) =>
  weightedPick(rng, names, EARTHLY_FORMS, botany);

export const shapeWeight = (shape, botany) =>
  mix(1, EARTHLY_SHAPES[shape] ?? 1, botany);

// Allometry and habit: a real plant's crown is a fraction of its stem, its
// forms are one plan, its tips are arranged, and it carries leaves.
export default function applyBotany(params) {
  const b = botanyOf(params);

  if (b <= 0) {
    return params;
  }

  const to = (value, target) => mix(value, target, b);

  return {
    ...params,
    asymmetry: to(params.asymmetry, 0.18),
    // An involucre is part of the plan, not an accident.
    bractSize: to(params.bractSize, 0.16),
    crownLift: to(params.crownLift, 0.55),
    crownRadius: to(
      params.crownRadius,
      clamp(params.stemHeight * 0.36, 1.2, 4)
    ),
    crownStretch: to(params.crownStretch, 1),
    // Earthly means arranged: the lattice is the whole point of the axis.
    crownStructure: to(params.crownStructure, 1),
    formCount: Math.max(1, Math.round(to(params.formCount, 1))),
    formSpread: to(params.formSpread, 0.35),
    leafBlades: Math.round(
      to(params.leafBlades, Math.max(2, params.leafBlades))
    ),
    ornamentSize: to(params.ornamentSize, 0.045),
    stemCurve: to(params.stemCurve, 0.12),
    stemWaves: to(params.stemWaves, 0.4),
    styleVariety: to(params.styleVariety, 0.25),
    tipChance: to(params.tipChance, 0.12),
    warp: to(params.warp, 0.1),
    wispChance: to(params.wispChance, 0.004),
  };
}
