// Every knob ExhibitA's renderers accept, declared once
// (docs/exhibit-a-pipeline.md). The scene's Leva folders are generated from
// it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema from '../optionSchema/index.mjs';

export const FAMILIES = [
  'fractal',
  'algebraic',
  'surface',
  'attractor',
  'knot',
  'strings',
  'polytope',
  'apollian',
];

export const FAMILY_LABELS = {
  algebraic: 'Algebraic Surface',
  apollian: 'Apollian (Guest)',
  attractor: 'Strange Attractor',
  fractal: 'Escape-Time Fractal',
  knot: 'Knot & Fibration',
  polytope: '4D Polytope',
  strings: 'String Model',
  surface: 'Classical Surface',
};

// Each family's exhibits. An exhibit id is unique across families, so a
// config names its exhibit as `config[`${family}Kind`]`.
export const EXHIBITS = {
  algebraic: ['kummer', 'clebsch', 'barth'],
  apollian: ['apollian4', 'kleinian'],
  attractor: [
    'lorenz',
    'rossler',
    'aizawa',
    'thomas',
    'halvorsen',
    'dadras',
    'chenLee',
    'fourWing',
  ],
  fractal: ['mandelbulb', 'quatJulia', 'mandelbox', 'menger', 'kifs'],
  knot: ['torusKnot', 'lissajous', 'hopf'],
  polytope: ['cell5', 'tesseract', 'cell16', 'cell24', 'cell120', 'cell600'],
  strings: ['hyperboloid', 'paraboloid', 'conoid', 'helicoid'],
  surface: ['boy', 'klein', 'enneper', 'dini', 'kuen', 'breather', 'seashell'],
};

export const EXHIBIT_LABELS = {
  aizawa: 'Aizawa',
  apollian4: '4D Apollian',
  barth: 'Barth Sextic',
  boy: "Boy's Surface",
  breather: 'Breather',
  cell120: '120-Cell',
  cell16: '16-Cell',
  cell24: '24-Cell',
  cell5: '5-Cell',
  cell600: '600-Cell',
  chenLee: 'Chen–Lee',
  clebsch: 'Clebsch Cubic',
  conoid: 'Plücker Conoid',
  dadras: 'Dadras',
  dini: "Dini's Surface",
  enneper: 'Enneper',
  fourWing: 'Four-Wing',
  halvorsen: 'Halvorsen',
  helicoid: 'Ruled Helicoid',
  hopf: 'Hopf Fibration',
  hyperboloid: 'Hyperboloid',
  kifs: 'Octahedral KIFS',
  klein: 'Klein Bottle',
  kleinian: 'Pseudo-Kleinian',
  kuen: "Kuen's Surface",
  kummer: 'Kummer Quartic',
  lissajous: 'Lissajous Knot',
  lorenz: 'Lorenz',
  mandelbox: 'Mandelbox',
  mandelbulb: 'Mandelbulb',
  menger: 'Menger Sponge',
  paraboloid: 'Hyperbolic Paraboloid',
  quatJulia: 'Quaternion Julia',
  rossler: 'Rössler',
  seashell: 'Seashell',
  tesseract: 'Tesseract',
  thomas: 'Thomas',
  torusKnot: 'Torus Knot',
};

// How each family is drawn: `field` is ray-marched in a depth-writing proxy,
// the rest are meshes the kernel builds (tubes, thickened shells).
export const FAMILY_KINDS = {
  algebraic: 'field',
  apollian: 'field',
  attractor: 'curve',
  fractal: 'field',
  knot: 'curve',
  polytope: 'wire',
  strings: 'strings',
  surface: 'surface',
};

export const MATERIALS = [
  'plaster',
  'marble',
  'bronze',
  'steel',
  'brass',
  'ceramic',
  'painted',
];
export const PLINTHS = ['column', 'block', 'turned', 'none'];
export const ALGEBRAIC_SIDES = ['solid', 'inverse', 'shell'];
export const KLEIN_FORMS = ['bottle', 'figure8'];
export const PROJECTIONS_4D = ['perspective', 'stereographic'];
export const A4_SHAPES = ['sheets', 'tubes'];
export const GUEST_BOUNDS = ['sphere', 'disc', 'cube'];
export const VIEWS = ['hero', 'front', 'side', 'top'];
export const VIDEO_MODES = ['turntable', 'sweep', 'evolve', 'draw'];
export const MOTION_MODES = ['off', 'turntable', 'sweep', 'evolve', 'draw'];
export const PROJECTIONS = ['perspective', 'orthographic'];

// Degrees round the object from +x toward +z, and up.
export const VIEW_AZIMUTHS = { front: 90, hero: 55, side: 0, top: 90 };
export const VIEW_ELEVATIONS = { front: 8, hero: 24, side: 8, top: 89 };

export const kindKey = (family) => `${family}Kind`;
export const exhibitOf = (config) => config[kindKey(config.family)];

function spec(type, section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type,
    ...extra,
  };
}

const num = (section, group, label, value, min, max, step, extra = {}) =>
  spec('number', section, group, label, value, {
    max,
    min,
    placeholder: 'N',
    step,
    ...extra,
  });
