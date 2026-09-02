// The single declaration of every knob the Rorschach renderers accept: name,
// type, range, default, and help text. The CLI derives its defaults, its
// `--flag` parser and its `--help` text from this; the dev workbench derives
// its form defaults and input min/max/step from it; the dev server validates
// incoming job options against it. Add an option here and all three surfaces
// gain it; change a range here and none of them can disagree about it.
//
// `.mjs` on purpose: this is the one kernel file the CLI imports directly
// (it needs the schema before it can start Vite to load the rest of the
// kernel), so it has to be unambiguous ESM to plain Node — and therefore must
// stay dependency-free. Everything needing three.js or an alias belongs in a
// sibling `.js` module instead.

export const VIEWS = ['front', 'back', 'top', 'bottom'];
export const VIDEO_MODES = [
  'stills',
  'growth',
  'breathe',
  'turntable',
  'cinematic',
];
export const GROWTH_PRESENTATIONS = ['grid', 'sequential'];
export const IG_PRESETS = ['story', 'reel', 'post'];
export const PAPER_ORIENTATION_NAMES = ['vertical', 'horizontal'];
export const INK_BLOOM_SOURCES = ['thickness', 'wetness'];

// A vertical iPhone screen (12/13/14/15/16 at 19.5:9). Both dimensions are
// even, which yuv420p requires. Note this is taller than Instagram's 9:16, so
// a reel will letterbox or crop — pass --width 1080 --height 1920 for an
// IG-native frame.
export const IPHONE_WIDTH = 1170;
export const IPHONE_HEIGHT = 2532;

