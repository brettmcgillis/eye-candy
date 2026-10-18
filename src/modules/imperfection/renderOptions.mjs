// Every knob Imperfection's renderers accept, declared once
// (docs/imperfection-pipeline.md). Defaults are the full bundle's constants;
// lite and wild are presets over them (variants.js). Dependency-free `.mjs`
// so plain Node and Vite's config loader can import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  sceneOnly,
  spec,
  standard,
  video,
} from '../optionSchema/index.mjs';

export const VARIANTS = ['full', 'lite'];
export const BLOCK_ENGINES = ['grid', 'quadtree', 'rect'];
export const COMPOSITIONS = [
  'reference',
  'cross',
  'horizon',
  'portal',
  'burst',
  'columns',
];
export const FIELD_SOURCES = ['composition', 'image'];
export const MOTIFS = ['none', 'logo', 'tiled'];
export const MOTIF_STYLES = ['filled', 'outline'];
export const MOTIF_PLACEMENTS = ['blocks', 'field', 'both'];
export const RED_ACCENTS = ['none', 'drips', 'flecks', 'both'];
export const VIEWS = ['painting', 'field', 'wetness', 'blocks'];
export const VIDEO_MODES = ['loop'];
export const FACETS = [
  'composition',
  'layout',
  'palette',
  'paint',
  'field',
  'blocks',
  'wet',
  'accents',
  'grade',
  'motif',
  'motion',
];

const isFull = { variant: ['full'] };

const paint = (item) => inFacet('paint', item);

const PAINT = {
  variant: paint(
    choice('paint', null, 'Version', VARIANTS, 'full', {
      choiceLabels: { full: 'Full (two pass)', lite: 'Lite (one pass)' },
      help: 'full: paint buffer + wet smear + all accents; lite: one pass, wet segment ends, fewer accents',
    })
  ),
  paintSeed: rolled(
    'paint',
    [1, 997],
    num('paint', null, 'Seed', 0, 0, 999, 1, {
      help: 'Offsets every hash; 0 is the reference painting',
    })
  ),
  srcFrac: rolled(
    'paint',
    [0.6, 0.85],
    num('paint', 'Smear', 'Pick Point', 0.72, 0, 1, 0.01, {
      help: 'Where in a smear segment the paint is picked (0 tail, 1 head)',
    })
  ),
  dragMin: rolled(
    'paint',
    [0.45, 0.7],
    num('paint', 'Smear', 'Min Drag', 0.55, 0, 1, 0.01, {
      help: 'Minimum drag strength per segment (1 = flat hold)',
    })
  ),
  lumSpread: rolled(
    'paint',
    [0.07, 0.22],
    num('paint', 'Smear', 'Streak Contrast', 0.1, 0, 0.5, 0.005)
  ),
  darkLines: paint(
    num('paint', 'Smear', 'Dark Scratches', 0.04, 0, 0.3, 0.005, {
      help: 'Share of streak segments that are dark scratches',
    })
  ),
  texGain: paint(num('paint', 'Smear', 'Texture Gain', 0.8, 0, 2, 0.01)),
  seamDither: rolled(
    'paint',
    [0.15, 0.45],
    num('paint', 'Threads', 'Seam Dither', 0.3, 0, 0.6, 0.01, {
      help: 'How far the warm/cool switch wanders per hairline',
    })
  ),
  threadRed: rolled(
    'paint',
    [0.05, 0.3],
    num('paint', 'Threads', 'Red Threads', 0.16, 0, 1, 0.01)
  ),
  lineGrain: rolled(
    'paint',
    [0.1, 1],
    num('paint', 'Threads', 'Hairline Flicker', 0.9, 0, 2, 0.01)
  ),
  threadSpread: rolled(
    'paint',
    [6, 30],
    num('paint', 'Threads', 'Thread Spread', 22, 0, 80, 0.5, {
      help: 'How far hairlines read the field across the grain (ref px)',
    })
  ),
  taper: rolled(
    'paint',
    [0.15, 0.35],
    num('paint', 'Strands', 'Taper', 0.22, 0, 0.6, 0.01)
  ),
  strandMin: paint(num('paint', 'Strands', 'Min Width', 6, 1, 40, 0.5)),
  strandMax: rolled(
    'paint',
    [24, 48],
    num('paint', 'Strands', 'Max Width', 36, 2, 120, 0.5)
  ),
  hatchWidth: paint(
    num('paint', 'Strands', 'Hatch Width', 0.35, 0.05, 1, 0.01)
  ),
  ragged: paint(num('paint', 'Strands', 'Ragged Ends', 0.25, 0, 1, 0.01)),
  lineDrag: paint(num('paint', 'Strands', 'Comb Ends', 0.5, 0, 1, 0.01)),
  softLines: rolled(
    'paint',
    [0.3, 1],
    num('paint', 'Texture', 'Soft Lines', 0.9, 0, 3, 0.01, { when: isFull })
  ),
  mottle: rolled(
    'paint',
    [0.5, 1.8],
    num('paint', 'Texture', 'Dry Dashes', 1.6, 0, 4, 0.01)
  ),
  skip: paint(
    num('paint', 'Texture', 'Bristle Skips', 1.8, 0, 4, 0.01, { when: isFull })
  ),
  grit: paint(
    num('paint', 'Texture', 'Grit', 0.5, 0, 2, 0.01, { when: isFull })
  ),
  dripOn: paint(
    num('paint', 'Drips', 'Drip Share', 0.5, 0, 1, 0.01, { when: isFull })
  ),
  dripLum: paint(
    num('paint', 'Drips', 'Drip Brightness', 1.6, 0, 4, 0.01, { when: isFull })
  ),
};

