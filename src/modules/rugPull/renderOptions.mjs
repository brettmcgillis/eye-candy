// Every knob the Rug Pull renderers accept, declared once
// (docs/rug-pull-pipeline.md). The scene's Leva folders are generated from
// it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it; the id lists are mirrored from the kernel and held to it by
// `npm run rug-pull:check`.
import createOptionSchema from '../optionSchema/index.mjs';

export const DESIGN_CHOICES = [
  'city',
  'village',
  'tribal',
  'gul',
  'herati',
  'boteh',
  'minaKhani',
  'prayer',
  'garden',
  'tree',
  'harlequin',
];
export const BORDER_CHOICES = [
  'herati',
  'rosettePalmette',
  'cartouche',
  'kufic',
  'runningDog',
  'botehRow',
  'starRow',
  'hookedDiamonds',
  'argyleLattice',
  'argyleChain',
  'reversalChain',
  'turboflexChain',
];
export const GUARD_CHOICES = [
  'plain',
  'dots',
  'reciprocal',
  'barber',
  'zigzag',
  'chain',
  'rosettes',
  'argyleRow',
];
export const PALETTE_CHOICES = [
  'tabriz',
  'kashan',
  'isfahan',
  'heriz',
  'qashqai',
  'turkmen',
  'baluch',
  'nain',
  'ziegler',
  'kerman',
  'loader',
  'turboflex',
];
export const ROLE_NAMES = [
  'dark',
  'ivory',
  'red',
  'blue',
  'gold',
  'green',
  'rose',
  'sky',
  'camel',
  'warp',
];
export const RUG_MODES = ['floor', 'wall'];
export const HANG_STYLES = ['rod', 'clips', 'corners'];
export const VIEWS = ['cartoon', 'flat', 'floor', 'wall'];
export const FACETS = ['design', 'border', 'mine', 'palette', 'age', 'room'];

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
const color = (section, group, label, value, extra = {}) =>
  spec('color', section, group, label, value, extra);
const flag = (section, group, label, value, extra = {}) =>
  spec('boolean', section, group, label, value, extra);
const rolled = (facet, [min, max], item) => ({
  ...item,
  facet,
  roll: { max, min, step: item.step },
});
const inFacet = (facet, item) => ({ ...item, facet });
const sceneOnly = (item) => ({ ...item, sceneOnly: true });

const DESIGN = {
  design: inFacet(
    'design',
    choice('design', null, 'Design', DESIGN_CHOICES, 'city', {
      help: 'city: medallion and floral field; village: Heriz-style stepped medallion; tribal: Qashqai pole medallion and scattered fillers; gul: Turkmen guls; herati / boteh / minaKhani: all-over repeats; prayer: mihrab arch; garden: khesti compartments; tree: tree of life; harlequin: argyle lattice',
      optionLabels: {
        boteh: 'Boteh',
        city: 'City medallion',
        garden: 'Garden',
        gul: 'Turkmen gul',
        harlequin: 'Harlequin',
        herati: 'Herati',
        minaKhani: 'Mina khani',
        prayer: 'Prayer',
        tree: 'Tree of life',
        tribal: 'Tribal',
        village: 'Village',
      },
    })
  ),
  rugSeed: rolled(
    'design',
    [0, 99999],
    num('design', null, 'Seed', 7, 0, 99999, 1, {
      help: 'Seeds every choice the design makes',
    })
  ),
  knotsAcross: inFacet(
    'design',
    num('design', 'Weave', 'Knots Across', 200, 60, 320, 2, {
      help: 'Knots across the width: fine city weaves run high, village and tribal rugs low',
    })
  ),
  rugAspect: inFacet(
    'design',
    num('design', 'Weave', 'Length', 1.45, 0.9, 3.2, 0.01, {
      help: 'Length over width; above 2.4 is a runner',
    })
  ),
  medallionScale: rolled(
    'design',
    [0.38, 0.62],
    num('design', 'Field', 'Medallion', 0.5, 0.2, 0.85, 0.01, {
      help: 'Centre medallion half-width over the field half-width',
    })
  ),
  infillScale: rolled(
    'design',
    [0.8, 1.25],
    num('design', 'Field', 'Infill Scale', 1, 0.5, 2, 0.01, {
      help: 'Size of the repeat or scattered fillers in the field',
    })
  ),
  asymmetry: rolled(
    'design',
    [0, 0.6],
    num('design', 'Field', 'Asymmetry', 0.3, 0, 1, 0.01, {
      help: 'Chance a tribal field scatters freely instead of mirroring',
    })
  ),
  pendants: inFacet(
    'design',
    flag('design', 'Field', 'Pendants', true, {
      help: 'Finials, arms or a pole on the medallion',
    })
  ),
  spandrels: inFacet(
    'design',
    flag('design', 'Field', 'Spandrels', true, {
      help: 'Quarter medallions in the field corners',
    })
  ),
};

