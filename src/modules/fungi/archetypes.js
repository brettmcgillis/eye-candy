/* eslint-disable no-param-reassign */
// Gene ranges per archetype. A [min, max] pair rolls, a bare value is fixed.
// Every archetype of a plan carries that plan's full gene set, so a hybrid can
// inherit any of them; `habit` hints how members gather.
const CURVE = {
  footLean: 1.3,
  lane: [0, 1],
  sway: [0.03, 0.08],
  swayPhase: [0, 6.28],
  swayShift: [0, 6.28],
  wobble: [0.02, 0.05],
};

const STIPE = {
  ...CURVE,
  apexFlare: [0.15, 0.35],
  bendX: [-0.5, 0.5],
  bendZ: [-0.5, 0.5],
  bulb: [0.1, 0.4],
  fibers: 120,
  hairLength: 1,
  hairs: 0,
  height: [4, 6],
  radius: [0.25, 0.35],
  ring: 0,
  ringAt: 0.72,
  ringFlare: 0.12,
  ringLength: 0.1,
  taper: [0, 0.2],
  twist: [-0.04, 0.04],
  veil: 0,
  veilBeads: 0,
  veilDensity: 700,
  veilFlare: 1.5,
  veilKick: 0.4,
  veilLength: 0.4,
  veilPoints: 7,
  veilScallop: 0.25,
  veilTiers: 1,
  volva: 0,
  wrinkle: [0.01, 0.04],
};

const CAP = {
  curl: [0, 0.2],
  dip: 0,
  dome: [1.6, 2.4],
  fibrilWidth: [1, 1.2],
  fibrils: 1300,
  flare: 1,
  fringe: 0,
  fringeBeads: 0,
  fringeLength: 0.6,
  height: [0.5, 0.9],
  latticeFrom: 0.3,
  lobeAmp: [0.02, 0.06],
  lobes: [1.5, 3],
  netBeads: 0,
  netDensity: 1200,
  netGradient: 1,
  netLoops: 0.6,
  netStretch: 1.6,
  phase: [0, 6.28],
  pleatAmp: 0,
  pleats: 0,
  radius: [2, 2.6],
  ruffle: [0, 0.02],
  ruffleCount: [5, 11],
  scaleColor: 0.62,
  scales: 0,
  shade: 1,
  surface: 'fibril',
  tendrils: 0,
  thickness: [0.1, 0.16],
  twist: [-0.15, 0.15],
  umbo: 0,
  wander: [0.3, 0.8],
  wartColor: 0.1,
  warts: 0,
  wartSize: 0.025,
  wrinkle: [0.1, 0.4],
};

const GILLS = {
  color: 0.5,
  count: [110, 170],
  depth: [0.12, 0.18],
  thickness: [0.16, 0.24],
  wave: [0, 0.15],
  waveFreq: [6, 14],
};

const FAN = {
  ...CURVE,
  backing: 2.5,
  cup: [0.05, 0.2],
  funnel: 0,
  lobeAmp: [0.08, 0.18],
  lobeCount: [2, 4],
  lobes: [1, 3],
  lobeSpread: [0.6, 1.4],
  netBeads: 0,
  netDensity: 700,
  netGradient: 0.2,
  netLoops: 1,
  netStretch: 1.2,
  radius: [1.8, 2.6],
  ridgeCount: 22,
  ridgeGap: 0.012,
  ridgeHeight: [0.05, 0.09],
  ridgeWave: [0.1, 0.3],
  rise: [0.55, 0.85],
  ruffle: [0.04, 0.1],
  ruffleCount: [6, 12],
  span: [1.8, 2.6],
  split: [0.3, 0.8],
  stalk: [0.4, 1],
  stalkRadius: [0.1, 0.17],
  surface: 'ridges',
  hairs: 0,
};