// scope: which command accepts the option — 'shared', 'still', or 'video'.
// section: groups the option in `--help` output.
// workbenchOnly: accepted from the workbench but not a real CLI flag.
export const RENDER_OPTIONS = {
  out: {
    scope: 'shared',
    section: 'output',
    type: 'string',
    default: 'output/rorschach',
    placeholder: 'PATH',
    help: 'Output directory (stills) or file (video)',
  },
  width: {
    scope: 'shared',
    section: 'output',
    type: 'number',
    default: 1080,
    min: 64,
    max: 8192,
    step: 2,
    placeholder: 'PX',
    help: 'Output width',
  },
  height: {
    scope: 'shared',
    section: 'output',
    type: 'number',
    default: 1080,
    min: 64,
    max: 8192,
    step: 2,
    placeholder: 'PX',
    help: 'Output height',
  },
  seed: {
    scope: 'shared',
    section: 'output',
    type: 'seed',
    default: null,
    min: 0,
    max: 999999,
    step: 1,
    placeholder: 'S',
    help: 'First seed; omit for a random seed per test',
  },
  count: {
    scope: 'shared',
    section: 'output',
    type: 'number',
    default: 1,
    min: 1,
    max: 100,
    step: 1,
    placeholder: 'N',
    help: 'How many tests to roll',
  },
  renderer: {
    scope: 'shared',
    section: 'render',
    type: 'enum',
    default: 'gpu',
    choices: ['gpu', 'svg'],
    help: 'gpu (real WebGPU + post) or svg (approximation)',
  },
  distance: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 22,
    min: 1,
    max: 200,
    step: 0.5,
    placeholder: 'N',
    help: 'Camera distance; lower crops in',
  },
  fov: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 42,
    min: 1,
    max: 179,
    step: 1,
    placeholder: 'DEG',
    help: 'Vertical field of view',
  },
  flattenEnabled: {
    scope: 'shared',
    section: 'render',
    type: 'boolean',
    default: false,
    help: 'Squash the test toward 2D; --flatten sets how far',
  },
  flatten: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0.97,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'How far the flatten squashes, when --flattenEnabled is on',
  },
  flattenAxis: {
    scope: 'shared',
    section: 'render',
    type: 'enum',
    default: 'z',
    choices: ['z', 'y'],
    help: 'Axis the flatten squashes along',
  },
  simplify: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0.4,
    min: 0,
    max: 20,
    step: 0.1,
    placeholder: 'PX',
    help: 'Screen-space decimation floor',
  },
  stroke: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0,
    min: 0,
    max: 64,
    step: 0.5,
    placeholder: 'PX',
    help: 'Stroke width; 0 scales it from the output width',
  },
  bloom: {
    scope: 'shared',
    section: 'bloom',
    // The scene calls this bloomEnabled. `sceneKey` is how a workbench field
    // finds its value in a scene preset; declared here so the two names that
    // differ are recorded next to everything else about the option, rather
    // than in a lookup table on whichever surface reads presets.
    sceneKey: 'bloomEnabled',
    type: 'boolean',
    default: true,
    help: 'Bloom pass; --no-bloom skips it entirely',
  },
  bloomStrength: {
    scope: 'shared',
    section: 'bloom',
    type: 'number',
    default: 0.5,
    min: 0,
    max: 10,
    step: 0.05,
    placeholder: 'N',
    help: 'Additive glow gain',
  },
  bloomRadius: {
    scope: 'shared',
    section: 'bloom',
    type: 'number',
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Glow spread, 0-1',
  },
  bloomThreshold: {
    scope: 'shared',
    section: 'bloom',
    type: 'number',
    default: 1,
    min: 0,
    max: 10,
    step: 0.05,
    placeholder: 'N',
    help: 'Brightness a color must exceed to bloom',
  },
  overlay: {
    scope: 'shared',
    section: 'overlay',
    sceneKey: 'showOverlay',
    type: 'boolean',
    default: false,
    help: 'Burn the scene overlay into the output',
  },
  ig: {
    scope: 'shared',
    section: 'overlay',
    type: 'enum',
    default: 'post',
    choices: [...IG_PRESETS, 'none'],
    help: 'Safe-area insets; only applies with --overlay',
  },
  viewport: {
    scope: 'shared',
    section: 'overlay',
    type: 'number',
    default: null,
    min: 64,
    max: 8192,
    step: 1,
    nullable: true,
    placeholder: 'N',
    help: 'CSS pixel width the overlay emulates; output width over this is the device pixel ratio it draws at. Defaults to 390 with --ig, else 1440',
  },

  lines: {
    scope: 'shared',
    section: 'layers',
    type: 'boolean',
    default: true,
    help: 'Render the 3D stroke layer; --no-lines leaves only ink',
  },
  membrane: {
    scope: 'shared',
    section: 'layers',
    type: 'boolean',
    default: false,
    help: 'Stretch a surface across each bundle (needs line seeding)',
  },
  membraneOpacity: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0.35,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Membrane opacity',
  },
  membraneStepStride: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 1,
    min: 1,
    max: 32,
    step: 1,
    placeholder: 'N',
    help: 'Use every Nth step as a mesh row; higher is coarser and cheaper',
  },
  membraneStrandStride: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 1,
    min: 1,
    max: 8,
    step: 1,
    placeholder: 'N',
    help: 'Loft across every Nth strand, spanning wider plates',
  },
  membraneWeave: {
    scope: 'shared',
    section: 'render',
    type: 'boolean',
    default: false,
    help: 'With a strand stride, loft the skipped strands as interleaved webs',
  },
  membraneTearSoftness: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Tear edge softness; 0 is a hard cut, 1 a full gradient',
  },
  membraneEdgeFeather: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Fade the sheet toward its two boundary strands',
  },
  membraneTaper: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0,
    min: -1,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Thin the sheet toward the tips (+) or the root (-)',
  },
  membraneRim: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Weight opacity toward grazing angles, like a soap film',
  },
  membraneTint: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0,
    min: -0.5,
    max: 0.5,
    step: 0.01,
    placeholder: 'N',
    help: "Lightness offset from the bundle's stroke colour",
  },
  membraneTear: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 6,
    min: 0,
    max: 30,
    step: 0.1,
    placeholder: 'N',
    help: 'Strand gap at which the membrane tears open; 0 never tears',
  },
  ink: {
    scope: 'shared',
    section: 'layers',
    type: 'boolean',
    default: false,
    help: 'Render the watercolour layer (gpu renderer only)',
  },
  // --- the test itself -------------------------------------------------
  // Rollable parameters carry a `facet` (which stream rolls them) and, when
  // they are numeric, a `roll` window — the art-directed range, distinct from
  // the `min`/`max` the renderer will merely *accept*. Anything with a facet
  // can be pinned: pass it and the dice leave it alone.
  bundleCount: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 12,
    min: 1,
    max: 40,
    step: 1,
    roll: { max: 20, min: 6, step: 1 },
    placeholder: 'N',
    help: 'How many bundles the test is built from',
  },
  strandsPerBundle: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 36,
    min: 2,
    max: 50,
    step: 1,
    roll: { max: 50, min: 25, step: 1 },
    placeholder: 'N',
    help: 'Strands drawn per bundle',
  },
  steps: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 900,
    min: 80,
    max: 2000,
    step: 1,
    roll: { max: 2000, min: 400, step: 1 },
    placeholder: 'N',
    help: 'Curl length; how far each strand is integrated',
  },
  startSpread: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 0.35,
    min: 0.02,
    max: 1.2,
    step: 0.01,
    roll: { max: 0.7, min: 0.08, step: 0.01 },
    placeholder: 'N',
    help: 'How far apart the strands in a bundle start',
  },
  coeffRange: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 1.6,
    min: 0.5,
    max: 2.5,
    step: 0.05,
    roll: { max: 2.2, min: 0.9, step: 0.05 },
    placeholder: 'N',
    help: 'Chaos amount in the ODE coefficients',
  },
  freq: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 0.6,
    min: 0.1,
    max: 2,
    step: 0.05,
    roll: { max: 1.15, min: 0.25, step: 0.05 },
    placeholder: 'N',
    help: 'Curl frequency',
  },
  framingShape: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'enum',
    default: 'cube',
    choices: ['cube', 'sphere', 'none'],
    help: 'Volume the bundles are fitted into',
  },
  boundRadius: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 40,
    min: 5,
    max: 100,
    step: 1,
    roll: { max: 50, min: 15, step: 1 },
    placeholder: 'N',
    help: 'Sphere framing radius',
  },
  boundWidth: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 40,
    min: 5,
    max: 100,
    step: 1,
    roll: { max: 60, min: 20, step: 1 },
    placeholder: 'N',
    help: 'Cube framing width',
  },
  boundHeight: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 40,
    min: 5,
    max: 100,
    step: 1,
    roll: { max: 60, min: 20, step: 1 },
    placeholder: 'N',
    help: 'Cube framing height',
  },
  strandSeeding: {
    scope: 'shared',
    section: 'structure',
    type: 'enum',
    default: 'scatter',
    choices: ['scatter', 'line'],
    help: "How a bundle's strands are seeded; 'line' makes it loftable",
  },
  membraneSpan: {
    scope: 'shared',
    section: 'structure',
    type: 'number',
    default: 2,
    min: 0.1,
    max: 12,
    step: 0.05,
    placeholder: 'N',
    help: "Half-length of the seed segment under 'line' seeding",
  },
  minSpread: {
    scope: 'shared',
    section: 'structure',
    facet: 'structure',
    type: 'number',
    default: 8,
    min: 0,
    max: 20,
    step: 0.1,
    roll: { max: 9, min: 2, step: 0.1 },
    placeholder: 'N',
    help: 'Floor on how tightly a bundle may collapse',
  },
  // Validated against the kernel's gradient list by the caller rather than by a
  // `choices` array: this file has to stay import-free so plain Node can load
  // it, and the names live in gradients.json.
  palette: {
    scope: 'shared',
    section: 'palette',
    facet: 'palette',
    type: 'string',
    default: 'Random',
    placeholder: 'NAME',
    help: 'Gradient name, or Random for per-bundle hues',
  },
  paletteShuffleSeed: {
    scope: 'shared',
    section: 'palette',
    // Rolled by the palette stream's own bespoke logic — mostly on, and a
    // seed rather than a range when it is — so it carries the facet without a
    // `roll` window, exactly as palette and monochrome do. It was missing from
    // this file entirely, which meant the dice set it on every test and no
    // surface could hold it: two batches on one palette still came out with
    // their bundle colours in a different order.
    facet: 'palette',
    type: 'number',
    default: 0,
    min: 0,
    max: 999999,
    step: 1,
    placeholder: 'S',
    help: 'Reorders which palette stop each bundle takes; 0 keeps gradient order',
  },
  paletteExact: {
    scope: 'shared',
    section: 'palette',
    facet: 'palette',
    type: 'boolean',
    default: false,
    help: 'Use the literal palette stops instead of blending between them',
  },
  monochrome: {
    scope: 'shared',
    section: 'palette',
    facet: 'palette',
    type: 'boolean',
    default: false,
    help: 'One colour for every bundle, taken from --inkColor',
  },
  inkColor: {
    scope: 'shared',
    section: 'palette',
    facet: 'palette',
    type: 'string',
    default: '#1f1f1f',
    placeholder: 'HEX',
    help: 'Line colour in monochrome mode (not the watercolour layer)',
  },
  backgroundColor: {
    scope: 'shared',
    section: 'palette',
    facet: 'palette',
    type: 'string',
    default: '#f4efe4',
    placeholder: 'HEX',
    help: 'Scene background, and what the ink is composited over',
  },

  bundles: {
    scope: 'shared',
    section: 'palette',
    // The one option that is not a single value, because the thing it carries
    // is not one: the Bundle Editor's twenty folders of sixteen fields. As
    // three hundred flags it would drown `--help` and the workbench form
    // alike; as one object it is exactly the flat `bundleNField` block a scene
    // preset already holds, so a preset's overrides transfer verbatim.
    //
    // The palette facet, because that is the stream that rolls overrides:
    // whether a bundle may glow depends on the palette it was chosen against.
    // Pinning this holds the whole block — every bundle not named in it is
    // explicitly off — while structure and ink keep rolling.
    facet: 'palette',
    type: 'json',
    // Which keys are *meaningful* is buildOverridesFromControls' business; this
    // file is dependency-free and cannot import the field list. So it checks
    // the shape and drops the rest, which is also what lets a whole scene
    // preset be handed over as-is.
    keyPattern: /^bundle\d+[A-Z]\w*$/u,
    default: null,
    nullable: true,
    placeholder: 'JSON|FILE',
    help: 'Bundle Editor overrides as flat bundleNField keys, or a file holding them',
  },

  structureSeed: {
    scope: 'shared',
    section: 'roll',
    type: 'seed',
    default: null,
    nullable: true,
    placeholder: 'S',
    help: 'Hold the structure roll while the other facets move; blank follows --seed',
  },
  paletteSeed: {
    scope: 'shared',
    section: 'roll',
    type: 'seed',
    default: null,
    nullable: true,
    placeholder: 'S',
    help: 'Hold the palette and emissive roll; blank follows --seed',
  },
  inkSeed: {
    scope: 'shared',
    section: 'roll',
    type: 'seed',
    default: null,
    nullable: true,
    placeholder: 'S',
    help: 'Hold the ink roll; blank follows --seed',
  },
  inkResolution: {
    scope: 'shared',
    section: 'layers',
    // A number with a fixed choice list rather than `type: 'enum'`, because
    // enum coerces to a String and this value sizes render targets — a sim
    // built at "2048" is not a sim built at 2048.
    type: 'number',
    default: 2048,
    min: 256,
    max: 2048,
    choices: [256, 512, 1024, 2048],
    help: 'Watercolour sim grid; higher is finer bleed and slower',
  },
  inkSettle: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    // The blot converges long before this. Measured at both 512 and 2048, a
    // still settled 120 steps is pixel-identical to one settled 570 — the wash
    // is a relaxation toward a per-cell target, so it converges on a time
    // constant rather than by spreading, and resolution barely moves it. The
    // old 240 (plus a hidden 90) was roughly 5x the work for no visible
    // difference, and settling is essentially the entire cost of an ink render.
    default: 120,
    min: 0,
    max: 4000,
    step: 10,
    placeholder: 'N',
    help: 'Sim steps run before capture; how far the blot has dried',
  },
  inkCarry: {
    scope: 'video',
    section: 'layers',
    type: 'number',
    // The scene's `inkStepsPerFrame`, for a render: carry the wet field from the
    // last frame and advance it a few steps rather than clearing the sheet and
    // drying it again from scratch. It is the single largest cost in an ink
    // video — 840ms a frame at a 2048 sim, against 3ms carried — and it is also
    // what the live scene has always done, so a carried clip is the closer match
    // to what you tuned.
    //
    // 0 restores the per-frame settle. What that buys is not clip
    // reproducibility (a video is always rendered from frame 0, so both are
    // deterministic) but *frame* independence: with a carry, re-rendering frame
    // 400 on its own will not reproduce frame 400 of the clip.
    //
    // Never carried across a test boundary — a new seed is a new blot — so
    // stills montages are unaffected, and turntable and cinematic never reach
    // it because their ink does not change between frames at all.
    default: 0,
    min: 0,
    max: 200,
    step: 1,
    placeholder: 'N',
    help: 'Carry the wet sim between frames, running this many steps each; 0 re-settles every frame',
  },
  inkOrientation: {
    scope: 'shared',
    section: 'layers',
    type: 'enum',
    default: 'vertical',
    choices: PAPER_ORIENTATION_NAMES,
    help: 'Paper plane: vertical at z, horizontal at y',
  },
  inkOffset: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0,
    min: -50,
    max: 50,
    step: 0.1,
    placeholder: 'N',
    help: 'Paper position along its normal',
  },
  inkPaperSize: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 20,
    min: 1,
    max: 200,
    step: 0.5,
    placeholder: 'N',
    help: 'Paper extent in world units',
  },
  inkPaperGrain: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.8, min: 0.3, step: 0.05 },
    type: 'number',
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Paper tooth; drives granulation and capillary capacity',
  },
  inkTonalGap: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0.18,
    min: 0,
    max: 0.5,
    step: 0.01,
    placeholder: 'N',
    help: 'Lightness the ink is pushed away from the lines, so the layers never match',
  },
  inkRecede: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0.15,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'How far the ink settles toward the background; reads as distance',
  },
  inkDesaturate: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0.2,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Chroma drained from the ink, so line work sits in front of it',
  },
  inkBloom: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    type: 'boolean',
    default: false,
    help: "Let the ink glow past the bloom threshold; the scene's bloom must also be on",
  },
  inkBloomStrength: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    type: 'number',
    // How far past the bloom threshold the ink's luminance is lifted — an
    // absolute distance, not a multiplier, so it means the same thing for every
    // pigment in a palette.
    default: 0.4,
    min: 0,
    max: 3,
    step: 0.05,
    placeholder: 'N',
    help: 'How far past the bloom threshold the ink is lifted',
  },
  inkBloomEmissiveOnly: {
    scope: 'shared',
    section: 'layers',
    type: 'boolean',
    default: true,
    help: 'Glow only pigment from emissive bundles, as the lines do; off glows the whole blot',
  },
  inkBloomSource: {
    scope: 'shared',
    section: 'layers',
    type: 'enum',
    default: 'thickness',
    choices: INK_BLOOM_SOURCES,
    help: 'What glows: dense paint, or paint that is still wet',
  },
  inkPatternFlow: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.7, min: 0.15, step: 0.05 },
    type: 'number',
    // Not 0. The pattern is the ink's only pigment source, so a wash of 0
    // renders a bare background and a flow of 0 renders it bone dry — which is
    // what `--ink` with no other flags used to do. These defaults were set when
    // the trajectories were the paint and the pattern was an optional extra.
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Classic pattern drives the water: the blot stays wet and drifts instead of drying still',
  },
  inkPatternWash: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 1, min: 0.6, step: 0.05 },
    type: 'number',
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Pigment laid down by the classic pattern itself, alongside the trajectories',
  },
  inkPatternFade: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.15, min: 0.03, step: 0.005 },
    type: 'number',
    default: 0.08,
    min: 0.005,
    max: 0.5,
    step: 0.005,
    placeholder: 'N',
    help: 'How fast paint is reclaimed; low keeps more history and bleeds further',
  },
  inkPatternScale: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 2.5, min: 0.5, step: 0.5 },
    type: 'number',
    default: 1,
    min: 0.5,
    max: 10,
    step: 0.5,
    placeholder: 'N',
    help: 'Pattern feature size',
  },
  inkPatternDensity: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.65, min: 0.35, step: 0.01 },
    type: 'number',
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'How much of the sheet the pattern covers',
  },
  inkPatternSharpness: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.98, min: 0.85, step: 0.01 },
    type: 'number',
    default: 0.95,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Pattern edge hardness; high is a decided ink boundary',
  },
  inkPatternSoftness: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.07, min: 0.02, step: 0.005 },
    type: 'number',
    default: 0.04,
    min: 0.01,
    max: 0.25,
    step: 0.005,
    placeholder: 'N',
    help: 'Gradient width the sim gets across the blot edge; how far paint bleeds',
  },
  inkPatternDetails: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 5, min: 2.5, step: 0.25 },
    type: 'number',
    default: 3.75,
    min: 1,
    max: 5,
    step: 0.01,
    placeholder: 'N',
    help: 'Pattern noise octaves',
  },
  inkPatternSymmetry: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 1, min: 0.5, step: 0.01 },
    type: 'number',
    default: 0.5,
    min: 0.5,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Pattern bilateral symmetry',
  },
  inkPatternSpeed: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 1,
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'N',
    help: 'How fast the pattern evolves; 0 freezes it',
  },
  inkPaletteMix: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 1, min: 0.3, step: 0.05 },
    type: 'number',
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'How far the wash spreads across the palette; 0 is one pigment only',
  },
  inkPaletteScale: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 4, min: 0.8, step: 0.1 },
    type: 'number',
    default: 1.5,
    min: 0.2,
    max: 8,
    step: 0.1,
    placeholder: 'N',
    help: 'Size of the colour regions; low is a few broad washes',
  },
  inkPaletteSymmetry: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 1, min: 0.6, step: 0.05 },
    type: 'number',
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Mirrors the colour regions across the fold; below 1 each half colours itself',
  },
  inkCellAmount: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 1, min: 0.35, step: 0.05 },
    type: 'number',
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'How hard revealed areas break into cell-noise blocks',
  },
  inkCellReveal: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 0.8, min: 0.3, step: 0.01 },
    type: 'number',
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'How much of the sheet the pixelation reveal exposes',
  },
  inkCellScale: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 60, min: 8, step: 1 },
    type: 'number',
    default: 24,
    min: 2,
    max: 200,
    step: 1,
    placeholder: 'N',
    help: 'Cell count across the sheet; higher is finer pixels',
  },
  inkCellFlatten: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: '1 makes each revealed cell one flat colour; 0 lets colour vary inside it',
  },
  inkCellRevealScale: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 5, min: 1.5, step: 0.1 },
    type: 'number',
    default: 3,
    min: 0.5,
    max: 12,
    step: 0.1,
    placeholder: 'N',
    help: 'Scale of the field deciding where pixelation appears',
  },
  inkCellSymmetry: {
    scope: 'shared',
    section: 'layers',
    facet: 'ink',
    roll: { max: 1, min: 0, step: 0.05 },
    type: 'number',
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Mirrors where pixelation lands; full 0-1, unlike the blot symmetry',
  },
  inkPatternTime: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0,
    min: 0,
    max: 1000,
    step: 0.1,
    placeholder: 'N',
    help: 'Pattern clock for stills; breathe mode advances it, the scene runs it live',
  },

  views: {
    scope: 'still',
    section: 'output',
    type: 'enum',
    default: VIEWS.join(','),
    choices: [...VIEWS, VIEWS.join(',')],
    placeholder: 'LIST',
    help: 'Which views to render',
  },
  png: {
    scope: 'still',
    section: 'output',
    type: 'boolean',
    default: true,
    help: 'PNG output; --no-png skips it',
  },
  svg: {
    scope: 'still',
    section: 'output',
    type: 'boolean',
    default: false,
    help: 'Also write editable SVG output',
  },
  webp: {
    scope: 'still',
    section: 'output',
    type: 'boolean',
    default: false,
    help: 'Also write lossless WebP output',
  },

  mode: {
    scope: 'video',
    section: 'output',
    type: 'enum',
    default: 'stills',
    choices: VIDEO_MODES,
    help: 'Which video mode to render',
  },
  fps: {
    scope: 'video',
    section: 'output',
    type: 'number',
    default: 30,
    min: 1,
    max: 120,
    step: 1,
    placeholder: 'N',
    help: 'Frame rate',
  },
  hold: {
    scope: 'video',
    section: 'timing',
    type: 'number',
    default: 2,
    min: 0.1,
    max: 120,
    step: 0.1,
    placeholder: 'S',
    help: 'Seconds per still / growing test / revolution / half-revolution',
  },
  crossfade: {
    scope: 'video',
    section: 'timing',
    type: 'number',
    default: 0.5,
    min: 0,
    max: 30,
    step: 0.1,
    placeholder: 'S',
    help: 'stills: seconds of fade between stills, 0 to cut',
  },
  view: {
    scope: 'video',
    section: 'timing',
    type: 'enum',
    default: 'front',
    choices: VIEWS,
    help: 'stills: which view to use',
  },
  growthView: {
    scope: 'video',
    section: 'timing',
    type: 'enum',
    default: 'front',
    choices: [...VIEWS, 'all'],
    help: 'growth: fixed view or all four views',
  },
  growthPresentation: {
    scope: 'video',
    section: 'timing',
    type: 'enum',
    default: 'grid',
    choices: GROWTH_PRESENTATIONS,
    help: 'growth all-view presentation',
  },
  turns: {
    scope: 'video',
    section: 'timing',
    type: 'number',
    default: 1,
    min: 0.1,
    max: 100,
    step: 0.1,
    placeholder: 'N',
    help: 'turntable: full revolutions',
  },
  systems: {
    scope: 'video',
    section: 'timing',
    type: 'number',
    default: 3,
    min: 1,
    max: 100,
    step: 1,
    placeholder: 'N',
    help: 'cinematic: half-revolutions, i.e. tests shown',
  },
  imageFormat: {
    scope: 'video',
    section: 'source',
    type: 'enum',
    default: 'png',
    choices: ['png', 'webp'],
    placeholder: 'F',
    help: 'stills/growth: format of retained source images',
  },
  in: {
    scope: 'video',
    section: 'source',
    // Set by the dev server from the job's own output directory; there is
    // nothing for an operator to type here.
    cliOnly: true,
    type: 'string',
    default: null,
    nullable: true,
    placeholder: 'DIR',
    help: 'stills: use PNGs from a rorschach:generate run instead',
  },
  stillsOut: {
    scope: 'video',
    section: 'source',
    // Set by the dev server from the job's own output directory; there is
    // nothing for an operator to type here.
    cliOnly: true,
    type: 'string',
    default: null,
    nullable: true,
    placeholder: 'DIR',
    help: 'stills/growth: keep generated source images in this directory',
  },
  keepImages: {
    scope: 'video',
    section: 'source',
    type: 'boolean',
    default: true,
    // The CLI has no --keepImages; the workbench turns this into a --stillsOut
    // path under the job directory. Declared here anyway so the job payload it
    // sends is validated like every other option.
    workbenchOnly: true,
    help: 'Keep generated source images alongside the video',
  },
};