const field = (item) => inFacet('field', item);

const FIELD = {
  seamBreath: rolled(
    'field',
    [0.005, 0.12],
    num('field', null, 'Seam Breath', 0.014, 0, 1, 0.001, {
      help: 'How far the warm/cool seams creep over the loop (uv)',
    })
  ),
  coolThreads: field(num('field', null, 'Cool Threads', 0.62, 0, 1, 0.01)),
  coolThreadCut: rolled(
    'field',
    [0.6, 0.72],
    num('field', null, 'Cool Thread Cut', 0.66, 0.3, 0.95, 0.005)
  ),
  warmHueVar: rolled(
    'field',
    [0.1, 0.3],
    num('field', 'Warm Variation', 'Hue', 0.2, 0, 0.6, 0.01)
  ),
  warmLitVar: field(
    num('field', 'Warm Variation', 'Lightness', 0.11, 0, 0.4, 0.01)
  ),
  driftHue: field(num('field', 'Drift', 'Hue', 0.05, 0, 0.3, 0.005)),
  driftLit: field(num('field', 'Drift', 'Lightness', 0.06, 0, 0.3, 0.005)),
};

const blocks = (item) => inFacet('blocks', item);

const BLOCKS = {
  blocksEnabled: blocks(flag('blocks', null, 'Enabled', true)),
  blockEngine: blocks(
    choice('blocks', 'Layout', 'Engine', BLOCK_ENGINES, 'grid', {
      choiceLabels: {
        grid: 'Jittered Grid (reference)',
        quadtree: 'Quadtree Split',
        rect: 'Rect Subdivision',
      },
      help: 'How each block layer is partitioned: the reference grid, or split per pixel into quads or off-centre rects',
    })
  ),
  blockScale: rolled(
    'blocks',
    [0.6, 1.8],
    num('blocks', 'Layout', 'Cell Scale', 1, 0.2, 4, 0.01, {
      help: 'Scales every layer’s cells; smaller means many more blocks',
    })
  ),
  blockAmount: rolled(
    'blocks',
    [0.5, 1.8],
    num('blocks', 'Layout', 'Amount', 1, 0, 4, 0.01, {
      help: 'Gain on the block density map',
    })
  ),
  blockLayers: blocks(num('blocks', 'Layout', 'Layers', 4, 0, 4, 1)),
  blockFill: rolled(
    'blocks',
    [0, 0.6],
    num('blocks', 'Layout', 'Fill', 0, 0, 1, 0.01, {
      help: '0: a block covers 35–95% of its cell (reference); 1: blocks tile their cells',
    })
  ),
  blockDepth: rolled(
    'blocks',
    [1, 5],
    num('blocks', 'Split', 'Depth', 3, 0, 5, 1, {
      when: { blockEngine: ['quadtree', 'rect'] },
    })
  ),
  blockSplit: rolled(
    'blocks',
    [0.3, 0.8],
    num('blocks', 'Split', 'Chance', 0.55, 0, 1, 0.01, {
      when: { blockEngine: ['quadtree', 'rect'] },
    })
  ),
  blockFocus: rolled(
    'blocks',
    [0, 1],
    num('blocks', 'Split', 'Follow Density', 0.5, 0, 1, 0.01, {
      help: 'Split more where the density map wants blocks',
      when: { blockEngine: ['quadtree', 'rect'] },
    })
  ),
  blockCut: rolled(
    'blocks',
    [0.05, 0.4],
    num('blocks', 'Split', 'Off-centre Cuts', 0.3, 0, 0.45, 0.01, {
      when: { blockEngine: ['rect'] },
    })
  ),
  fieldRects: rolled(
    'blocks',
    [5, 9],
    num('blocks', null, 'Field Rectangles', 9, 0, 9, 1, {
      help: 'Authored rectangles painted as heroes; the rest lie on top as glazes',
    })
  ),
  linePx: rolled(
    'blocks',
    [2, 3],
    num('blocks', 'Hairlines', 'Width', 2, 1, 6, 0.5)
  ),
  frayPx: blocks(num('blocks', 'Hairlines', 'Fray', 7, 0, 30, 0.5)),
  bleedPx: blocks(num('blocks', 'Hairlines', 'Bleed Length', 26, 0, 80, 1)),
  bleedP: rolled(
    'blocks',
    [0.04, 0.12],
    num('blocks', 'Hairlines', 'Bleed Share', 0.06, 0, 0.5, 0.01)
  ),
  dryEnd: blocks(num('blocks', 'Hairlines', 'Dry End', 0.45, 0, 1, 0.01)),
  liveFrac: rolled(
    'blocks',
    [0.4, 0.85],
    num('blocks', 'Life', 'Living Share', 0.7, 0, 1, 0.01)
  ),
  glaze: blocks(num('blocks', 'Glaze', 'Hero Opacity', 0.35, 0, 1, 0.01)),
  glazeA: blocks(
    num('blocks', 'Glaze', 'Grid Opacity', 0.74, 0, 1, 0.01, { when: isFull })
  ),
};