const choice = (section, group, label, choices, value, extra = {}) =>
  spec('enum', section, group, label, value, {
    choices,
    help: `${label}: ${choices.join(', ')}`,
    ...extra,
  });
const flag = (section, group, label, value, extra = {}) =>
  spec('boolean', section, group, label, value, extra);
const color = (section, group, label, value, extra = {}) =>
  spec('color', section, group, label, value, extra);

const inFacet = (facet, item) => ({ ...item, facet });
const rolled = (facet, [min, max], item) => ({
  ...item,
  facet,
  roll: { max, min, step: item.step },
});
const sceneOnly = (item) => ({ ...item, sceneOnly: true });

const isFamily = (family) => ({ family: [family] });
const isExhibit = (family, ...ids) => ({
  family: [family],
  [kindKey(family)]: ids,
});

// One exhibit's parameter: in the form facet, grouped under the exhibit's
// label, shown only while that exhibit is on the plinth. `roll` is the
// art-directed window the form roll draws from.
function param(family, id, label, value, min, max, step, roll, extra = {}) {
  const item = num('form', EXHIBIT_LABELS[id], label, value, min, max, step, {
    exhibit: id,
    when: isExhibit(family, id),
    ...extra,
  });
  return roll ? rolled('form', roll, item) : inFacet('form', item);
}

// A parameter shared by every exhibit of one family.
function familyParam(family, label, value, min, max, step, roll, extra = {}) {
  const item = num(
    'form',
    FAMILY_LABELS[family],
    label,
    value,
    min,
    max,
    step,
    {
      when: isFamily(family),
      ...extra,
    }
  );
  return roll ? rolled('form', roll, item) : inFacet('form', item);
}

const form = (item) => inFacet('form', item);

const KIND_KEYS = Object.fromEntries(
  FAMILIES.map((family) => [
    kindKey(family),
    form(
      choice('form', null, 'Exhibit', EXHIBITS[family], EXHIBITS[family][0], {
        optionLabels: EXHIBIT_LABELS,
        when: isFamily(family),
      })
    ),
  ])
);

const FRACTAL = {
  fractalZoom: familyParam('fractal', 'Zoom', 1, 0.5, 4, 0.01, null, {
    help: 'Above 1 the ball cuts into the fractal, as a museum section would',
  }),
  bulbPower: param('fractal', 'mandelbulb', 'Power', 8, 2, 16, 0.01, [3, 10]),
  bulbIterations: param('fractal', 'mandelbulb', 'Iterations', 10, 2, 24, 1),
  bulbPhase: param(
    'fractal',
    'mandelbulb',
    'Phase',
    0,
    -180,
    180,
    0.5,
    [-30, 30],
    { help: 'Offsets the polar angle each iteration: twists the bulb' }
  ),
  juliaCX: param(
    'fractal',
    'quatJulia',
    'C x',
    -0.205,
    -1,
    1,
    0.001,
    [-0.5, 0.2]
  ),
  juliaCY: param(
    'fractal',
    'quatJulia',
    'C y',
    -0.327,
    -1,
    1,
    0.001,
    [-0.6, 0.6]
  ),
  juliaCZ: param(
    'fractal',
    'quatJulia',
    'C z',
    0.077,
    -1,
    1,
    0.001,
    [-0.6, 0.6]
  ),
  juliaCW: param(
    'fractal',
    'quatJulia',
    'C w',
    0.204,
    -1,
    1,
    0.001,
    [-0.6, 0.6]
  ),
  juliaSlice: param(
    'fractal',
    'quatJulia',
    'Slice w',
    0,
    -1,
    1,
    0.001,
    [-0.3, 0.3],
    { help: 'The 3D slice of the 4D set the object is cut from' }
  ),
  juliaIterations: param('fractal', 'quatJulia', 'Iterations', 11, 3, 24, 1),
  boxScale: param(
    'fractal',
    'mandelbox',
    'Scale',
    -1.77,
    -3,
    3,
    0.001,
    [-2.2, -1.4]
  ),
  boxFold: param(
    'fractal',
    'mandelbox',
    'Fold',
    1,
    0.5,
    1.5,
    0.001,
    [0.8, 1.2]
  ),
  boxMinRadius: param(
    'fractal',
    'mandelbox',
    'Min Radius',
    0.5,
    0.05,
    1,
    0.001,
    [0.25, 0.7]
  ),
  boxIterations: param('fractal', 'mandelbox', 'Iterations', 12, 3, 24, 1),
  mengerLevel: param('fractal', 'menger', 'Level', 4, 1, 6, 1, [3, 5]),
  mengerTwist: param('fractal', 'menger', 'Twist', 0, -45, 45, 0.1, [-12, 12], {
    help: 'Turns each level against the last',
  }),
  kifsScale: param('fractal', 'kifs', 'Scale', 2, 1.3, 3, 0.001, [1.7, 2.6]),
  kifsAngleA: param('fractal', 'kifs', 'Angle A', 0, -180, 180, 0.1, [-30, 30]),
  kifsAngleB: param('fractal', 'kifs', 'Angle B', 0, -180, 180, 0.1, [-30, 30]),
  kifsOffset: param(
    'fractal',
    'kifs',
    'Offset',
    1,
    0.4,
    1.6,
    0.001,
    [0.7, 1.2]
  ),
  kifsIterations: param('fractal', 'kifs', 'Iterations', 8, 2, 16, 1),
};

