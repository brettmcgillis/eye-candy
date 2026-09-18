import { botanyOf, pickForm } from './botany';
import FORMS from './formShapes';

const TAU = Math.PI * 2;

const HEADS = [
  'blob',
  'bowl',
  'fan',
  'umbel',
  'cone',
  'plume',
  'weep',
  'ring',
  'helix',
];
const EXTRAS = [...HEADS, 'spray', 'spray', 'spray'];

export const FIBER_STYLES = [
  'straight',
  'wiry',
  'fuzzy',
  'curly',
  'drooping',
  'kinked',
];
export const TIP_STYLES = ['starburst', 'hook', 'tassel'];

function pick(rng, options) {
  return options[Math.floor(rng() * options.length)];
}

function verticalFlip(point) {
  return [point[0], -point[1], -point[2]];
}

// `crownForm` names the form a plant is built from; `auto` is the old
// behaviour, where every head picked its own and a crown could end up an
// average of several.
function headForm(rng, options, chosen, botany) {
  if (chosen) {
    return chosen;
  }
  if (options.posture === 'weeping' && rng() < 0.6) {
    return 'weep';
  }

  return pickForm(rng, HEADS, botany);
}

// A named form repeats through the crown, but not slavishly: an occasional
// other form keeps it from reading as one stamped shape. With no form chosen
// the dice are untouched, so `auto` rolls exactly as it always did.
function extraForm(rng, extras, chosen, botany) {
  if (chosen && rng() < 0.65) {
    return chosen;
  }

  return pickForm(rng, extras, botany);
}

export default function composeForms(p, rng, options = {}) {
  const scale = options.size ?? 1;
  const R = p.crownRadius * scale;
  const botany = botanyOf(p);
  const chosen = HEADS.includes(p.crownForm) ? p.crownForm : null;
  const extras = options.allowSpray ? EXTRAS : HEADS;
  const count = Math.max(
    1,
    Math.round(p.formCount * Math.sqrt(scale) * rng.range(0.5, 1.6))
  );

  return Array.from({ length: count }, (_, i) => {
    const name =
      i === 0
        ? headForm(rng, options, chosen, botany)
        : extraForm(rng, extras, chosen, botany);
    const form = FORMS[name];
    const size = i === 0 ? R * rng.range(0.75, 1.15) : R * rng.range(0.3, 0.75);
    const shape = form.make(rng, size, p);
    const theta = rng() * TAU;
    const reach =
      i === 0 || form.side ? 0 : R * p.formSpread * rng.range(0.4, 1.2);
    const offset = shape.offset ?? [0, 0, 0];

    return {
      accent: i > 0 && rng() < p.accentAmount ? 1 : 0,
      anchor: form.side ? rng.range(p.crownBase, 0.92) : 1,
      density: form.density,
      lift: form.lift,
      mass: (size / p.crownRadius) ** 2 * (i === 0 ? 1.4 : 1),
      name,
      offset: [
        offset[0] + Math.cos(theta) * reach,
        offset[1] + (i === 0 ? 0 : rng.range(-0.3, 0.9) * reach),
        offset[2] + Math.sin(theta) * reach * 0.8,
      ],
      radii: shape.radii,
      sample: () => (theta < Math.PI ? verticalFlip(shape.sample()) : shape.sample()),
      unit: shape.unit
        ? (u, U) => {
            const point = shape.unit(u, U);

            return theta < Math.PI ? verticalFlip(point) : point;
          }
        : null,
      side: !!form.side,
      sideDirection: theta,
      size,
      style: rng() < p.styleVariety ? pick(rng, FIBER_STYLES) : 'straight',
      tint: rng(),
      tip: rng() < p.tipChance ? pick(rng, TIP_STYLES) : null,
    };
  });
}