const wet = (item) => inFacet('wet', item);

const WET = {
  wet: rolled('wet', [0.6, 1.3], num('wet', null, 'Wetness', 1, 0, 3, 0.01)),
  wetLenMin: wet(num('wet', 'Runs', 'Min Length', 4, 0, 40, 0.5)),
  wetLenMax: rolled(
    'wet',
    [25, 60],
    num('wet', 'Runs', 'Max Length', 40, 1, 160, 1)
  ),
  wetBreath: wet(num('wet', 'Runs', 'Breath', 0.3, 0, 1, 0.01)),
  wetCross: rolled(
    'wet',
    [0.6, 1.8],
    num('wet', 'Edges', 'Cross Softening', 0.9, 0, 4, 0.05, { when: isFull })
  ),
  aaEdge: wet(flag('wet', 'Edges', 'Sub-pixel Edges', true, { when: isFull })),
  aaJitter: rolled(
    'wet',
    [0.5, 2.7],
    num('wet', 'Edges', 'Edge Jitter', 0.7, 0, 4, 0.05, { when: isFull })
  ),
  wetLic: wet(
    flag('wet', 'Runs', 'Follow Grain (LIC)', false, {
      help: 'Each tap walks on along the grain found under it; a run bends into a block’s grain (~1 ms more)',
      when: isFull,
    })
  ),
  crisp: rolled(
    'wet',
    [0.2, 0.8],
    num('wet', 'Edges', 'Crisp Column', 0.75, 0, 1, 0.01, { when: isFull })
  ),
};