const BORDER = {
  borderMotif: inFacet(
    'border',
    choice('border', null, 'Main Border', ['auto', ...BORDER_CHOICES], 'auto', {
      help: 'The main border repeat; auto picks one the design reads well with',
    })
  ),
  guardMotif: inFacet(
    'border',
    choice('border', null, 'Guards', ['auto', ...GUARD_CHOICES], 'auto', {
      help: 'The narrow guard stripes; auto rolls each one',
    })
  ),
  borderWidth: rolled(
    'border',
    [0.08, 0.15],
    num('border', null, 'Border Width', 0.12, 0.04, 0.22, 0.005, {
      help: 'Main border width over the rug width',
    })
  ),
  guardWidth: rolled(
    'border',
    [3, 6],
    num('border', null, 'Guard Width', 4, 2, 10, 1, { help: 'In knots' })
  ),
  guardCount: rolled(
    'border',
    [0, 2],
    num('border', null, 'Guards Each Side', 1, 0, 3, 1)
  ),
  cornerRosettes: inFacet(
    'border',
    flag('border', null, 'Corner Rosettes', true, {
      help: 'A rosette resolves each main-border corner; off mitres them',
    })
  ),
  kilimRows: rolled(
    'border',
    [2, 10],
    num('border', 'Ends', 'Kilim Rows', 6, 0, 16, 1, {
      help: 'Flat-woven rows at each end, before the fringe',
    })
  ),
  selvedge: inFacet(
    'border',
    choice(
      'border',
      'Ends',
      'Selvedge',
      ['dark', 'red', 'blue', 'ivory', 'camel'],
      'dark',
      {
        help: 'The yarn the long edges are overcast in',
      }
    )
  ),
};

const mineChance = (label, help) =>
  inFacet('mine', num('mine', null, label, 0, 0, 1, 0.01, { help }));
const mineWeight = (label) =>
  inFacet(
    'mine',
    num('mine', 'Which', label, 1, 0, 1, 0.01, {
      help: `How often the ${label} is the house motif picked; 0 never`,
    })
  );

const MINE = {
  mineMedallion: mineChance(
    'Medallion',
    'Chance the centre medallion is a house motif in a frame'
  ),
  mineBorder: mineChance(
    'Border',
    'Chance the main border is a house motif chain'
  ),
  mineGuard: mineChance('Guards', 'Chance each guard is an argyle row'),
  mineField: mineChance(
    'Field',
    'Share of field repeats and fillers swapped for house motifs'
  ),
  mineSignature: mineChance(
    'Signature',
    'Chance of a signature cartouche at the head of the field'
  ),
  weightArgyle: mineWeight('Argyle'),
  weightReversal: mineWeight('Reversal'),
  weightTurboflex: mineWeight('Turboflex'),
};

const roleChoice = (label, help) =>
  inFacet(
    'palette',
    choice('palette', 'Grounds', label, ['auto', ...ROLE_NAMES], 'auto', {
      help,
    })
  );
const customColor = (role, value) =>
  inFacet(
    'palette',
    color('palette', 'Custom', role[0].toUpperCase() + role.slice(1), value, {
      when: { palette: ['custom'] },
    })
  );

const PALETTE = {
  palette: inFacet(
    'palette',
    choice('palette', null, 'Palette', [...PALETTE_CHOICES, 'custom'], 'tabriz', {
      help: 'Named dye sets after their weaving centres, two house sets (loader, turboflex), or custom',
    })
  ),
  groundRole: roleChoice(
    'Field',
    'The field ground yarn; auto is the palette’s'
  ),
  borderRole: roleChoice('Border', 'The main border ground yarn'),
  medallionRole: roleChoice(
    'Medallion',
    'The medallion and spandrel ground yarn'
  ),
  colorDark: customColor('dark', '#1e1a22'),
  colorIvory: customColor('ivory', '#eee2c6'),
  colorRed: customColor('red', '#9c2b26'),
  colorBlue: customColor('blue', '#1f2d58'),
  colorGold: customColor('gold', '#c79a42'),
  colorGreen: customColor('green', '#4e6a4b'),
  colorRose: customColor('rose', '#d58e7d'),
  colorSky: customColor('sky', '#7e9cba'),
  colorCamel: customColor('camel', '#a87a50'),
  colorWarp: customColor('warp', '#ebe2d0'),
};

