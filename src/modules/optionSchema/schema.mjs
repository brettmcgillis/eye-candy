// A declarative option table shared by every headless generator: one spec per
// knob drives the CLI's defaults, `--flag` parsing and `--help`, the
// workbench's form, the scene's Leva folders and the dev server's validation.
// Dependency-free `.mjs` so plain Node and Vite's config loader can both
// import it by relative path.
//
// Spec fields:
//   scope        'shared' or a job kind ('still', 'video')
//   section      top-level group: `--help` heading, workbench section, Leva folder
//   group        dotted folder path inside the section, or null
//   type         number | seed | boolean | enum | string | json | color
//   choiceLabels display names for an enum's choices
//   facet        the roll stream that may set it; absent = never rolled
//   roll         { min, max, step } art-directed window for the dice
//   when         { otherKey: [values] } shows the control only while they hold
//   scene        a scene control (lands in presets); rig = owned by the light/post rig
//   sceneKey     the scene's name for the key when it differs
//   cliOnly      owned by the job runner, never offered as a form field
//   sceneOnly    a scene control that is not a render option at all
//   workbenchOnly  accepted from the workbench but not a CLI flag
//   nullable     an empty value means "unset" rather than the default
//   aliases      old names the key is still accepted under (flags, job JSON)
//   choiceAliases  { oldChoice: choice } for an enum's renamed choices

const HEX_COLOR = /^#[0-9a-f]{6}$/iu;

function flagSignature(key, spec) {
  if (spec.type === 'boolean') return spec.default ? `--no-${key}` : `--${key}`;
  if (spec.choices && !spec.placeholder) {
    return `--${key} ${spec.choices.join('|')}`;
  }
  return `--${key} ${spec.placeholder ?? 'VALUE'}`;
}

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
        throw fail(`${key} must be JSON.`);
      }
    }
    if (spec.array) {
      if (!Array.isArray(value)) throw fail(`${key} must be a JSON array.`);
      return value;
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
    const value = spec.choiceAliases?.[raw] ?? String(raw);
    if (!spec.choices.includes(value)) {
      throw fail(`${key} must be one of ${spec.choices.join(', ')}.`);
    }
    return value;
  }

  if (spec.type === 'color') {
    const value = String(raw);
    if (!HEX_COLOR.test(value)) throw fail(`${key} must be a #rrggbb colour.`);
    return value.toLowerCase();
  }

  if (spec.type === 'string') return String(raw);

  // Seeds may be words: the Flora scene seeds with strings like 'heart'.
  if (spec.type === 'seed' && spec.text) return String(raw);

  const value = Number(raw);
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) {
    throw fail(`${key} must be a number between ${spec.min} and ${spec.max}.`);
  }
  if (spec.choices && !spec.choices.includes(value)) {
    throw fail(`${key} must be one of ${spec.choices.join(', ')}.`);
  }
  return value;
}

// The render chrome every workbench shares, always after a kernel's own
// sections and always in this order.
export const SHARED_SECTIONS = [
  'output',
  'svg',
  'render',
  'roll',
  'video',
  'overlay',
];
const SHARED_LABELS = { color: 'colour', roll: 'rolling' };

function orderSections(ids) {
  const content = ids.filter((id) => !SHARED_SECTIONS.includes(id));
  const shared = SHARED_SECTIONS.filter((id) => ids.includes(id));
  return [...content, ...shared];
}

const FORMATS = { png: 'PNG', webp: 'WebP', svg: 'SVG', dxf: 'DXF' };
const MAX_SIDE = 8192;