const accents = (item) => inFacet('accents', item);

const ACCENTS = {
  wedge: accents(flag('accents', null, 'Wedge', true)),
  soot: accents(flag('accents', null, 'Soot', true)),
  scratches: accents(
    flag('accents', null, 'Ink Scratches', true, { when: isFull })
  ),
  redAccent: accents(
    choice('accents', null, 'Red Under Band', RED_ACCENTS, 'both', {
      when: isFull,
    })
  ),
  redDripSlots: accents(
    num('accents', 'Red', 'Drips Per Loop', 50, 1, 80, 1, { when: isFull })
  ),
  fleckDensity: accents(
    num('accents', 'Red', 'Fleck Density', 0.2, 0, 1, 0.01, { when: isFull })
  ),
};

const grade = (item) => inFacet('grade', item);

const GRADE = {
  impasto: rolled(
    'grade',
    [0, 0.8],
    num('grade', 'Impasto', 'Strength', 0, 0, 1, 0.01, {
      help: 'Lights the paint as relief: its lightness is the height',
    })
  ),
  impastoRelief: grade(num('grade', 'Impasto', 'Relief', 6, 0, 30, 0.1)),
  impastoAzimuth: rolled(
    'grade',
    [100, 170],
    num('grade', 'Impasto', 'Light Azimuth', 135, 0, 360, 1)
  ),
  impastoElevation: grade(
    num('grade', 'Impasto', 'Light Elevation', 35, 5, 85, 1)
  ),
  impastoGloss: grade(num('grade', 'Impasto', 'Gloss', 0.25, 0, 2, 0.01)),
  glow: rolled(
    'grade',
    [0.1, 0.4],
    num('grade', null, 'Glow', 0.24, 0, 1, 0.01)
  ),
  gradeWarm: grade(num('grade', null, 'Warm Gain', 1, 0.5, 1.5, 0.01)),
  gradeCool: grade(num('grade', null, 'Cool Gain', 0.95, 0.5, 1.5, 0.01)),
  flicker: grade(num('grade', 'Fire', 'Flicker', 0.08, 0, 0.5, 0.005)),
  shimmer: rolled(
    'grade',
    [0.02, 0.3],
    num('grade', 'Fire', 'Shimmer', 0.05, 0, 0.6, 0.005)
  ),
  exposure: grade(num('grade', null, 'Exposure', 1, 0.2, 3, 0.01)),
};

const composition = (item) => inFacet('composition', item);
const isGenerated = {
  composition: ['cross', 'horizon', 'portal', 'burst', 'columns'],
};

const COMPOSITION = {
  composition: composition(
    choice('composition', null, 'Composition', COMPOSITIONS, 'reference', {
      choiceLabels: {
        burst: 'Diagonal Burst',
        columns: 'Columns',
        cross: 'Cross (generated)',
        horizon: 'Horizon',
        portal: 'Portal',
        reference: 'Reference painting',
      },
      help: 'reference: the authored painting; the rest are generated from an archetype, a focal point and a seed',
    })
  ),
  compSeed: rolled(
    'composition',
    [1, 999],
    num('composition', null, 'Seed', 1, 0, 999, 1, { when: isGenerated })
  ),
  compFocusX: rolled(
    'composition',
    [0.25, 0.75],
    num('composition', null, 'Focus X', 0.4, 0, 1, 0.005, {
      help: 'The core: the column, the sun, the door, the burst’s source',
      when: isGenerated,
    })
  ),
  compFocusY: rolled(
    'composition',
    [0.35, 0.7],
    num('composition', null, 'Focus Y', 0.6, 0, 1, 0.005, {
      help: 'For a horizon, where the horizon sits',
      when: isGenerated,
    })
  ),
  compScale: rolled(
    'composition',
    [0.8, 1.35],
    num('composition', null, 'Scale', 1, 0.4, 2, 0.01, { when: isGenerated })
  ),
  compWedge: composition(
    flag('composition', null, 'Dark Wedge', true, { when: isGenerated })
  ),
};