// Per-surface deviations from the canonical defaults above. Every difference
// between the two CLIs and the workbench lives here and only here — if a
// surface isn't listed for a key, it uses the canonical default, so this table
// doubles as the list of every intentional inconsistency in the pipeline.
export const SURFACE_DEFAULTS = {
  'cli-still': {},
  'cli-video': {
    count: 6,
    inkCarry: 2,
    height: IPHONE_HEIGHT,
    out: 'output/rorschach.mp4',
    overlay: true,
    width: IPHONE_WIDTH,
  },
  // Seeded from scene preset 012, so the page opens on a look that is known to
  // work rather than on the schema's neutral values. These are only the
  // starting point: a rollable field is still unpinned, so what is shown here
  // is what the dice will replace unless the field is enabled.
  workbench: {
    count: 10,
    height: 2622,
    inkCarry: 2,
    overlay: true,
    views: 'front',
    width: 1206,

    bundleCount: 12,
    strandsPerBundle: 50,
    steps: 2000,
    startSpread: 0.35,
    coeffRange: 1.6,
    freq: 0.6,
    framingShape: 'none',
    boundRadius: 40,
    boundWidth: 40,
    boundHeight: 40,
    minSpread: 7,

    monochrome: false,
    palette: 'Midnight 15 (lospec)',
    paletteExact: true,
    inkColor: '#1f1f1f',
    backgroundColor: '#5a5a5a',

    flattenEnabled: true,
    flatten: 0.97,
    flattenAxis: 'z',

    lines: true,
    ink: true,
    inkOrientation: 'vertical',
    inkOffset: -3.3,
    inkPaperSize: 20,
    inkPaperGrain: 0.5,
    inkResolution: 2048,

    inkPatternWash: 1,
    inkPatternFlow: 1,
    inkPatternFade: 0.5,
    inkPatternSoftness: 0.115,
    inkPatternScale: 2,
    inkPatternDensity: 0.5,
    inkPatternSharpness: 0.95,
    inkPatternDetails: 3.75,
    inkPatternSymmetry: 0.5,
    inkPatternSpeed: 1,

    inkPaletteMix: 0.5,
    inkPaletteScale: 4.5,
    inkPaletteSymmetry: 1,

    inkCellAmount: 1,
    inkCellReveal: 0.57,
    inkCellFlatten: 1,
    inkCellScale: 15,
    inkCellRevealScale: 3.3,
    inkCellSymmetry: 0,

    inkBloom: false,
    inkBloomEmissiveOnly: true,
    inkBloomStrength: 0.4,
    inkBloomSource: 'thickness',
  },
};