const AGE = {
  abrash: rolled(
    'age',
    [0.1, 0.7],
    num('age', null, 'Abrash', 0.35, 0, 1, 0.01, {
      help: 'Dye-lot banding across the rows',
    })
  ),
  fade: rolled('age', [0, 0.35], num('age', null, 'Sun Fade', 0.1, 0, 1, 0.01)),
  wear: rolled(
    'age',
    [0, 0.45],
    num('age', null, 'Wear', 0.15, 0, 1, 0.01, {
      help: 'Pile worn down to the foundation, most where feet go',
    })
  ),
  flaws: rolled(
    'age',
    [0, 2],
    num('age', null, 'Flaws', 1, 0, 4, 1, {
      help: 'Patches where the weaver changed yarn mid-motif',
    })
  ),
};

const ROOM = {
  rugMode: sceneOnly(
    choice('room', null, 'Mode', RUG_MODES, 'floor', {
      help: 'floor: lying by the couch; wall: hung from a rod',
      optionLabels: { floor: 'Floor rug', wall: 'Wall rug' },
    })
  ),
  rugWidth: rolled(
    'room',
    [1.3, 2.1],
    num('room', 'Drape', 'Width', 1.7, 0.6, 3.2, 0.01, { help: 'Metres' })
  ),
  fringeLength: rolled(
    'room',
    [0.03, 0.1],
    num('room', 'Drape', 'Fringe', 0.07, 0, 0.2, 0.005, { help: 'Metres' })
  ),
  stiffness: rolled(
    'room',
    [0.35, 0.75],
    num('room', 'Drape', 'Stiffness', 0.55, 0.02, 1, 0.01, {
      help: 'How hard the rug resists bending',
    })
  ),
  rumple: rolled(
    'room',
    [0, 0.5],
    num('room', 'Floor', 'Rumple', 0.25, 0, 1, 0.01, {
      help: 'Ripples the rug was kicked into',
    })
  ),
  cornerFlip: rolled(
    'room',
    [0, 0.3],
    num('room', 'Floor', 'Corner Flip', 0, 0, 0.6, 0.01, {
      help: 'A corner folded back over the rug',
    })
  ),
  hangStyle: inFacet(
    'room',
    choice('room', 'Wall', 'Hang', HANG_STYLES, 'rod', {
      help: 'rod: the whole head on a rod; clips: on rings that sag between; corners: two nails',
    })
  ),
  clipCount: inFacet(
    'room',
    num('room', 'Wall', 'Clips', 5, 2, 9, 1, {
      when: { hangStyle: ['clips'] },
    })
  ),
  wind: inFacet(
    'room',
    num('room', 'Wall', 'Breeze', 0.8, 0, 4, 0.01, {
      help: 'A draught that sways a hung rug',
    })
  ),
  pileHeight: inFacet(
    'room',
    num('room', 'Pile', 'Relief', 0.6, 0, 1, 0.01, {
      help: 'How strongly each knot reads as a tuft',
    })
  ),
  sheen: inFacet(
    'room',
    num('room', 'Pile', 'Sheen', 0.35, 0, 1, 0.01, {
      help: 'Wool lustre where the pile leans toward the light',
    })
  ),
  floorColor: inFacet('room', color('room', 'Colours', 'Floor', '#5a4434')),
  wallColor: inFacet('room', color('room', 'Colours', 'Wall', '#d8cbb6')),
  sofa: sceneOnly(
    flag('room', null, 'Sofa', true, { help: 'The couch beside a floor rug' })
  ),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });

const RENDER = {
  batch: output({
    default: null,
    help: 'Batch seed: names the rugs (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
    label: 'Batch seed',
    nullable: true,
    placeholder: 'WORD',
    text: true,
    type: 'seed',
  }),
  out: output({
    cliOnly: true,
    default: 'output/rug-pull',
    help: 'Output directory',
    placeholder: 'PATH',
    type: 'string',
  }),
  count: output({
    default: 1,
    help: 'How many rugs to weave',
    label: 'Count',
    max: 500,
    min: 1,
    placeholder: 'N',
    step: 1,
    type: 'number',
  }),
  views: still({
    default: 'cartoon,floor',
    help: `Comma-separated views: ${VIEWS.join(', ')}. cartoon is the knot chart (no GPU); the rest are WebGPU renders`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  width: output({
    default: 1080,
    help: 'Width of the 3D views',
    label: 'Width',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  height: output({
    default: 1350,
    help: 'Height of the 3D views',
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
    help: 'Renders the 3D views at width×ratio by height×ratio',
    label: 'Pixel ratio',
    max: 4,
    min: 1,
    type: 'number',
  }),
  cartoonScale: still({
    default: 4,
    help: 'Pixels per knot in the cartoon view',
    label: 'Cartoon px/knot',
    max: 16,
    min: 1,
    placeholder: 'PX',
    step: 1,
    type: 'number',
  }),
  cartoonGrid: still({
    default: 0.12,
    help: 'Darkening of the chart’s grid lines; 0 is none',
    label: 'Cartoon grid',
    max: 0.6,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  png: still({
    default: true,
    help: 'Write PNG files',
    label: 'PNG',
    type: 'boolean',
  }),
  webp: still({
    default: false,
    help: 'Write lossless WebP files',
    label: 'WebP',
    type: 'boolean',
  }),
  svg: still({
    default: false,
    help: 'Write the knot chart as SVG: one path per yarn',
    label: 'SVG',
    type: 'boolean',
  }),
  settleSteps: still({
    default: 480,
    help: 'Cloth solver steps before a 3D view is taken',
    label: 'Settle steps',
    max: 4000,
    min: 0,
    placeholder: 'N',
    section: 'render',
    step: 10,
    type: 'number',
  }),
  samples: {
    choices: [0, 4],
    default: 4,
    help: 'MSAA samples',
    label: 'MSAA',
    max: 4,
    min: 0,
    scope: 'shared',
    section: 'render',
    type: 'number',
  },
  designPool: {
    default: '',
    help: `Comma-separated designs the roll picks from (empty: all): ${DESIGN_CHOICES.join(', ')}`,
    label: 'Design pool',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  palettePool: {
    default: '',
    help: `Comma-separated palettes the roll picks from (empty: every traditional one): ${PALETTE_CHOICES.join(', ')}`,
    label: 'Palette pool',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  houseRate: {
    default: 0.5,
    help: 'Share of rolled rugs that weave in house motifs at all (the mine facet)',
    label: 'House motif rate',
    max: 1,
    min: 0,
    scope: 'shared',
    section: 'roll',
    step: 0.01,
    type: 'number',
  },
  keep: {
    default: '',
    help: `Comma-separated facets to hold while the rest roll: ${FACETS.join(', ')}`,
    label: 'Hold facets',
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
};

export const RENDER_OPTIONS = {
  ...DESIGN,
  ...BORDER,
  ...MINE,
  ...PALETTE,
  ...AGE,
  ...ROOM,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  workbench: { count: 6 },
};

const SECTION_LABELS = {
  age: 'age',
  border: 'borders',
  design: 'design',
  mine: 'house motifs',
  output: 'output',
  palette: 'palette',
  render: 'render',
  roll: 'rolling',
  room: 'room & drape',
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: SECTION_LABELS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (!options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    const views = String(options.views)
      .split(',')
      .map((view) => view.trim())
      .filter(Boolean);
    const unknown = views.filter((view) => !VIEWS.includes(view));
    if (unknown.length) {
      throw fail(
        `Unknown view ${unknown.join(', ')}; pick from ${VIEWS.join(', ')}.`
      );
    }
    if (Math.max(options.width, options.height) * options.pixelRatio > 8192) {
      throw fail('width×pixelRatio must stay within 8192.');
    }
  },
});

const keysWhere = (test) =>
  Object.entries(RENDER_OPTIONS)
    .filter(([, item]) => test(item))
    .map(([key]) => key);

export const SCENE_KEYS = keysWhere((item) => item.scene);
export const LEVA_KEYS = SCENE_KEYS;
// The keys the cartoon depends on; room keys only restyle or re-drape it.
export const WEAVE_KEYS = keysWhere(
  (item) => item.scene && item.section !== 'room'
);
export const DRAPE_KEYS = [
  'rugMode',
  'rugWidth',
  'fringeLength',
  'stiffness',
  'rumple',
  'cornerFlip',
  'hangStyle',
  'clipCount',
];

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [key, RENDER_OPTIONS[key].default])
  );

export const configFrom = (source) => {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    SCENE_KEYS.filter((key) => flat[key] != null).map((key) => [key, flat[key]])
  );
};

export const optionsFromConfig = (config = {}) => configFrom(config);

export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) =>
        key in defaults && value != null && value !== defaults[key]
    )
  );
}

export const {
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  sectionsFor,
  usageFor,
} = schema;