const REACTION = {
  domain: 5,
  feed: 0.042,
  flare: [0.2, 0.6],
  grid: 160,
  height: [4, 6],
  kill: 0.061,
  levels: 110,
  mode: 'bloom',
  rings: 0,
  seedRadius: [0.05, 0.08],
  steps: 30,
};

const agaric = (genes, extra = {}) => ({
  cap: { ...CAP, ...genes.cap },
  gills: { ...GILLS, ...genes.gills },
  plan: 'agaric',
  stipe: { ...STIPE, ...genes.stipe },
  ...extra,
});

export const ARCHETYPE_GENES = {
  amanita: agaric(
    {
      cap: {
        curl: [0.1, 0.25],
        height: [0.55, 0.85],
        radius: [2.3, 2.9],
        warts: [0.7, 1.1],
      },
      gills: { count: [140, 180] },
      stipe: {
        bulb: [0.6, 1],
        fibers: 160,
        radius: [0.32, 0.42],
        ring: 1,
        taper: [0.05, 0.15],
        volva: [0.4, 0.8],
      },
    },
    { habit: 'solitary' }
  ),
  mycena: agaric(
    {
      cap: {
        dome: [2.6, 3.4],
        fibrils: 800,
        flare: [0.65, 0.8],
        height: [0.9, 1.3],
        pleatAmp: [0.03, 0.06],
        pleats: [16, 30],
        radius: [0.7, 1],
        thickness: [0.06, 0.09],
        umbo: [0, 0.15],
      },
      gills: { count: [34, 54], depth: [0.22, 0.3] },
      stipe: {
        apexFlare: [0.2, 0.4],
        bendX: [-1.2, 1.2],
        bendZ: [-1.2, 1.2],
        bulb: [0, 0.2],
        fibers: 70,
        hairs: [0.2, 0.8],
        sway: [0.06, 0.14],
        wobble: [0.04, 0.08],
        height: [5.5, 8],
        radius: [0.09, 0.13],
        taper: [-0.15, 0],
      },
    },
    { habit: 'clump' }
  ),
  parasol: agaric(
    {
      cap: {
        dome: [2, 3],
        height: [0.25, 0.45],
        radius: [2.6, 3.2],
        scaleColor: [0.6, 0.66],
        scales: [0.7, 1.1],
        umbo: [0.4, 0.8],
      },
      gills: { count: [160, 200], depth: [0.09, 0.13] },
      stipe: {
        bulb: [0.6, 0.9],
        height: [6, 8],
        radius: [0.18, 0.24],
        ring: 1,
        ringFlare: 0.06,
        ringLength: 0.04,
        taper: [0.15, 0.3],
      },
    },
    { habit: 'solitary' }
  ),
  inkcap: agaric(
    {
      cap: {
        curl: [-0.05, 0.05],
        dome: [1.3, 1.8],
        flare: [0.5, 0.65],
        height: [1.8, 2.4],
        radius: [1, 1.3],
        scaleColor: 0.66,
        scales: [0.5, 0.9],
      },
      gills: { color: 0.48, count: [90, 130], depth: [0.3, 0.4] },
      stipe: {
        bulb: [0.1, 0.3],
        height: [4.5, 6],
        radius: [0.22, 0.28],
        taper: [0.05, 0.15],
      },
    },
    { habit: 'clump' }
  ),
  bonnet: agaric(
    {
      cap: {
        curl: [0.3, 0.5],
        dome: [1.2, 1.6],
        fibrils: 1000,
        fringe: [0.6, 1],
        fringeLength: [0.25, 0.4],
        height: [0.6, 0.9],
        pleatAmp: [0.04, 0.08],
        pleats: [40, 70],
        radius: [1.3, 1.8],
      },
      gills: { count: [80, 110], depth: [0.2, 0.28] },
      stipe: {
        bulb: [0.1, 0.3],
        fibers: 90,
        hairs: [0.3, 0.6],
        hairLength: 0.6,
        height: [5, 7],
        radius: [0.13, 0.18],
        volva: [0.8, 1.2],
        wrinkle: [0.05, 0.12],
      },
    },
    { habit: 'troop' }
  ),
  lattice: agaric(
    {
      cap: {
        curl: [-0.45, -0.2],
        dome: [1.2, 1.6],
        fringe: [0.7, 1.1],
        fringeBeads: [0.6, 0.9],
        fringeLength: [0.3, 0.55],
        height: [0.8, 1.1],
        latticeFrom: [0.2, 0.34],
        netBeads: [0.05, 0.2],
        netDensity: [420, 700],
        netGradient: [0.6, 1.1],
        netLoops: [0.55, 0.85],
        netStretch: [1.5, 2.2],
        radius: [2.4, 3],
        surface: 'lattice',
        tendrils: [0.25, 0.5],
      },
      gills: { count: 0 },
      stipe: {
        bulb: [0.4, 0.8],
        height: [3.2, 4.2],
        radius: [0.3, 0.4],
        taper: [0.25, 0.45],
      },
    },
    { habit: 'solitary' }
  ),
  stinkhorn: agaric(
    {
      cap: {
        curl: 0,
        dome: [1.2, 1.5],
        fibrils: 900,
        flare: [0.5, 0.62],
        height: [1.3, 1.7],
        lobeAmp: [0.01, 0.03],
        netDensity: [140, 240],
        radius: [0.85, 1.05],
        surface: 'gleba',
        thickness: [0.12, 0.16],
        wrinkle: [0.3, 0.6],
      },
      gills: { count: 0 },
      stipe: {
        apexFlare: [0, 0.1],
        bulb: [0.1, 0.25],
        fibers: 150,
        height: [5, 6.5],
        radius: [0.3, 0.38],
        taper: [-0.1, 0.05],
        sway: [0.01, 0.04],
        veil: 1,
        veilBeads: [0.08, 0.25],
        veilDensity: [520, 820],
        veilFlare: [2.2, 3.2],
        veilKick: [0.5, 1.2],
        veilLength: [0.36, 0.42],
        veilPoints: [5, 9],
        veilScallop: [0.3, 0.55],
        veilTiers: [1.2, 2.6],
        volva: [0.9, 1.3],
        wrinkle: [0.06, 0.12],
      },
    },
    {
      habit: 'solitary',
      palettes: [
        ['#f1eee4', '#f5f2e9', '#f4f0e3', '#3f3d22', '#f6f3ea'],
        ['#f0ece0', '#f4f0e6', '#f2c24a', '#3b3620', '#f3ecd8'],
        ['#efe9dc', '#f3ede2', '#f0853a', '#3a2f1c', '#f2e6d4'],
        ['#f2ece6', '#f5efe9', '#e897a6', '#3d3322', '#f6eee9'],
      ],
    }
  ),
  stemonitis: {
    habit: 'solitary',
    palettes: [
      ['#cfd0cb', '#16100d', '#2a1a12', '#5a3220', '#8c5a3a'],
      ['#d6d4cc', '#1a1512', '#3a2418', '#6e4128', '#a0714c'],
    ],
    plan: 'sporangia',
    spor: {
      colony: [0.7, 1.2],
      height: [3.4, 4.6],
      lean: [0.05, 0.25],
      netDensity: [260, 400],
      netGradient: 0.5,
      netStretch: 1,
      radius: [0.09, 0.13],
      shape: 'cylinder',
      sporangium: [0.6, 0.72],
      stalks: [28, 56],
    },
  },
  arcyria: {
    habit: 'solitary',
    palettes: [
      ['#d2cfc8', '#7a2e30', '#a63c46', '#df6b78', '#f4a4ae'],
      ['#d4d0c6', '#8a5a1e', '#c0822a', '#e8b04a', '#f6d88a'],
    ],
    plan: 'sporangia',
    spor: {
      colony: [0.6, 1],
      height: [1.6, 2.4],
      lean: [0.05, 0.2],
      netDensity: [260, 380],
      netGradient: 0.5,
      netStretch: [1.3, 1.8],
      radius: [0.15, 0.21],
      shape: 'egg',
      sporangium: [0.45, 0.6],
      stalks: [14, 30],
    },
  },
  fan: {
    fan: { ...FAN },
    habit: 'solitary',
    plan: 'fan',
  },
  funnel: {
    fan: {
      ...FAN,
      cup: [0.25, 0.4],
      funnel: 1,
      lobeCount: [4, 8],
      lobes: 1,
      radius: [1.4, 2],
      ridgeCount: 40,
      rise: [0.3, 0.55],
      span: 6.283,
      split: [0, 0.2],
      stalk: [0.8, 1.6],
    },
    habit: 'troop',
    plan: 'fan',
  },
  honeycomb: {
    fan: {
      ...FAN,
      cup: [0.02, 0.1],
      lobes: 1,
      netBeads: 0,
      netDensity: [260, 420],
      radius: [1.6, 2.2],
      rise: [0.85, 1],
      ruffle: [0.02, 0.05],
      span: [2.6, 3.4],
      stalk: [1.8, 2.8],
      stalkRadius: [0.16, 0.22],
      surface: 'pores',
    },
    habit: 'troop',
    plan: 'fan',
  },
  reticulum: {
    fan: {
      ...FAN,
      backing: 0,
      cup: [0.05, 0.25],
      hairs: 0,
      lobes: [1, 3],
      netBeads: [0.25, 0.6],
      netDensity: [1400, 2200],
      netGradient: [-1.4, -0.6],
      netLoops: [0.35, 0.65],
      netStretch: [1.6, 2.4],
      radius: [2.4, 3.2],
      rise: [0.75, 1],
      ruffle: [0.08, 0.16],
      span: [2, 3],
      stalk: [0.2, 0.6],
      surface: 'net',
    },
    habit: 'solitary',
    plan: 'fan',
  },
  bloom: {
    habit: 'solitary',
    palettes: [
      ['#4a3238', '#9c6f76', '#dcaaa6', '#f0d4c6', '#f6ead6'],
      ['#34313f', '#6f6a88', '#b3aec8', '#e2d9e6', '#f4eadb'],
      ['#3a2a22', '#8a6a52', '#d4b08e', '#efd9bb', '#f8eedc'],
    ],
    plan: 'reaction',
    reaction: {
      ...REACTION,
      feed: 0.037,
      fibers: 900,
      grid: 128,
      height: [3, 4.5],
      iterations: [1800, 2600],
      kill: 0.06,
      droop: [0.12, 0.32],
      lobeAmp: [0.14, 0.28],
      lobeCount: [4, 8],
      maze: [0.7, 1.3],
      mode: 'bloom',
      radius: [2.3, 2.9],
      ruffle: [0.05, 0.12],
      ruffleCount: [5, 9],
      stalk: [0.5, 1],
      stalkRadius: [0.28, 0.4],
      step: [0.01, 0.018],
      terraces: [16, 26],
      thickness: [0.02, 0.035],
      tierShrink: [0.6, 0.74],
      tiers: [2.6, 4.4],
    },
  },
  coral: {
    coral: {
      angle: [0.34, 0.55],
      crest: [0, 0.6],
      depth: [6, 7.4],
      fibers: 110,
      firstLength: [0.9, 1.2],
      height: [4.5, 6],
      reach: [1.4, 2.1],
      shrink: [0.74, 0.84],
      taper: [0.7, 0.77],
      tipTaper: [0.25, 0.45],
      triple: [0.2, 0.45],
      trunk: [0.26, 0.34],
      trunkLength: [1, 1.4],
      twist: [-0.3, 0.3],
      upturn: [0.2, 0.45],
    },
    habit: 'solitary',
    palettes: [
      ['#efe6d6', '#f2d7b0', '#eeb46a', '#e8913a', '#f6d26a'],
      ['#f0e9df', '#ecc9c0', '#e3949a', '#d8667a', '#f3d27a'],
      ['#ece6e6', '#d9c6d8', '#b68fc2', '#8c5aa8', '#c9a6e0'],
      ['#f3efe6', '#efe6d2', '#e8dcc0', '#d9c8a2', '#f6f0e2'],
    ],
    plan: 'coral',
  },
  terrace: {
    habit: 'solitary',
    plan: 'reaction',
    reaction: {
      ...REACTION,
      domain: 7,
      feed: 0.0545,
      grid: 128,
      height: [0.35, 0.7],
      kill: 0.062,
      levels: 150,
      mode: 'terrace',
      rings: [5, 9],
      steps: 40,
    },
  },
};