const ALGEBRAIC = {
  algebraicSide: form(
    choice('form', FAMILY_LABELS.algebraic, 'Fill', ALGEBRAIC_SIDES, 'solid', {
      help: 'solid: the f < 0 side, cut by the ball, as the plaster models are; shell: the surface itself, thickened',
      optionLabels: {
        inverse: 'Solid (other side)',
        shell: 'Shell',
        solid: 'Solid',
      },
      when: isFamily('algebraic'),
    })
  ),
  algebraicWall: familyParam(
    'algebraic',
    'Shell Wall',
    0.03,
    0.005,
    0.15,
    0.001,
    null,
    {
      when: { algebraicSide: ['shell'], family: ['algebraic'] },
    }
  ),
  algebraicTurn: familyParam(
    'algebraic',
    'Projective Turn',
    0,
    -90,
    90,
    0.1,
    [-12, 12],
    {
      help: 'Rotates the homogeneous coordinate into x: a projective change of view, so the surface flows',
    }
  ),
  kummerMu: param(
    'algebraic',
    'kummer',
    'μ',
    1.3,
    1.02,
    1.72,
    0.001,
    [1.1, 1.6],
    {
      help: 'With 1 < μ² < 3 all sixteen nodes are real',
    }
  ),
  kummerExtent: param('algebraic', 'kummer', 'Extent', 2.4, 0.5, 6, 0.01),
  clebschExtent: param('algebraic', 'clebsch', 'Extent', 1.6, 0.5, 6, 0.01),
  barthExtent: param('algebraic', 'barth', 'Extent', 1.55, 0.5, 6, 0.01),
};

const SURFACE = {
  surfaceWall: familyParam('surface', 'Wall', 0.025, 0.004, 0.1, 0.001, null, {
    help: 'Thickness of the shell, so the surface could be cast or printed',
  }),
  surfaceDetail: familyParam('surface', 'Detail', 1, 0.4, 2.5, 0.05),
  boyAlpha: param('surface', 'boy', 'Apéry α', 1, 0, 1, 0.001, null, {
    help: "Apéry's family: 0 is the Roman surface, 1 is Boy's",
  }),
  kleinForm: form(
    choice('form', EXHIBIT_LABELS.klein, 'Form', KLEIN_FORMS, 'bottle', {
      exhibit: 'klein',
      optionLabels: { bottle: 'Bottle', figure8: 'Figure-8' },
      when: isExhibit('surface', 'klein'),
    })
  ),
  kleinRadius: param(
    'surface',
    'klein',
    'Radius',
    2.5,
    1.6,
    4,
    0.01,
    [2, 3.2],
    {
      when: { ...isExhibit('surface', 'klein'), kleinForm: ['figure8'] },
    }
  ),
  enneperOrder: param('surface', 'enneper', 'Order', 1, 1, 5, 1, [1, 4]),
  enneperRadius: param(
    'surface',
    'enneper',
    'Radius',
    1.4,
    0.5,
    2.4,
    0.01,
    [1, 1.8]
  ),
  diniTwist: param(
    'surface',
    'dini',
    'Twist',
    0.2,
    0.02,
    0.6,
    0.001,
    [0.1, 0.35]
  ),
  diniTurns: param('surface', 'dini', 'Turns', 2, 0.5, 5, 0.01, [1.5, 3]),
  kuenRange: param('surface', 'kuen', 'Range', 4.5, 1, 7, 0.01, [3, 5.5]),
  breatherB: param(
    'surface',
    'breather',
    'b',
    0.4,
    0.2,
    0.8,
    0.001,
    [0.3, 0.6]
  ),
  shellTurns: param('surface', 'seashell', 'Turns', 3, 1, 6, 0.01, [2, 4]),
  shellFlare: param(
    'surface',
    'seashell',
    'Flare',
    1,
    0.4,
    2,
    0.001,
    [0.7, 1.4]
  ),
};