const isImage = { fieldSource: ['image'] };

const SOURCE = {
  fieldSource: choice(
    'source',
    null,
    'Colour From',
    FIELD_SOURCES,
    'composition',
    {
      choiceLabels: { composition: 'Composition', image: 'Image / Webcam' },
      help: 'image: the smear drags a picture instead of the composition’s colour field; the composition still lays out the zones',
    }
  ),
  sourceImage: spec('string', 'source', null, 'Image', '', {
    help: 'A path under public/ (images/…) or, on the CLI, a file path',
    placeholder: 'PATH',
    when: isImage,
  }),
  sourceWebcam: sceneOnly(
    flag('source', null, 'Webcam', false, {
      help: 'Paint the live webcam instead of the image',
      when: isImage,
    })
  ),
  webcamFacing: sceneOnly(
    choice('source', null, 'Camera', ['front', 'back'], 'front', {
      when: { sourceWebcam: [true] },
    })
  ),
};

const layout = (item) => inFacet('layout', item);

const LAYOUT = {
  mirror: layout(flag('layout', null, 'Mirror', false)),
  clipSquare: layout(
    flag('layout', null, 'Clip Square', true, {
      help: 'Black bars outside the square painting; off lets the field run on',
    })
  ),
  columnLeft: rolled(
    'layout',
    [0.12, 0.3],
    num('layout', 'Columns', 'Warm Left', 0.2, 0.05, 0.45, 0.005)
  ),
  columnRight: rolled(
    'layout',
    [0.4, 0.58],
    num('layout', 'Columns', 'Warm Right', 0.49, 0.15, 0.8, 0.005)
  ),
  seamRight: rolled(
    'layout',
    [0.64, 0.82],
    num('layout', 'Columns', 'Cool Seam', 0.72, 0.3, 0.95, 0.005)
  ),
  bandLow: rolled(
    'layout',
    [0.24, 0.4],
    num('layout', 'Band', 'Bottom', 0.33, 0.05, 0.6, 0.005)
  ),
  bandHigh: rolled(
    'layout',
    [0.52, 0.68],
    num('layout', 'Band', 'Top', 0.6, 0.2, 0.85, 0.005)
  ),
  coreTop: rolled(
    'layout',
    [0.8, 0.92],
    num('layout', 'Band', 'Core Top', 0.86, 0.5, 0.97, 0.005)
  ),
};

const palette = (item) => inFacet('palette', item);

const PALETTE = {
  paletteName: palette(
    spec('string', 'palette', null, 'Palette', 'None', {
      help: 'A gradients.json palette, split into warm and cool families by r - b and laid along each family’s lightness',
      placeholder: 'NAME',
    })
  ),
  paletteMix: rolled(
    'palette',
    [0.6, 1],
    num('palette', null, 'Palette Mix', 1, 0, 1, 0.01, {
      help: 'Blend from the composition’s own colours to the palette’s',
    })
  ),
  warmHue: rolled(
    'palette',
    [-18, 10],
    num('palette', 'Warm', 'Hue Shift', 0, -60, 60, 0.5)
  ),
  warmChroma: rolled(
    'palette',
    [0.7, 1.15],
    num('palette', 'Warm', 'Chroma', 1, 0, 2, 0.01)
  ),
  warmLight: rolled(
    'palette',
    [0.9, 1.08],
    num('palette', 'Warm', 'Lightness', 1, 0.5, 1.5, 0.01)
  ),
  coolHue: rolled(
    'palette',
    [-50, 50],
    num('palette', 'Cool', 'Hue Shift', 0, -120, 120, 0.5)
  ),
  coolChroma: rolled(
    'palette',
    [0.5, 1.4],
    num('palette', 'Cool', 'Chroma', 1, 0, 2, 0.01)
  ),
  coolLight: rolled(
    'palette',
    [0.85, 1.12],
    num('palette', 'Cool', 'Lightness', 1, 0.5, 1.5, 0.01)
  ),
};

