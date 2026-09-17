const TRAITS = {
  branching: ['single', 'fork', 'candelabra', 'umbellate', 'alternate'],
  posture: ['upright', 'nodding', 'weeping', 'leaning'],
  stature: ['regular', 'tall', 'squat'],
  vigor: ['regular', 'sparse', 'lush'],
};

const STATURE = {
  regular: {},
  squat: { crownRadius: 1.2, stemCurve: 0.5, stemHeight: 0.6 },
  tall: { crownRadius: 0.8, stemHeight: 1.35 },
};

const VIGOR = {
  lush: { shellBias: 1.25, tips: 1.45 },
  regular: {},
  sparse: { fiberStep: 1.4, ornamentDensity: 1.3, sheaf: 0.7, tips: 0.45 },
};

function pick(rng, options) {
  return options[Math.floor(rng() * options.length)];
}

function scaled(p, multipliers) {
  const next = { ...p };

  Object.entries(multipliers).forEach(([key, factor]) => {
    next[key] = p[key] * factor;
  });

  return next;
}

export default function rollHabit(p, rng) {
  const roll = (trait) =>
    rng() < p.habitVariety ? pick(rng, TRAITS[trait]) : TRAITS[trait][0];
  const habit = {
    bracts: rng() < p.habitVariety * 0.6,
    branching: roll('branching'),
    posture: roll('posture'),
    stature: roll('stature'),
    stemLeaves: rng() < p.habitVariety * 0.5 ? Math.floor(rng.range(2, 7)) : 0,
    tendrils: rng() < p.habitVariety * 0.35 ? Math.floor(rng.range(1, 4)) : 0,
    vigor: roll('vigor'),
  };
  let shaped = scaled(p, STATURE[habit.stature]);

  shaped = scaled(shaped, VIGOR[habit.vigor]);
  shaped.tips = Math.round(shaped.tips);
  shaped.shellBias = Math.min(1, shaped.shellBias);
  shaped.ornamentDensity = Math.min(1, shaped.ornamentDensity);

  if (habit.vigor === 'lush') {
    shaped.umbelSize = p.umbelSize + 1;
  } else if (habit.vigor === 'sparse') {
    shaped.umbelSize = Math.max(1, p.umbelSize - 1);
  }

  return { habit, p: shaped };
}