const ATTRACTOR = {
  attractorLength: familyParam('attractor', 'Length', 1, 0.1, 3, 0.01, null, {
    help: 'How long the trajectory runs, as a share of the exhibit default',
  }),
  attractorTube: familyParam(
    'attractor',
    'Wire',
    0.012,
    0.003,
    0.05,
    0.0005,
    [0.008, 0.018]
  ),
  lorenzSigma: param('attractor', 'lorenz', 'σ', 10, 4, 20, 0.01, [8, 14]),
  lorenzRho: param('attractor', 'lorenz', 'ρ', 28, 15, 60, 0.01, [24, 40]),
  lorenzBeta: param('attractor', 'lorenz', 'β', 2.6667, 1, 5, 0.0001, [2.2, 3]),
  rosslerA: param(
    'attractor',
    'rossler',
    'a',
    0.2,
    0.05,
    0.4,
    0.001,
    [0.15, 0.3]
  ),
  rosslerB: param(
    'attractor',
    'rossler',
    'b',
    0.2,
    0.05,
    2,
    0.001,
    [0.15, 0.4]
  ),
  rosslerC: param('attractor', 'rossler', 'c', 5.7, 3, 14, 0.01, [4.5, 9]),
  aizawaA: param('attractor', 'aizawa', 'a', 0.95, 0.6, 1.1, 0.001, [0.85, 1]),
  aizawaD: param('attractor', 'aizawa', 'd', 3.5, 2.5, 4.5, 0.001, [3, 4]),
  thomasB: param(
    'attractor',
    'thomas',
    'b',
    0.208186,
    0.1,
    0.33,
    0.000001,
    [0.16, 0.23]
  ),
  halvorsenA: param(
    'attractor',
    'halvorsen',
    'a',
    1.89,
    1.3,
    2.3,
    0.001,
    [1.5, 2.1]
  ),
  dadrasA: param('attractor', 'dadras', 'a', 3, 2, 4, 0.001, [2.6, 3.4]),
  dadrasB: param('attractor', 'dadras', 'b', 2.7, 1.5, 3.5, 0.001, [2.3, 3]),
  chenA: param('attractor', 'chenLee', 'α', 5, 3, 6, 0.001, [4, 5.5]),
  chenC: param(
    'attractor',
    'chenLee',
    'δ',
    -0.38,
    -1,
    -0.1,
    0.001,
    [-0.6, -0.2]
  ),
  fourWingA: param(
    'attractor',
    'fourWing',
    'a',
    0.2,
    0.1,
    0.4,
    0.001,
    [0.15, 0.3]
  ),
  fourWingC: param(
    'attractor',
    'fourWing',
    'c',
    -0.4,
    -0.8,
    -0.1,
    0.001,
    [-0.55, -0.3]
  ),
};

const KNOT = {
  knotTube: familyParam('knot', 'Wire', 0.05, 0.004, 0.15, 0.001, null),
  knotP: param('knot', 'torusKnot', 'p', 3, 1, 12, 1, [2, 5]),
  knotQ: param('knot', 'torusKnot', 'q', 7, 1, 19, 1, [3, 11]),
  knotRatio: param(
    'knot',
    'torusKnot',
    'Tube Ratio',
    0.42,
    0.1,
    0.8,
    0.001,
    [0.3, 0.55]
  ),
  lissNx: param('knot', 'lissajous', 'Nx', 3, 1, 9, 1, [2, 5]),
  lissNy: param('knot', 'lissajous', 'Ny', 2, 1, 9, 1, [2, 5]),
  lissNz: param('knot', 'lissajous', 'Nz', 7, 1, 13, 1, [3, 9]),
  lissPhaseX: param('knot', 'lissajous', 'Phase x', 0.1, 0, 1, 0.001, [0, 1]),
  lissPhaseY: param('knot', 'lissajous', 'Phase y', 0.7, 0, 1, 0.001, [0, 1]),
  hopfRings: param('knot', 'hopf', 'Rings', 4, 1, 9, 1, [2, 6], {
    help: 'Circles of latitude on the base sphere, one band of fibres each',
  }),
  hopfFibers: param('knot', 'hopf', 'Fibres', 14, 3, 48, 1, [8, 20]),
  hopfSpread: param(
    'knot',
    'hopf',
    'Spread',
    0.7,
    0.1,
    0.98,
    0.001,
    [0.4, 0.85]
  ),
  hopfTwist: param('knot', 'hopf', 'Twist', 0, -180, 180, 0.1, [-90, 90], {
    help: 'Turns the base points round their circles',
  }),
};

const STRINGS = {
  stringsCount: familyParam('strings', 'Threads', 36, 6, 120, 1, [24, 60]),
  stringsDouble: form(
    flag('form', FAMILY_LABELS.strings, 'Both Rulings', true, {
      help: 'String the second family of lines too, in the second colour',
      when: isFamily('strings'),
    })
  ),
  stringsThread: familyParam('strings', 'Thread', 0.004, 0.001, 0.02, 0.0005),
  stringsFrame: familyParam('strings', 'Frame', 0.025, 0.006, 0.06, 0.0005),
  stringsTwist: param(
    'strings',
    'hyperboloid',
    'Twist',
    120,
    10,
    175,
    0.1,
    [70, 150]
  ),
  stringsWarp: param(
    'strings',
    'paraboloid',
    'Warp',
    0.7,
    0.1,
    1.2,
    0.001,
    [0.4, 1]
  ),
  conoidWaves: param('strings', 'conoid', 'Waves', 2, 1, 5, 1, [1, 3]),
  helicoidTurns: param(
    'strings',
    'helicoid',
    'Turns',
    1,
    0.25,
    3,
    0.01,
    [0.5, 1.5]
  ),
};