export function optionsFor(kind, surface = `cli-${kind}`) {
  return Object.entries(RENDER_OPTIONS).filter(
    ([, spec]) =>
      (spec.scope === 'shared' || spec.scope === kind) &&
      (!spec.workbenchOnly || surface === 'workbench')
  );
}

// Which options exist only to drive a render, and so have no control in the
// scene: output framing, the CLIs' own plumbing, and the video modes. Every
// other option in this file is a scene control under `sceneKey ?? key`, which
// is what lets a still's sidecar be written back out as a preset the scene can
// open. `bundles` belongs here because it is a transport rather than a control
// — a preset carries the flat `bundleNField` keys it expands into.
//
// The exception is listed rather than the rule because it is the smaller half,
// and `npm run rorschach:check` holds it against the scene's Leva schema. That
// check is the point: reading a preset can safely guess a key by name, since a
// wrong guess simply doesn't match, but *writing* one cannot — a wrong name
// produces a preset the scene silently half-ignores, which nothing else here
// would catch.
// The same four axis-aligned eyes `renderTestSvg`'s `viewEye` returns. Repeated
// rather than imported because this file is dependency-free by rule; kept
// honest by `npm run rorschach:check`.
function viewEyeFor(view, distance) {
  if (view === 'back') return [0, 0, -distance];
  if (view === 'top') return [0, distance, 0];
  if (view === 'bottom') return [0, -distance, 0];
  return [0, 0, distance];
}

