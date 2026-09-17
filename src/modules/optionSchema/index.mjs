// A declarative option table shared by every headless generator: one spec per
// knob (type, range, default, help, roll window) drives the CLI's defaults,
// `--flag` parsing and `--help`, the workbench's form, and the dev server's
// validation. Dependency-free and `.mjs` so plain Node and Vite's config
// loader can both import it by relative path.
//
// Spec fields:
//   scope        'shared' or a job kind ('still', 'video')
//   section      groups the option in `--help` and the workbench form
//   type         number | seed | boolean | enum | string | json | color
//   facet        the roll stream that may set it; absent = never rolled
//   roll         { min, max, step } art-directed window for the dice
//   cliOnly      owned by the job runner, never offered as a form field
//   workbenchOnly  accepted from the workbench but not a CLI flag
//   nullable     an empty value means "unset" rather than the default

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
    const value = String(raw);
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

export default function createOptionSchema({
  options,
  sectionLabels = {},
  surfaceDefaults = {},
  validate,
}) {
  function optionsFor(kind, surface = `cli-${kind}`) {
    return Object.entries(options).filter(
      ([, spec]) =>
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

    const width =
      Math.max(
        ...entries.map(([key, spec]) => flagSignature(key, spec).length)
      ) + 2;

    const lines = [];
    bySection.forEach((sectionEntries, section) => {
      lines.push(``, ` ${sectionLabels[section] ?? section}`);
      sectionEntries.forEach(([key, spec]) => {
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
    const normalized = Object.fromEntries(
      optionsFor(kind, surface).map(([key, spec]) => [
        key,
        coerce(key, spec, raw[key], defaults[key], fail),
      ])
    );
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
    return [...bySection].map(([id, keys]) => ({
      id,
      keys,
      label: sectionLabels[id] ?? id,
    }));
  }

  return {
    defaultsFor,
    facets,
    keysInFacet,
    normalizeOptions,
    optionsFor,
    sectionsFor,
    usageFor,
  };
}