const listOf = (names) =>
  names.length > 1
    ? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}`
    : names.join('');

export function resolveList(list, allowed, name, fail) {
  const items = String(list)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0 || items.some((item) => !allowed.includes(item))) {
    throw fail(`${name} must name only ${allowed.join(', ')}.`);
  }
  return items;
}

// The checks every generator shares; each applies only when its keys exist.
function checkOutput(options, fail, resolveViews) {
  const formats = Object.keys(FORMATS).filter((key) => key in options);
  if (formats.length > 0 && !formats.some((key) => options[key])) {
    throw fail(
      `Select at least one output format: ${listOf(formats.map((key) => FORMATS[key]))}.`
    );
  }
  if (options.width != null && options.pixelRatio != null) {
    const longest = Math.max(options.width, options.height);
    const side = Math.round(longest * options.pixelRatio);
    if (side > MAX_SIDE) {
      throw fail(
        `width×pixelRatio must stay within ${MAX_SIDE}; the longest side would be ${side}.`
      );
    }
  }
  if (resolveViews && 'views' in options) resolveViews(options.views, fail);
}

export default function createOptionSchema({
  configKeys = (spec) => spec.scene,
  options,
  sectionLabels: kernelLabels = {},
  surfaceDefaults = {},
  validate,
  views,
}) {
  const sectionLabels = { ...SHARED_LABELS, ...kernelLabels };
  const ALIASES = new Map(
    Object.entries(options).flatMap(([key, spec]) =>
      (spec.aliases ?? []).map((alias) => [alias, key])
    )
  );
  const canonicalKey = (name) => ALIASES.get(name) ?? name;

  // A renamed key's old spelling reaches the new one when the new one is
  // absent, so saved jobs and sidecars keep working.
  function withAliases(raw) {
    const resolved = { ...raw };
    ALIASES.forEach((key, alias) => {
      if (resolved[key] === undefined && raw[alias] !== undefined) {
        resolved[key] = raw[alias];
      }
      delete resolved[alias];
    });
    return resolved;
  }

  // Old flag spellings on argv, rewritten before defaults are merged in.
  const canonicalArgv = (argv) =>
    argv.map((token) => {
      const match = /^--(no-)?(\w+)$/u.exec(token);
      if (!match || !ALIASES.has(match[2])) return token;
      return `--${match[1] ?? ''}${ALIASES.get(match[2])}`;
    });
  const resolveViews = views
    ? (list, fail = (message) => new Error(message)) =>
        resolveList(list, views, 'views', fail)
    : undefined;

  // `sceneOnly` marks a control that belongs to a scene preset but is not a
  // render setting, so no surface offers it as an option.
  function optionsFor(kind, surface = `cli-${kind}`) {
    return Object.entries(options).filter(
      ([, spec]) =>
        !spec.sceneOnly &&
        (spec.scope === 'shared' || spec.scope === kind) &&
        (!spec.workbenchOnly || surface === 'workbench')
    );
  }

  function defaultsFor(kind, surface = `cli-${kind}`) {
    const deviations = surfaceDefaults[surface] ?? {};
    return Object.fromEntries(
      optionsFor(kind, surface).map(([key, spec]) => [
        key,
        key in deviations ? deviations[key] : spec.default,
      ])
    );
  }

  // The `--help` body, generated so a flag can never exist without being
  // documented or be documented with a stale default.
  function usageFor(kind, surface = `cli-${kind}`) {
    const defaults = defaultsFor(kind, surface);
    const entries = optionsFor(kind, surface);
    const bySection = new Map();
    entries.forEach(([key, spec]) => {
      const section = spec.section ?? 'output';
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section).push([key, spec]);
    });
    const ordered = orderSections([...bySection.keys()]);

    const width =
      Math.max(
        ...entries.map(([key, spec]) => flagSignature(key, spec).length)
      ) + 2;

    const lines = [];
    ordered.forEach((section) => {
      lines.push(``, ` ${sectionLabels[section] ?? section}`);
      bySection.get(section).forEach(([key, spec]) => {
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

  // Unknown keys are dropped rather than passed through, so a stale workbench
  // field can't reach the CLI as an unrecognised flag.
  function normalizeOptions(
    kind,
    raw = {},
    { fail = (message) => new Error(message), surface = `cli-${kind}` } = {}
  ) {
    const defaults = defaultsFor(kind, surface);
    const given = withAliases(raw);
    const normalized = Object.fromEntries(
      optionsFor(kind, surface).map(([key, spec]) => [
        key,
        coerce(key, spec, given[key], defaults[key], fail),
      ])
    );
    checkOutput(normalized, fail, resolveViews);
    validate?.(kind, normalized, fail);
    return normalized;
  }

  function facets() {
    return [
      ...new Set(
        Object.values(options)
          .map((spec) => spec.facet)
          .filter(Boolean)
      ),
    ];
  }

  function keysInFacet(facet) {
    return Object.entries(options)
      .filter(([, spec]) => spec.facet === facet)
      .map(([key]) => key);
  }

  function sectionsFor(kind, surface = 'workbench') {
    const bySection = new Map();
    optionsFor(kind, surface).forEach(([key, spec]) => {
      const section = spec.section ?? 'output';
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section).push(key);
    });
    return orderSections([...bySection.keys()]).map((id) => ({
      id,
      keys: bySection.get(id),
      label: sectionLabels[id] ?? id,
    }));
  }

  const keysWhere = (test) =>
    Object.entries(options)
      .filter(([, spec]) => test(spec))
      .map(([key]) => key);

  const SCENE_KEYS = keysWhere((spec) => spec.scene);
  const sceneNameFor = (key) => options[key].sceneKey ?? key;
  // The same scene controls under the names scenes and presets use, for a
  // scene that builds Leva straight from the specs.
  const LEVA_KEYS = keysWhere((spec) => spec.scene && !spec.rig);
  const SCENE_NAMES = SCENE_KEYS.map(sceneNameFor);
  const SCENE_OPTIONS = Object.fromEntries(
    SCENE_KEYS.map((key) => [sceneNameFor(key), options[key]])
  );
  const sceneNamed = (values) =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key in options ? sceneNameFor(key) : key,
        value,
      ])
    );
  const defaultsOf = (keys) =>
    Object.fromEntries(
      keys.map((key) => [sceneNameFor(key), options[key].default])
    );
  const sceneDefaults = () => defaultsOf(SCENE_KEYS);
  const GENERATOR_KEYS = keysWhere((spec) => spec.generator);
  const CONFIG_NAMES = new Map(
    keysWhere(configKeys).map((key) => [sceneNameFor(key), key])
  );

  // A render sidecar carries a config as `preset`; this pulls one out of
  // whatever shape was handed over, in the scene's key space.
  function configFrom(source) {
    const flat = source?.preset ?? source ?? {};
    return Object.fromEntries(
      [...CONFIG_NAMES.keys()]
        .filter((name) => flat[name] != null)
        .map((name) => [name, flat[name]])
    );
  }

  function optionsFromConfig(config = {}) {
    return Object.fromEntries(
      [...CONFIG_NAMES]
        .filter(([name]) => config[name] != null)
        .map(([name, key]) => [key, config[name]])
    );
  }

  // Only what differs from the scene's defaults, the way hand-written presets
  // are.
  function presetFromConfig(config = {}) {
    const defaults = sceneDefaults();
    return Object.fromEntries(
      Object.entries(config).filter(
        ([name, value]) =>
          name in defaults && value != null && value !== defaults[name]
      )
    );
  }

  return {
    GENERATOR_KEYS,
    LEVA_KEYS,
    LEVA_NAMES: LEVA_KEYS.map(sceneNameFor),
    SCENE_KEYS,
    SCENE_NAMES,
    SCENE_OPTIONS,
    canonicalArgv,
    canonicalKey,
    configFrom,
    defaultsFor,
    defaultsOf,
    facets,
    generatorDefaults: () => defaultsOf(GENERATOR_KEYS),
    keysInFacet,
    keysWhere,
    normalizeOptions,
    optionsFor,
    optionsFromConfig,
    presetFromConfig,
    resolveViews,
    sceneDefaults,
    sceneNameFor,
    sceneNamed,
    sectionsFor,
    usageFor,
    withAliases,
  };
}