export const HEADLESS_ONLY_OPTIONS = new Set([
  'bundles',
  'count',
  'crossfade',
  'distance',
  'fov',
  'fps',
  'growthPresentation',
  'growthView',
  'height',
  'hold',
  'ig',
  'imageFormat',
  'in',
  'inkCarry',
  'inkPatternTime',
  'inkSeed',
  'inkSettle',
  'keepImages',
  'mode',
  'out',
  'paletteSeed',
  'png',
  'renderer',
  'simplify',
  'stillsOut',
  'stroke',
  'structureSeed',
  'svg',
  'systems',
  'turns',
  'view',
  'viewport',
  'views',
  'webp',
  'width',
]);

// A scene preset is this same flat key space plus the scene's own camera,
// growth and evolution controls — it is a Leva snapshot, and the renderers
// understand a subset of it. This picks out that subset, so a look tuned live
// can be loaded straight into a batch: keys the schema doesn't know are
// dropped, the two the scene names differently are found through `sceneKey`,
// and an option declared with a `keyPattern` (there is one, `bundles`)
// collects every preset key matching it into one object.
//
// Only what the preset actually says. A missing key is left at whatever the
// caller already had rather than reset to a default, because a preset is a
// partial snapshot — SceneTemplate's own Default preset is written that way.
export function optionsFromPreset(preset, kind, surface = 'workbench') {
  const chosen = {};
  optionsFor(kind, surface).forEach(([key, spec]) => {
    // Where output goes belongs to whoever is running the job. A still's
    // sidecar records the directory it was written to, and loading that back
    // into a form aimed a new batch at the old batch's folder — harmless only
    // because the dev server overwrites it, which is not a thing to rely on.
    if (key === 'out' || spec.cliOnly) return;
    if (spec.keyPattern) {
      const matches = Object.entries(preset).filter(([name]) =>
        spec.keyPattern.test(name)
      );
      if (matches.length > 0) chosen[key] = Object.fromEntries(matches);
      return;
    }
    const sourceKey = spec.sceneKey ?? key;
    // `null` is "not set", the same as the key being absent — a still's sidecar
    // records every nullable option that way, and copying one into the form
    // hands a controlled `<select>` a null value.
    if (preset[sourceKey] != null) chosen[key] = preset[sourceKey];
  });
  return chosen;
}