const motif = (item) => inFacet('motif', item);
const hasMotif = { motif: ['logo', 'tiled'] };
const isTiled = { motif: ['tiled'] };

const MOTIF = {
  motif: motif(
    choice('motif', null, 'Motif', MOTIFS, 'none', {
      choiceLabels: {
        logo: 'Argyle Logo',
        none: 'None',
        tiled: 'Argyle Tiled',
      },
      help: 'The argyle: eleven diamonds, or both square lattices tiled forever and eaten by noise',
    })
  ),
  motifStyle: motif(
    choice('motif', null, 'Style', MOTIF_STYLES, 'filled', {
      choiceLabels: { filled: 'Filled', outline: 'Outline' },
      when: hasMotif,
    })
  ),
  motifPlacement: motif(
    choice('motif', null, 'Placement', MOTIF_PLACEMENTS, 'both', {
      choiceLabels: {
        blocks: 'Blocks (crisp, on top)',
        both: 'Both',
        field: 'Field (dragged by the smear)',
      },
      when: hasMotif,
    })
  ),
  motifScale: motif(
    num('motif', 'Frame', 'Square Size', 0.085, 0.01, 0.4, 0.001, {
      help: 'One square’s side, as a share of the painting',
      when: hasMotif,
    })
  ),
  motifX: motif(
    num('motif', 'Frame', 'Centre X', 0.5, -0.5, 1.5, 0.001, { when: hasMotif })
  ),
  motifY: motif(
    num('motif', 'Frame', 'Centre Y', 0.5, -0.5, 1.5, 0.001, { when: hasMotif })
  ),
  motifRotation: motif(
    num('motif', 'Frame', 'Rotation', 45, 0, 180, 45, {
      help: 'Multiples of 45 keep the grain on the four fundamental angles',
      when: hasMotif,
    })
  ),
  motifLine: motif(
    num('motif', 'Frame', 'Outline Width', 0.12, 0.02, 0.45, 0.005, {
      when: { motifStyle: ['outline'] },
    })
  ),
  motifShowB: motif(
    flag('motif', 'Colour', 'Red Lattice', true, { when: hasMotif })
  ),
  motifShowT: motif(
    flag('motif', 'Colour', 'Black Lattice', true, { when: hasMotif })
  ),
  motifColorB: motif(
    color('motif', 'Colour', 'Red', '#E5202A', { when: hasMotif })
  ),
  motifColorT: motif(
    color('motif', 'Colour', 'Black', '#0A0A0A', { when: hasMotif })
  ),
  motifBleed: rolled(
    'motif',
    [0, 0.35],
    num('motif', 'Colour', 'Field Bleed', 0.15, 0, 1, 0.01, {
      help: 'How much of the field’s paint shows through a diamond',
      when: hasMotif,
    })
  ),
  motifGrain: rolled(
    'motif',
    [0.1, 0.45],
    num('motif', 'Colour', 'Grain', 0.25, 0, 1, 0.01, { when: hasMotif })
  ),
  motifErode: rolled(
    'motif',
    [0.3, 0.6],
    num('motif', 'Erosion', 'Removed', 0.45, 0, 1, 0.005, {
      help: 'Noise level below which squares and whole sections disappear',
      when: isTiled,
    })
  ),
  motifErodeScale: rolled(
    'motif',
    [0.12, 0.6],
    num('motif', 'Erosion', 'Section Scale', 0.3, 0.02, 2, 0.005, {
      help: 'Noise frequency per square: low removes broad sections, high single squares',
      when: isTiled,
    })
  ),
  motifFade: rolled(
    'motif',
    [0.2, 0.8],
    num('motif', 'Erosion', 'Fade', 0.5, 0, 1, 0.01, { when: isTiled })
  ),
  motifEdge: rolled(
    'motif',
    [0.2, 1.2],
    num('motif', 'Erosion', 'Ragged Edges', 0.6, 0, 2, 0.01, { when: hasMotif })
  ),
  motifEdgeScale: motif(
    num('motif', 'Erosion', 'Edge Scale', 6, 0.5, 30, 0.1, { when: hasMotif })
  ),
  motifBuild: motif(
    num('motif', null, 'Build', 0, 0, 1, 0.01, {
      help: 'Diamonds wipe in over the loop (the loader’s build order for the logo), hold, then wipe out',
      when: hasMotif,
    })
  ),
};