const POLYTOPE = {
  polyProjection: form(
    choice(
      'form',
      FAMILY_LABELS.polytope,
      'Projection',
      PROJECTIONS_4D,
      'perspective',
      {
        help: 'perspective: a 4D eye at a distance; stereographic: from the 3-sphere, edges become arcs',
        when: isFamily('polytope'),
      }
    )
  ),
  polyRotXW: familyParam(
    'polytope',
    'Rotate XW',
    20,
    -180,
    180,
    0.1,
    [-60, 60]
  ),
  polyRotYW: familyParam(
    'polytope',
    'Rotate YW',
    10,
    -180,
    180,
    0.1,
    [-60, 60]
  ),
  polyRotZW: familyParam('polytope', 'Rotate ZW', 5, -180, 180, 0.1, [-60, 60]),
  polyDistance: familyParam(
    'polytope',
    'Eye Distance',
    2.6,
    1.3,
    8,
    0.01,
    null,
    {
      help: 'Distance of the 4D eye in circumradii',
      when: { family: ['polytope'], polyProjection: ['perspective'] },
    }
  ),
  polyClip: familyParam('polytope', 'Clip', 3, 1.2, 8, 0.01, null, {
    help: 'Drops edges that project further than this from the centre',
    when: { family: ['polytope'], polyProjection: ['stereographic'] },
  }),
  polyEdge: familyParam('polytope', 'Edge', 0.018, 0.003, 0.06, 0.0005, null),
  polyNode: familyParam('polytope', 'Node', 0.036, 0, 0.1, 0.0005, null, {
    help: 'Radius of the joints; 0 leaves bare edges',
  }),
};

const APOLLIAN = {
  a4Shape: form(
    choice('form', EXHIBIT_LABELS.apollian4, 'Estimator', A4_SHAPES, 'sheets', {
      exhibit: 'apollian4',
      optionLabels: { sheets: 'Sheets (twist)', tubes: 'Tubes (slice)' },
      when: isExhibit('apollian', 'apollian4'),
    })
  ),
  a4FieldScale: param('apollian', 'apollian4', 'Scale', 0.5, 0.05, 6, 0.001),
  a4Thickness: param(
    'apollian',
    'apollian4',
    'Thickness',
    0.004,
    0,
    0.1,
    0.0005
  ),
  a4Folds: param('apollian', 'apollian4', 'Folds', 7, 1, 12, 1),
  a4Scale: param(
    'apollian',
    'apollian4',
    'Inversion',
    1.2,
    0.8,
    2,
    0.001,
    [1.12, 1.32]
  ),
  a4W: param(
    'apollian',
    'apollian4',
    'W',
    0.03125,
    -1,
    1,
    0.0005,
    [-0.06, 0.08]
  ),
  a4Twist: param('apollian', 'apollian4', 'Twist', 1, 0, 1, 0.01, [0.4, 1]),
  a4RotXW: param(
    'apollian',
    'apollian4',
    'Rotate XW',
    0,
    -180,
    180,
    0.1,
    [-25, 25]
  ),
  a4RotYW: param(
    'apollian',
    'apollian4',
    'Rotate YW',
    0,
    -180,
    180,
    0.1,
    [-25, 25]
  ),
  a4RotZW: param(
    'apollian',
    'apollian4',
    'Rotate ZW',
    0,
    -180,
    180,
    0.1,
    [-25, 25]
  ),
  kleinFieldScale: param('apollian', 'kleinian', 'Scale', 1.2, 0.05, 6, 0.001),
  kleinThickness: param(
    'apollian',
    'kleinian',
    'Thickness',
    0.003,
    0,
    0.1,
    0.0005
  ),
  kleinFolds: param('apollian', 'kleinian', 'Folds', 7, 1, 12, 1),
  kleinKey: param('apollian', 'kleinian', 'Keyframe', 0, 0, 16, 0.01, [0, 16], {
    help: "Position along Durand's 16 box-fold keyframes",
  }),
  guestBound: form(
    choice('form', FAMILY_LABELS.apollian, 'Bound', GUEST_BOUNDS, 'sphere', {
      optionLabels: {
        cube: 'Cube / Slab',
        disc: 'Disc / Coin',
        sphere: 'Sphere',
      },
      when: isFamily('apollian'),
    })
  ),
  guestDiscHalf: familyParam(
    'apollian',
    'Coin Half Thickness',
    0.25,
    0.03,
    1,
    0.005,
    null,
    {
      when: { family: ['apollian'], guestBound: ['disc'] },
    }
  ),
  guestCubeHalf: familyParam(
    'apollian',
    'Slab Half Height',
    0.75,
    0.05,
    1,
    0.005,
    null,
    {
      when: { family: ['apollian'], guestBound: ['cube'] },
    }
  ),
};

const PLACEMENT = {
  objectSize: num('form', 'Placement', 'Size', 1, 0.25, 3, 0.01, {
    help: 'World radius of the exhibit',
  }),
  objectTilt: form(num('form', 'Placement', 'Tilt', 0, -90, 90, 0.5)),
  objectSpin: form(num('form', 'Placement', 'Spin', 0, -180, 180, 0.5)),
};

const FORM = {
  family: form(
    choice('form', null, 'Family', FAMILIES, 'fractal', {
      optionLabels: FAMILY_LABELS,
    })
  ),
  ...KIND_KEYS,
  ...FRACTAL,
  ...ALGEBRAIC,
  ...SURFACE,
  ...ATTRACTOR,
  ...KNOT,
  ...STRINGS,
  ...POLYTOPE,
  ...APOLLIAN,
  ...PLACEMENT,
};

const look = (item) => inFacet('look', item);
const isMetal = { material: ['bronze', 'steel', 'brass'] };