// The other direction: a still's `props.json` back out as a scene preset, so a
// piece worth keeping can be opened in the 3D scene rather than only looked at.
//
// The rolled config is already a valid preset — that is `rollTestConfig`'s
// contract — so it is the base, and `render` fills in what the dice never
// touched: the flatten, the layer toggles, the bloom and the paper. The roll
// wins every collision, because `render` carries every rollable option at its
// *default* wherever the batch left it to the dice, and a default is not what
// was drawn.
//
// The camera is derived rather than carried: a still names a view and a
// distance, and the scene wants an orbit position. Framing the scene the way
// the still was framed is the whole point of opening it.
export function presetFromRender(
  { preset, render = {}, view = 'front' },
  kind
) {
  const fromRender = {};
  optionsFor(kind, 'workbench').forEach(([key, spec]) => {
    if (HEADLESS_ONLY_OPTIONS.has(key) || spec.cliOnly) return;
    if (!(key in render) || render[key] == null) return;
    fromRender[spec.sceneKey ?? key] = render[key];
  });

  const eye = viewEyeFor(
    view,
    render.distance ?? RENDER_OPTIONS.distance.default
  );
  const fov = render.fov ?? RENDER_OPTIONS.fov.default;
  const origin = { x: 0, y: 0, z: 0 };
  const position = { x: eye[0], y: eye[1], z: eye[2] };

  return {
    ...fromRender,
    ...preset,
    cameraMode: 'orbit',
    orbitDesktopFov: fov,
    orbitDesktopPivot: origin,
    orbitDesktopPosition: position,
    orbitDesktopTarget: origin,
    orbitMobileFov: fov,
    orbitMobilePivot: origin,
    orbitMobilePosition: position,
    orbitMobileTarget: origin,
  };
}