const motion = (item) => inFacet('motion', item);

const MOTION = {
  anim: motion(
    num('motion', null, 'Animation', 1, 0, 2, 0.01, {
      help: 'Scales every motion amplitude; 0 freezes the painting',
    })
  ),
  loopSeconds: motion(
    num('motion', null, 'Loop Seconds', 32, 4, 120, 1, {
      help: 'Seconds per seamless loop',
    })
  ),
  phase: rolled(
    'motion',
    [0, 1],
    num('motion', null, 'Phase', 0, 0, 1, 0.001, {
      help: 'Where in the loop a still is taken; 0 is the judged frame',
    })
  ),
  playing: sceneOnly(flag('motion', null, 'Playing', true)),
  motionSpeed: sceneOnly(num('motion', null, 'Speed', 1, 0, 4, 0.01)),
};

const QUALITY = {
  sceneView: sceneOnly(
    choice('quality', null, 'View', VIEWS, 'painting', {
      choiceLabels: {
        field: 'Colour Field (L0)',
        painting: 'Painting',
        wetness: 'Wetness + Grain',
        blocks: 'Living Blocks',
      },
    })
  ),
  renderScale: sceneOnly(
    num('quality', null, 'Render Scale', 1, 0.25, 1, 0.05, {
      help: 'Canvas resolution the painting renders at',
    })
  ),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('imperfection'),
  width: standard.width(1080),
  height: standard.height(1080),
  pixelRatio: standard.pixelRatio({ default: 1 }),
  count: standard.count('paintings'),
  png: standard.png(),
  webp: standard.webp(),
  views: standard.views(VIEWS, 'painting'),
  keep: standard.keep(FACETS),
  palettes: standard.palettes('palette'),
  base: standard.base('painting'),
  variants: {
    default: 'full,lite',
    help: `Comma-separated versions the paint roll picks from: ${VARIANTS.join(', ')}`,
    label: 'Versions',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  mode: standard.mode(
    VIDEO_MODES,
    'loop',
    'loop: each painting plays its seamless loop'
  ),
  fps: standard.fps(),
  loops: video({
    default: 1,
    help: 'Loops per painting',
    label: 'Loops',
    max: 8,
    min: 1,
    placeholder: 'N',
    step: 1,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...COMPOSITION,
  ...SOURCE,
  ...PAINT,
  ...FIELD,
  ...BLOCKS,
  ...WET,
  ...ACCENTS,
  ...GRADE,
  ...LAYOUT,
  ...PALETTE,
  ...MOTIF,
  ...MOTION,
  ...QUALITY,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 1, out: 'output/imperfection.mp4' },
  workbench: { count: 4 },
};

export function resolveVariants(list, fail = (message) => new Error(message)) {
  const variants = String(list)
    .split(',')
    .map((variant) => variant.trim())
    .filter(Boolean);
  if (variants.length === 0 || variants.some((v) => !VARIANTS.includes(v))) {
    throw fail(`variants must name only ${VARIANTS.join(', ')}.`);
  }
  return variants;
}

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    resolveVariants(options.variants, fail);
  },
  views: VIEWS,
});

export const {
  LEVA_KEYS,
  SCENE_KEYS,
  configFrom,
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  optionsFromConfig,
  presetFromConfig,
  resolveViews,
  sceneDefaults,
  sectionsFor,
  usageFor,
} = schema;
