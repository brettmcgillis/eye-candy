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
export const VIDEO_MODES = ['stills', 'growth', 'turntable', 'cinematic'];
export const GROWTH_PRESENTATIONS = ['grid', 'sequential'];
export const IG_PRESETS = ['story', 'reel', 'post'];
export const DEPOSITION_MODE_NAMES = ['brush', 'stamp', 'wash'];
export const PAPER_ORIENTATION_NAMES = ['vertical', 'horizontal'];

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
  flatten: {
    scope: 'shared',
    section: 'render',
    type: 'number',
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: '0-1 squash toward 2D',
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
  ink: {
    scope: 'shared',
    section: 'layers',
    type: 'boolean',
    default: false,
    help: 'Render the watercolour layer (gpu renderer only)',
  },
  inkResolution: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 512,
    min: 128,
    max: 2048,
    step: 128,
    placeholder: 'PX',
    help: 'Watercolour sim grid; higher is finer bleed and slower',
  },
  inkSettle: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 240,
    min: 0,
    max: 4000,
    step: 10,
    placeholder: 'N',
    help: 'Sim steps run before capture; how far the blot has dried',
  },
  inkDeposition: {
    scope: 'shared',
    section: 'layers',
    type: 'enum',
    default: 'stamp',
    choices: DEPOSITION_MODE_NAMES,
    help: 'How trajectories lay down paint',
  },
  inkBrushSize: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0.22,
    min: 0.01,
    max: 3,
    step: 0.01,
    placeholder: 'N',
    help: 'Brush radius in world units',
  },
  inkStrength: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0.55,
    min: 0.01,
    max: 4,
    step: 0.01,
    placeholder: 'N',
    help: 'Pigment laid down per stamp',
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
  inkPaperColor: {
    scope: 'shared',
    section: 'layers',
    type: 'string',
    default: '#f4f1e8',
    placeholder: 'HEX',
    help: 'Paper stock colour',
  },
  inkPaperGrain: {
    scope: 'shared',
    section: 'layers',
    type: 'number',
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: 'N',
    help: 'Paper tooth; drives granulation and capillary capacity',
  },
  inkShowPaper: {
    scope: 'shared',
    section: 'layers',
    type: 'boolean',
    default: true,
    help: 'Draw the sheet itself; off leaves pigment floating',
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
    type: 'string',
    default: null,
    nullable: true,
    placeholder: 'DIR',
    help: 'stills: use PNGs from a rorschach:generate run instead',
  },
  stillsOut: {
    scope: 'video',
    section: 'source',
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
    height: IPHONE_HEIGHT,
    out: 'output/rorschach.mp4',
    overlay: true,
    width: IPHONE_WIDTH,
  },
  workbench: {
    count: 10,
    height: 2622,
    overlay: true,
    views: 'front',
    width: 1206,
  },
};

export function optionsFor(kind, surface = `cli-${kind}`) {
  return Object.entries(RENDER_OPTIONS).filter(
    ([, spec]) =>
      (spec.scope === 'shared' || spec.scope === kind) &&
      (!spec.workbenchOnly || surface === 'workbench')
  );
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
  if (spec.type === 'enum' && !spec.placeholder) {
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
