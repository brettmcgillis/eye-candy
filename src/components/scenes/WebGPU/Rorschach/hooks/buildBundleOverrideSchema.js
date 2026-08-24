import { folder } from 'leva';

import { BUNDLE_FIELD_DEFAULTS, MAX_BUNDLE_COUNT } from '@modules/rorschach';

// One static schema of MAX_BUNDLE_COUNT slots, each conditionally shown via
// Leva's `render`, rather than rebuilding the schema when Bundle Count
// changes — MAX_BUNDLE_COUNT is a small fixed ceiling, so this sidesteps the
// complexity of reactive schema rebuilding (resetting live values, re-seeding
// from stored overrides) entirely.
//
// Every field here is a real, flat, top-level-unique Leva control
// (`bundle0Emissive`, `bundle1Emissive`, ...) seeded straight from the
// preset snapshot like every other control in this scene — there used to
// also be a hand-rolled `overrides` React state kept in sync with these
// fields via onChange, but that gave the same data two independent sources
// of truth that could (and did) drift apart on preset switch/mount. Now
// `controls` from useControls() *is* the source of truth; see
// buildOverridesFromControls below for how Test.jsx's nested per-bundle
// shape gets derived from it.
//
// No field here has an onChange handler (the toggle used to, for a
// "pre-fill Color on enable" nicety) — deliberately: an onChange fires as
// part of the *same* setControls() batch a preset switch uses, so it can
// read stale ref state and write a value that fights with whatever the
// incoming preset itself was setting for that key. Set the color by hand
// after enabling Color Override instead.
export default function buildBundleOverrideSchema({
  presetSnapshot,
  sceneLabel,
}) {
  const bundleCountPath = `${sceneLabel}.Structure.bundleCount`;

  function field(i, name, extra) {
    const key = `bundle${i}${name}`;
    return {
      [key]: {
        label: extra.label,
        value: presetSnapshot?.[key] ?? BUNDLE_FIELD_DEFAULTS[name],
        ...extra.options,
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
        value: presetSnapshot?.[toggleKey] ?? false,
        render: (get) => get(bundleCountPath) > i,
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
        // Collapsed, not render-gated on the toggle: a folder hidden via
        // `render` is unmounted from Leva's tree, and a preset switch that
        // sets this toggle *and* fields inside the same folder in one
        // setControls() call evaluates `render` against the pre-update
        // toggle value — the folder stays "hidden" for that pass and the
        // field updates inside it get silently dropped (only a full remount
        // recovers). Collapsed still hides the fields by default without
        // unmounting them, so updates always land.
        { collapsed: true }
      ),
    };
  }

  const schema = {};
  for (let i = 0; i < MAX_BUNDLE_COUNT; i += 1) {
    Object.assign(schema, buildSlot(i));
  }
  return schema;
}