export function defaultsFor(kind, surface = `cli-${kind}`) {
  const deviations = SURFACE_DEFAULTS[surface] ?? {};
  return Object.fromEntries(
    optionsFor(kind, surface).map(([key, spec]) => [
      key,
      key in deviations ? deviations[key] : spec.default,
    ])
  );
}

function flagSignature(key, spec) {
  if (spec.type === 'boolean') return spec.default ? `--no-${key}` : `--${key}`;
  if (spec.choices && !spec.placeholder) {
    return `--${key} ${spec.choices.join('|')}`;
  }
  return `--${key} ${spec.placeholder ?? 'VALUE'}`;
}

const SECTION_LABELS = {
  output: 'output',
  render: 'render',
  bloom: 'bloom',
  overlay: 'overlay',
  layers: 'layers',
  timing: 'mode timing',
  palette: 'palette',
  roll: 'rolling',
  structure: 'structure',
  source: 'source frames',
};

// The `--help` body, generated so a flag can never exist without being
// documented or be documented with a stale default.
export function usageFor(kind, surface = `cli-${kind}`) {
  const defaults = defaultsFor(kind, surface);
  const bySection = new Map();
  optionsFor(kind, surface).forEach(([key, spec]) => {
    const section = spec.section ?? 'output';
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push([key, spec]);
  });

  const width =
    Math.max(
      ...optionsFor(kind, surface).map(
        ([key, spec]) => flagSignature(key, spec).length
      )
    ) + 2;

  const lines = [];
  bySection.forEach((entries, section) => {
    lines.push(``, ` ${SECTION_LABELS[section] ?? section}`);
    entries.forEach(([key, spec]) => {
      const shown = defaults[key];
      const suffix =
        spec.type === 'boolean' || shown == null
          ? ''
          : ` (default ${JSON.stringify(shown)})`;
      lines.push(
        `  ${flagSignature(key, spec).padEnd(width)}${spec.help}${suffix}`
      );
    });
  });
  return `${lines.join('\n')}\n`;
}