const LOOK = {
  material: look(
    choice('look', 'Material', 'Material', MATERIALS, 'plaster', {
      optionLabels: {
        brass: 'Brass',
        bronze: 'Bronze',
        ceramic: 'Glazed Ceramic',
        marble: 'Marble',
        painted: 'Painted',
        plaster: 'Plaster',
        steel: 'Polished Steel',
      },
    })
  ),
  finish: rolled(
    'look',
    [-0.3, 0.3],
    num('look', 'Material', 'Finish', 0, -1, 1, 0.01, {
      help: 'Below 0 rougher, above 0 more polished than the material is',
    })
  ),
  weathering: rolled(
    'look',
    [0.2, 0.8],
    num('look', 'Material', 'Weathering', 0.5, 0, 1, 0.01, {
      help: 'Patina on metal, veining in marble, grime in plaster crevices',
    })
  ),
  paletteName: look(
    spec('string', 'look', 'Palette', 'Palette', 'Sunraze (lospec)', {
      help: 'gradients.json palette that tints the exhibit',
      placeholder: 'NAME',
    })
  ),
  paletteAmount: rolled(
    'look',
    [0, 0.6],
    num('look', 'Palette', 'Amount', 0, 0, 1, 0.01, {
      help: '0 is the bare material; 1 is the palette alone',
    })
  ),
  paletteRepeat: rolled(
    'look',
    [0.6, 3],
    num('look', 'Palette', 'Repeat', 1, 0.1, 8, 0.01)
  ),
  paletteShift: rolled(
    'look',
    [-0.5, 0.5],
    num('look', 'Palette', 'Shift', 0, -1, 1, 0.001)
  ),
  paletteReverse: look(flag('look', 'Palette', 'Reverse', false)),
  colorStructure: look(
    num('look', 'Colour By', 'Structure', 1, 0, 1, 0.01, {
      help: 'Orbit trap on fractals, position along the path or surface elsewhere',
    })
  ),
  colorHeight: look(num('look', 'Colour By', 'Height', 0, 0, 1, 0.01)),
  colorRadius: look(num('look', 'Colour By', 'Radius', 0, 0, 1, 0.01)),
  threadColor: look(
    color('look', 'Threads', 'Thread', '#a8322b', { when: isFamily('strings') })
  ),
  threadColor2: look(
    color('look', 'Threads', 'Second Thread', '#1f2a44', {
      when: { family: ['strings'], stringsDouble: [true] },
    })
  ),
  metalTint: look(
    color('look', 'Material', 'Patina Colour', '#3d7a68', { when: isMetal })
  ),
};

const stage = (item) => inFacet('stage', item);

const STAGE = {
  background: stage(color('stage', null, 'Background', '#5b5853')),
  skyZenith: stage(color('stage', 'Sky', 'Zenith', '#a9b1be')),
  skyHorizon: stage(color('stage', 'Sky', 'Horizon', '#efe7da')),
  plinth: stage(
    choice('stage', 'Plinth', 'Style', PLINTHS, 'column', {
      optionLabels: {
        block: 'Block',
        column: 'Column',
        none: 'None',
        turned: 'Turned',
      },
    })
  ),
  plinthColor: stage(color('stage', 'Plinth', 'Color', '#b3ada4')),
  plinthRoughness: stage(
    num('stage', 'Plinth', 'Roughness', 0.6, 0.02, 1, 0.01)
  ),
  plinthHeight: stage(num('stage', 'Plinth', 'Height', 0.7, 0.05, 3, 0.01)),
  plinthWidth: stage(num('stage', 'Plinth', 'Width', 0.8, 0.2, 2, 0.01)),
  plinthGap: stage(
    num('stage', 'Plinth', 'Float', 0.08, 0, 1, 0.005, {
      help: 'Air between the exhibit and the plinth top',
    })
  ),
  mount: stage(
    flag('stage', 'Plinth', 'Mount Rod', true, {
      help: 'A brass rod holds a floating exhibit off the plinth',
    })
  ),
  floorEnabled: flag('stage', 'Floor', 'Enabled', true),
  floorColor: stage(
    color('stage', 'Floor', 'Shadow Color', '#22201e', {
      help: 'What the floor darkens toward under shadow; unshadowed, the floor is the backdrop',
    })
  ),
  floorShadow: stage(
    num('stage', 'Floor', 'Shadow Strength', 0.75, 0, 1, 0.01)
  ),
  exposure: rolled(
    'stage',
    [1, 1.5],
    num('stage', 'Light', 'Exposure', 1.2, 0.2, 4, 0.01)
  ),
  lightAzimuth: rolled(
    'stage',
    [-180, 180],
    num('stage', 'Light', 'Azimuth', -40, -180, 180, 1)
  ),
  lightElevation: rolled(
    'stage',
    [40, 75],
    num('stage', 'Light', 'Elevation', 55, 5, 89, 1)
  ),
  lightColor: stage(color('stage', 'Light', 'Color', '#fff1dc')),
  lightIntensity: rolled(
    'stage',
    [1.5, 3.5],
    num('stage', 'Light', 'Intensity', 2.6, 0, 10, 0.01)
  ),
  ambient: stage(num('stage', 'Light', 'Ambient', 1, 0, 3, 0.01)),
  softboxes: stage(
    num('stage', 'Light', 'Softboxes', 1.2, 0, 4, 0.01, {
      help: 'Brightness of the studio softboxes polished exhibits reflect',
    })
  ),
  rimIntensity: rolled(
    'stage',
    [0.8, 2],
    num('stage', 'Light', 'Rim', 1.4, 0, 8, 0.01, {
      help: 'Back light opposite the key, separating the silhouette from the backdrop',
    })
  ),
  shadowSoftness: stage(
    num('stage', 'Light', 'Shadow Softness', 0.12, 0.01, 1, 0.005, {
      help: 'Penumbra width of the marched self-shadow on fields',
    })
  ),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Motion', MOTION_MODES, 'turntable', {
      optionLabels: {
        draw: 'Draw / Build',
        evolve: 'Evolve',
        off: 'Off',
        sweep: 'Light Sweep',
        turntable: 'Turntable',
      },
    })
  ),
  motionSpeed: sceneOnly(num('motion', null, 'Speed', 1, 0, 5, 0.01)),
  turntableSeconds: num('motion', null, 'Turn Seconds', 40, 4, 240, 1, {
    help: 'Seconds per revolution of a turntable',
  }),
  sweepSpan: num('motion', null, 'Sweep Span', 110, 10, 360, 1, {
    help: 'Degrees the key light swings through in a light sweep',
  }),
  sweepSeconds: num('motion', null, 'Sweep Seconds', 14, 2, 120, 0.5),
  evolveRate: num('motion', null, 'Evolve Rate', 1, 0, 5, 0.01, {
    help: "How fast the exhibit's own parameter walks",
  }),
  drawSeconds: num('motion', null, 'Draw Seconds', 10, 1, 120, 0.5, {
    help: 'Seconds a draw / build takes from nothing to the whole exhibit',
  }),
  drawHold: num('motion', null, 'Draw Hold', 3, 0, 30, 0.5, {
    help: 'Seconds the finished exhibit holds before the draw restarts',
  }),
};