export const ARCHETYPE_NAMES = Object.keys(ARCHETYPE_GENES);

// Genes that switch a structure on rather than scale it. The alien end turns
// one or two of these on; field-guide specimens keep their archetype's own.
export const ALIEN_SWITCHES = {
  agaric: [
    (g, rng) => {
      g.cap.surface = 'lattice';
      g.cap.latticeFrom = rng.range(0.2, 0.45);
      g.cap.tendrils = rng.range(0.2, 0.7);
      g.gills.count = 0;
    },
    (g, rng) => {
      g.cap.fringe = rng.range(0.5, 1.2);
      g.cap.fringeBeads = rng.range(0.4, 1);
      g.cap.fringeLength = rng.range(0.4, 0.9);
    },
    (g, rng) => {
      g.cap.pleats = Math.round(rng.range(12, 60));
      g.cap.pleatAmp = rng.range(0.04, 0.1);
    },
    (g, rng) => {
      g.stipe.twist = rng.range(0.2, 0.6) * (rng.chance(0.5) ? 1 : -1);
      g.cap.twist = rng.range(0.4, 1.2) * (rng.chance(0.5) ? 1 : -1);
    },
    (g, rng) => {
      g.stipe.hairs = rng.range(0.6, 1.4);
      g.stipe.hairLength = rng.range(1, 2.5);
    },
    (g, rng) => {
      g.cap.warts = rng.range(0.5, 1.2);
      g.cap.wartSize = rng.range(0.02, 0.05);
      g.cap.wartColor = rng.chance(0.5) ? 1 : 0.1;
    },
  ],
  fan: [
    (g, rng) => {
      g.fan.hairs = rng.range(0.5, 1.2);
    },
    (g, rng) => {
      g.fan.ruffle = rng.range(0.12, 0.25);
    },
    (g, rng) => {
      g.fan.netBeads = rng.range(0.2, 0.6);
    },
    (g, rng) => {
      g.fan.split = rng.range(0.8, 1);
      g.fan.ridgeWave = rng.range(0.4, 0.8);
    },
  ],
  sporangia: [
    (g, rng) => {
      g.spor.lean = rng.range(0.3, 0.6);
    },
    (g, rng) => {
      g.spor.netDensity *= rng.range(1.5, 2.5);
    },
  ],
  reaction: [
    (g, rng) => {
      if (g.reaction.mode === 'bloom')
        g.reaction.ruffle = rng.range(0.14, 0.22);
      else g.reaction.rings = rng.range(9, 14);
    },
    (g, rng) => {
      if (g.reaction.mode === 'bloom') g.reaction.maze = rng.range(1.4, 2.2);
      else g.reaction.seedRadius = rng.range(0.1, 0.16);
    },
  ],
  coral: [
    (g, rng) => {
      g.coral.twist = rng.range(1, 2.5) * (rng.chance(0.5) ? 1 : -1);
    },
    (g, rng) => {
      g.coral.crest = 1;
      g.coral.tipTaper = rng.range(0.5, 0.8);
    },
    (g, rng) => {
      g.coral.angle = rng.range(0.6, 0.85);
      g.coral.upturn = rng.range(0.05, 0.15);
    },
  ],
};
