import { folder } from 'leva';

import {
  DEFAULT_BOUND_HEIGHT,
  DEFAULT_BOUND_RADIUS,
  DEFAULT_BOUND_WIDTH,
} from '../utils/odeIntegrator';
import {
  DEFAULT_COEFF_RANGE,
  DEFAULT_FRAMING_SHAPE,
  DEFAULT_FREQ,
  DEFAULT_START_SPREAD,
  MAX_BUNDLE_COUNT,
} from '../utils/testGenerator';

// Shared between the schema builder (initial `value:`) and
// overridesToLevaFields (re-syncing the panel on preset switch) so the two
// can't drift apart on what a field is called or defaults to.
const FIELD_DEFAULTS = {
  Visible: true,
  ColorOverride: false,
  Color: '#ff0000',
  GrowthDelay: 0,
  GrowthDuration: 4,
  Emissive: false,
  EmissiveIntensity: 2,
  StructuralOverride: false,
  StartSpread: DEFAULT_START_SPREAD,
  CoeffRange: DEFAULT_COEFF_RANGE,
  Freq: DEFAULT_FREQ,
  FramingShape: DEFAULT_FRAMING_SHAPE,
  BoundRadius: DEFAULT_BOUND_RADIUS,
  BoundWidth: DEFAULT_BOUND_WIDTH,
  BoundHeight: DEFAULT_BOUND_HEIGHT,
};
const OVERRIDE_KEY_BY_FIELD = {
  Visible: 'visible',
  ColorOverride: 'colorOverride',
  Color: 'color',
  GrowthDelay: 'growthDelay',
  GrowthDuration: 'growthDuration',
  Emissive: 'emissive',
  EmissiveIntensity: 'emissiveIntensity',
  StructuralOverride: 'structuralOverride',
  StartSpread: 'startSpread',
  CoeffRange: 'coeffRange',
  Freq: 'freq',
  FramingShape: 'framingShape',
  BoundRadius: 'boundRadius',
  BoundWidth: 'boundWidth',
  BoundHeight: 'boundHeight',
};