// Owned by the post rig, which builds its own Leva controls; declared here
// so a preset and a headless render carry them. Defaults are
// exhibitARender's post.js.
const rig = (item) => ({
  facet: 'stage',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'post',
  ...item,
});
const RIG = {
  postBloomEnabled: rig({
    default: true,
    help: 'Mip bloom',
    label: 'Bloom',
    type: 'boolean',
  }),
  postBloomThreshold: rig({
    default: 0.9,
    help: 'Luminance the bloom starts above',
    label: 'Bloom threshold',
    max: 4,
    min: 0,
    step: 0.05,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 0.4,
    help: 'Bloom strength',
    label: 'Bloom strength',
    max: 4,
    min: 0,
    step: 0.05,
    type: 'number',
  }),
  postGradeEnabled: rig({
    default: true,
    help: 'Tint, vignette and letterbox',
    label: 'Grade',
    type: 'boolean',
  }),
  postGradeTint: rig({
    default: '#ffffff',
    help: 'Colour the frame is multiplied by',
    label: 'Grade tint',
    type: 'color',
  }),
  postGradeVignette: rig({
    default: 0.3,
    help: 'Vignette strength',
    label: 'Vignette',
    max: 1,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postGradeLetterbox: rig({
    default: 0,
    help: 'Blacks out beyond this half-width in frame heights; 0 is off',
    label: 'Letterbox',
    max: 4,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
};

const quality = (item) => ({ scope: 'shared', section: 'quality', ...item });

const QUALITY = {
  marchSteps: quality(num('quality', null, 'March Steps', 160, 32, 400, 1)),
  shadowSteps: quality(num('quality', null, 'Shadow Steps', 40, 0, 128, 1)),
  aoSamples: quality(num('quality', null, 'AO Samples', 8, 0, 16, 1)),
  hitEpsilon: quality(
    num('quality', null, 'Hit Epsilon', 0.0004, 0.00005, 0.01, 0.00005, {
      help: 'A ray hits once the field is under this times its distance',
    })
  ),
  shadowMapSize: quality(
    num('quality', null, 'Shadow Map', 2048, 512, 8192, 512, {
      help: 'Resolution of the key light shadow map',
    })
  ),
  renderScale: sceneOnly(
    num('quality', null, 'Render Scale', 0.75, 0.25, 1, 0.05, {
      help: 'Canvas resolution',
    })
  ),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });
const video = (item) => ({ scope: 'video', section: 'video', ...item });

const RENDER = {
  batch: output({
    default: null,
    help: 'Batch seed: names the generations (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
    label: 'Batch seed',
    nullable: true,
    placeholder: 'WORD',
    text: true,
    type: 'seed',
  }),
  out: output({
    cliOnly: true,
    default: 'output/exhibit-a',
    help: 'Output directory (stills) or file (video)',
    placeholder: 'PATH',
    type: 'string',
  }),
  width: output({
    default: 1080,
    help: 'Width',
    label: 'Width',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  height: output({
    default: 1350,
    help: 'Height',
    label: 'Height',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  pixelRatio: output({
    choices: [1, 2, 3, 4],
    default: 2,
    help: 'Renders at width×ratio by height×ratio',
    label: 'Pixel ratio',
    max: 4,
    min: 1,
    type: 'number',
  }),
  count: output({
    default: 1,
    help: 'How many exhibits to roll',
    label: 'Count',
    max: 200,
    min: 1,
    placeholder: 'N',
    step: 1,
    type: 'number',
  }),
  png: still({
    default: false,
    help: 'Write PNG files',
    label: 'PNG',
    type: 'boolean',
  }),
  webp: still({
    default: true,
    help: 'Write lossless WebP files',
    label: 'WebP',
    type: 'boolean',
  }),
  views: still({
    default: 'hero',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  projection: {
    choices: PROJECTIONS,
    default: 'perspective',
    help: 'Camera projection',
    label: 'Projection',
    scope: 'shared',
    section: 'render',
    type: 'enum',
  },
  fov: {
    default: 30,
    help: 'Vertical field of view in degrees (perspective only)',
    label: 'Field of view',
    max: 90,
    min: 10,
    scope: 'shared',
    section: 'render',
    step: 1,
    type: 'number',
  },
  margin: {
    default: 0.12,
    help: 'Space round the exhibit and plinth, as a share of the frame',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    scope: 'shared',
    section: 'render',
    step: 0.01,
    type: 'number',
  },
  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: form, look, stage',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  families: {
    default: FAMILIES.join(','),
    help: `Comma-separated families the form roll picks from: ${FAMILIES.join(', ')}`,
    label: 'Families',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  palettes: {
    array: true,
    cliOnly: true,
    default: null,
    help: 'Palette names the look roll picks from (the CLI fills this from gradients.json)',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  mode: video({
    choices: VIDEO_MODES,
    default: 'turntable',
    help: 'turntable: orbit the exhibit; sweep: the key light swings round it; evolve: its parameter walks; draw: it builds from nothing',
    label: 'Mode',
    type: 'enum',
  }),
  view: video({
    choices: VIEWS,
    default: 'hero',
    help: 'Camera view for the clip',
    label: 'View',
    type: 'enum',
  }),
  fps: video({
    choices: [24, 30, 60],
    default: 30,
    help: 'Frames per second',
    label: 'FPS',
    max: 60,
    min: 24,
    type: 'number',
  }),
  hold: video({
    default: 8,
    help: 'Seconds per exhibit',
    label: 'Hold',
    max: 300,
    min: 0,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  turns: video({
    default: 1,
    help: 'Turntable revolutions per exhibit',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    step: 0.25,
    type: 'number',
  }),
  orbit: video({
    default: 0,
    help: 'Degrees the camera drifts round a sweep, evolve or draw clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    step: 5,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...FORM,
  ...LOOK,
  ...STAGE,
  ...MOTION,
  ...RIG,
  ...QUALITY,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 1, height: 1920, out: 'output/exhibit-a.mp4' },
  workbench: { count: 4 },
};

const splitList = (list) =>
  String(list)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export function resolveViews(list, fail = (message) => new Error(message)) {
  const views = splitList(list);
  if (views.length === 0 || views.some((view) => !VIEWS.includes(view))) {
    throw fail(`views must name only ${VIEWS.join(', ')}.`);
  }
  return views;
}

export function resolveFamilies(list, fail = (message) => new Error(message)) {
  const families = splitList(list);
  if (families.length === 0 || families.some((f) => !FAMILIES.includes(f))) {
    throw fail(`families must name only ${FAMILIES.join(', ')}.`);
  }
  return families;
}

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    form: 'form',
    look: 'look',
    motion: 'motion',
    output: 'output',
    post: 'post',
    quality: 'quality',
    render: 'render',
    roll: 'rolling',
    stage: 'stage',
    video: 'video',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp) {
      throw fail('Select at least one output format: PNG or WebP.');
    }
    const longest = Math.max(options.width, options.height);
    if (longest * options.pixelRatio > 8192) {
      throw fail(
        `width×pixelRatio must stay within 8192; the longest side would be ${longest * options.pixelRatio}.`
      );
    }
    if (kind === 'still') resolveViews(options.views, fail);
    resolveFamilies(options.families, fail);
  },
});

export const {
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  sectionsFor,
  usageFor,
} = schema;

const keysWhere = (test) =>
  Object.entries(RENDER_OPTIONS)
    .filter(([, item]) => test(item))
    .map(([key]) => key);

export const SCENE_KEYS = keysWhere((item) => item.scene);
export const LEVA_KEYS = keysWhere((item) => item.scene && !item.rig);

// The form keys that only place the exhibit; every other form key reshapes it.
export const PLACEMENT_KEYS = Object.keys(PLACEMENT);
export const SHAPE_KEYS = keysWhere(
  (item) => item.facet === 'form' && item.scene
).filter((key) => !PLACEMENT_KEYS.includes(key));

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [key, RENDER_OPTIONS[key].default])
  );

export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    SCENE_KEYS.filter((key) => flat[key] != null).map((key) => [key, flat[key]])
  );
}

export const optionsFromConfig = (config = {}) => configFrom(config);

export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