// `ig none` (or `--no-ig`) turns the safe-area insets off; anything else has
// to name a real preset rather than silently rendering the wrong layout.
export function resolveIgPreset(value) {
  if (value === false || value === null || value === 'none') return null;
  if (IG_PRESETS.includes(value)) return value;
  throw new Error(`--ig must be one of ${IG_PRESETS.join(', ')}, or none`);
}

export function resolveViews(list) {
  const views = String(list)
    .split(',')
    .map((view) => view.trim())
    .filter((view) => VIEWS.includes(view));

  if (views.length === 0) {
    throw new Error(`--views must name at least one of ${VIEWS.join(',')}`);
  }
  return views;
}

// Coerces and range-checks one raw value against its spec. `fail` builds the
// error the caller wants — the CLI throws plain Errors, the dev server throws
// its own typed RorschachRequestError so the workbench gets a 400.
function coerce(key, spec, raw, fallback, fail) {
  if (spec.type === 'boolean') {
    return raw == null ? fallback : raw !== false && raw !== 'false';
  }

  const empty = raw === '' || raw == null;
  if (empty && (spec.nullable || spec.type === 'seed')) return fallback ?? null;
  if (empty) return fallback;

  if (spec.type === 'json') {
    let value = raw;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        throw fail(`${key} must be a JSON object.`);
      }
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw fail(`${key} must be a JSON object.`);
    }
    // A whole preset is a legitimate payload — take the keys this option is
    // about and leave the rest of it alone.
    const kept = Object.entries(value).filter(
      ([name]) => !spec.keyPattern || spec.keyPattern.test(name)
    );
    if (kept.length === 0) {
      throw fail(`${key} holds no ${spec.placeholder ?? key} entries.`);
    }
    return Object.fromEntries(kept);
  }

  if (spec.type === 'enum') {
    const value = String(raw);
    if (!spec.choices.includes(value)) {
      throw fail(`${key} must be one of ${spec.choices.join(', ')}.`);
    }
    return value;
  }

  if (spec.type === 'string') return String(raw);

  const value = Number(raw);
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) {
    throw fail(`${key} must be a number between ${spec.min} and ${spec.max}.`);
  }
  if (spec.choices && !spec.choices.includes(value)) {
    throw fail(`${key} must be one of ${spec.choices.join(', ')}.`);
  }
  return value;
}

// Validates a whole raw option bag for one command. Unknown keys are dropped
// rather than passed through, so a stale workbench field can't reach the CLI
// as an unrecognised flag.
export function normalizeOptions(
  kind,
  raw = {},
  { fail = (message) => new Error(message), surface = `cli-${kind}` } = {}
) {
  const defaults = defaultsFor(kind, surface);
  const options = Object.fromEntries(
    optionsFor(kind, surface).map(([key, spec]) => [
      key,
      coerce(key, spec, raw[key], defaults[key], fail),
    ])
  );

  if (kind === 'still' && !options.png && !options.svg && !options.webp) {
    throw fail('Select at least one output format: PNG, SVG, or WebP.');
  }
  return options;
}