// One static schema of MAX_BUNDLE_COUNT slots, each conditionally shown via
// Leva's `render`, rather than rebuilding the schema when Bundle Count
// changes — MAX_BUNDLE_COUNT is a small fixed ceiling, so this sidesteps the
// complexity of reactive schema rebuilding (resetting live values, re-seeding
// from stored overrides) entirely.
//
// Each slot is an Override toggle immediately followed by its `BundleN`
// folder — the toggle only gates folder *visibility*, mapped directly onto
// "does overrides[i] exist" (on creates an empty entry, off deletes it,
// same as the old Reset button). It is not a second gate on top of the
// fields inside: those apply independently exactly as they did in the
// single-editor design, and only Structural Override affects generation —
// everything else is cheap style/behavior, per computeStyles.
export default function buildBundleOverrideSchema({
  presetOverrides,
  sceneLabel,
  setOverridesRef,
  setControlsRef,
  getCurrentColorHex,
}) {
  const bundleCountPath = `${sceneLabel}.Structure.bundleCount`;

  function patchOverride(i, patch) {
    setOverridesRef.current((prev) => ({
      ...prev,
      [i]: { ...(prev[i] || {}), ...patch },
    }));
  }

  function field(i, name, extra) {
    const stored = presetOverrides?.[i] || {};
    const overrideKey = OVERRIDE_KEY_BY_FIELD[name];
    return {
      [`bundle${i}${name}`]: {
        label: extra.label,
        value: stored[overrideKey] ?? FIELD_DEFAULTS[name],
        ...extra.options,
        onChange: (value) => patchOverride(i, { [overrideKey]: value }),
      },
    };
  }

  function buildSlot(i) {
    const toggleKey = `bundle${i}Override`;
    const folderKey = `Bundle${i}`;
    const structuralTogglePath = `${sceneLabel}.BundleEditor.${folderKey}.bundle${i}StructuralOverride`;
    const framingShapePath = `${sceneLabel}.BundleEditor.${folderKey}.bundle${i}FramingShape`;
    const structuralAndSphere = (get) =>
      get(structuralTogglePath) && get(framingShapePath) === 'sphere';
    const structuralAndCube = (get) =>
      get(structuralTogglePath) && get(framingShapePath) === 'cube';
    const whenStructural = { render: (get) => get(structuralTogglePath) };

    return {
      [toggleKey]: {
        label: `Bundle ${i}`,
        value: Boolean(presetOverrides?.[i]),
        render: (get) => get(bundleCountPath) > i,
        // Pre-fills Color with the bundle's actual current color (whatever
        // computeStyles produces right now) rather than a fixed placeholder
        // — Color Override itself stays off until set explicitly, so this
        // is purely a sensible starting point to nudge from, not an
        // activation. Only applies when the entry didn't already exist —
        // re-enabling a previously-configured bundle must not clobber
        // whatever color was already saved for it.
        onChange: (enabled) => {
          if (enabled) {
            const colorHex = getCurrentColorHex(i);
            setOverridesRef.current((prev) =>
              prev[i] ? prev : { ...prev, [i]: { color: colorHex } }
            );
            if (setControlsRef.current) {
              setControlsRef.current({ [`bundle${i}Color`]: colorHex });
            }
            return;
          }
          setOverridesRef.current((prev) => {
            const next = { ...prev };
            delete next[i];
            return next;
          });
        },
      },
      [folderKey]: folder(
        {
          ...field(i, 'Visible', { label: 'Visible' }),
          ...field(i, 'ColorOverride', { label: 'Color Override' }),
          ...field(i, 'Color', { label: 'Bundle Color' }),
          ...field(i, 'GrowthDelay', {
            label: 'Growth Delay (s)',
            options: { min: 0, max: 10, step: 0.1 },
          }),
          ...field(i, 'GrowthDuration', {
            label: 'Growth Duration (s)',
            options: { min: 0, max: 15, step: 0.5 },
          }),
          ...field(i, 'Emissive', { label: 'Emissive' }),
          ...field(i, 'EmissiveIntensity', {
            label: 'Emissive Intensity',
            options: { min: 1, max: 5, step: 0.1 },
          }),
          ...field(i, 'StructuralOverride', { label: 'Structural Override' }),
          ...field(i, 'StartSpread', {
            label: 'Start Spread',
            options: { min: 0.02, max: 1.2, step: 0.01, ...whenStructural },
          }),
          ...field(i, 'CoeffRange', {
            label: 'Chaos Amount',
            options: { min: 0.5, max: 2.5, step: 0.05, ...whenStructural },
          }),
          ...field(i, 'Freq', {
            label: 'Curl Frequency',
            options: { min: 0.1, max: 2, step: 0.05, ...whenStructural },
          }),
          ...field(i, 'FramingShape', {
            label: 'Framing Shape',
            options: {
              options: { Cube: 'cube', Sphere: 'sphere', None: 'none' },
              ...whenStructural,
            },
          }),
          ...field(i, 'BoundRadius', {
            label: 'Bound Radius',
            options: {
              min: 5,
              max: 100,
              step: 1,
              render: structuralAndSphere,
            },
          }),
          ...field(i, 'BoundWidth', {
            label: 'Bound Width',
            options: { min: 5, max: 100, step: 1, render: structuralAndCube },
          }),
          ...field(i, 'BoundHeight', {
            label: 'Bound Height',
            options: { min: 5, max: 100, step: 1, render: structuralAndCube },
          }),
        },
        { render: (get) => get(`${sceneLabel}.BundleEditor.${toggleKey}`) }
      ),
    };
  }

  const schema = {};
  for (let i = 0; i < MAX_BUNDLE_COUNT; i += 1) {
    Object.assign(schema, buildSlot(i));
  }
  return schema;
}

// Maps overrides (React state) -> the Bundle Editor's flat Leva field
// values, for every slot up to MAX_BUNDLE_COUNT — used to re-sync the panel
// on preset switch, since `overrides` itself bypasses Leva's own controlled
// state (see useSceneControls.js). Always covers every slot, including ones
// with no override, so a stale "on" toggle from a previously-loaded preset
// gets explicitly turned off rather than left dangling.
export function overridesToLevaFields(overrides) {
  const fields = {};
  for (let i = 0; i < MAX_BUNDLE_COUNT; i += 1) {
    const stored = overrides?.[i];
    fields[`bundle${i}Override`] = Boolean(stored);
    Object.entries(OVERRIDE_KEY_BY_FIELD).forEach(([name, overrideKey]) => {
      fields[`bundle${i}${name}`] =
        stored?.[overrideKey] ?? FIELD_DEFAULTS[name];
    });
  }
  return fields;
}
