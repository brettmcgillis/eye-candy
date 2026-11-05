import { AREAS, INVENTORY, UNITS } from './controls';
import { controlSize } from './designTransforms';
import { RENDER_OPTIONS } from './renderOptions.mjs';

export const DESIGN_PREFIX = 'cp1.';
export const DESIGN_LOOK_KEYS = Object.keys(RENDER_OPTIONS).filter(
  (key) => RENDER_OPTIONS[key].section === 'look' || key === 'enclosure'
);

function normalizeLook(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid design appearance.');
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      if (!DESIGN_LOOK_KEYS.includes(key))
        throw new Error(`Unknown design appearance key: ${key}.`);
      if (
        spec.type === 'color' &&
        (typeof value !== 'string' || !/^#[0-9a-f]{6}$/iu.test(value))
      )
        throw new Error(`Invalid colour for ${key}.`);
      if (spec.type === 'boolean' && typeof value !== 'boolean')
        throw new Error(`Invalid flag for ${key}.`);
      if (
        spec.type === 'number' &&
        (!Number.isFinite(value) || value < spec.min || value > spec.max)
      )
        throw new Error(`Invalid value for ${key}.`);
      return [key, value];
    })
  );
}
const inventoryControls = INVENTORY.filter((entry) => entry.id !== 'cluster');
const generatedVariants = inventoryControls
  .filter(
    (entry, index, entries) =>
      entries.findIndex((other) => other.id === entry.id) === index &&
      !entries.some((other) => other.id === entry.id && other.variant == null)
  )
  .map((entry) => ({ ...entry, variant: null }));
export const DESIGN_CATALOGUE = [
  ...inventoryControls,
  { id: 'button', kind: 'unit', variant: 'round-lit', w: 1, h: 1 },
  ...generatedVariants,
];
export const emptyDesign = (cols = 16, rows = 9) => ({
  version: 1,
  cols,
  rows,
  modules: [],
  look: {},
});
export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function number(value, min, max, label) {
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    value * 4 !== Math.round(value * 4)
  )
    throw new Error(
      `${label} must be on the quarter-cell grid, between ${min} and ${max}.`
    );
  return value;
}

function identity(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/u.test(value))
    throw new Error('Invalid item ID.');
  return value;
}

function rectangle(item, width, height) {
  return {
    id: identity(item.id),
    x: number(item.x, 0, width, 'X'),
    y: number(item.y, 0, height, 'Y'),
    w: number(item.w, 0.5, width - item.x, 'Width'),
    h: number(item.h, 0.5, height - item.y, 'Height'),
    seed: number(item.seed ?? 0, 0, 99999, 'Detail seed'),
  };
}

function checkItems(items) {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('Item IDs must be unique.');
  items.forEach((item, i) => {
    if (items.slice(i + 1).some((other) => overlaps(item, other)))
      throw new Error('Items cannot overlap.');
  });
  return items;
}

function normalizeControl(item, module) {
  const box = rectangle(item, module.w, module.h);
  const rotation = item.rotation ?? 0;
  if (![0, 90, 180, 270].includes(rotation))
    throw new Error('Rotation must be 0°, 90°, 180° or 270°.');
  const entry = DESIGN_CATALOGUE.find(
    (candidate) =>
      candidate.id === item.type && candidate.variant === (item.variant ?? null)
  );
  if (!entry) throw new Error(`Unknown control or variant: ${item.type}.`);
  if (UNITS[item.type] && box.w !== box.h)
    throw new Error('Unit controls need a square footprint.');
  const size = controlSize({ ...box, rotation });
  if (item.type === 'screen' && item.variant === 'radar' && size.w !== size.h)
    throw new Error('Radar screens need a square footprint.');
  if (AREAS[item.type] && !AREAS[item.type].fits(size))
    throw new Error(`${item.type} does not fit that shape.`);
  return {
    ...box,
    type: item.type,
    variant: entry.variant,
    ...(rotation && { rotation }),
  };
}

export function normalizeDesign(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.modules))
    throw new Error('Expected a version 1 ControlPanel design.');
  const cols = number(input.cols, 4, 40, 'Panel columns');
  const rows = number(input.rows, 3, 30, 'Panel rows');
  if (input.modules.length > 160)
    throw new Error('A design can contain at most 160 modules.');
  if (
    input.modules.reduce((n, item) => n + (item.controls?.length ?? 0), 0) > 512
  )
    throw new Error('A design can contain at most 512 controls.');
  const modules = checkItems(
    input.modules.map((item) => {
      const box = rectangle(item, cols, rows);
      if (!Array.isArray(item.controls))
        throw new Error('Each module needs a controls list.');
      return {
        ...box,
        zone: Boolean(item.zone),
        controls: checkItems(
          item.controls.map((control) => normalizeControl(control, box))
        ),
      };
    })
  );
  return { version: 1, cols, rows, modules, look: normalizeLook(input.look) };
}

export const isDesignCode = (value) =>
  typeof value === 'string' && value.startsWith(DESIGN_PREFIX);
export const designToJson = normalizeDesign;
export function encodeDesign(design) {
  const json = JSON.stringify(normalizeDesign(design));
  return (
    DESIGN_PREFIX +
    btoa(json).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
  );
}
export function decodeDesign(code) {
  if (!isDesignCode(code) || code.length > 256 * 1024)
    throw new Error('Invalid ControlPanel design code.');
  try {
    return normalizeDesign(
      JSON.parse(
        atob(
          code
            .slice(DESIGN_PREFIX.length)
            .replaceAll('-', '+')
            .replaceAll('_', '/')
        )
      )
    );
  } catch (error) {
    throw new Error(`Cannot open design: ${error.message}`);
  }
}

export const nextDesignId = (items, prefix) => {
  let n = 1;
  const used = new Set(items.map((item) => item.id));
  while (used.has(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
};
