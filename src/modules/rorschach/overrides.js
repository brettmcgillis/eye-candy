import {
  DEFAULT_BOUND_HEIGHT,
  DEFAULT_BOUND_RADIUS,
  DEFAULT_BOUND_WIDTH,
} from './odeIntegrator';
import {
  DEFAULT_COEFF_RANGE,
  DEFAULT_FRAMING_SHAPE,
  DEFAULT_FREQ,
  DEFAULT_MEMBRANE_SPAN,
  DEFAULT_START_SPREAD,
  DEFAULT_STRAND_SEEDING,
  MAX_BUNDLE_COUNT,
} from './testGenerator';

// Shared between the scene's Leva schema builder (initial `value:`) and
// buildOverridesFromControls (deriving the nested shape Test.jsx consumes)
// so the two can't drift apart on what a field is called or defaults to.
export const BUNDLE_FIELD_DEFAULTS = {
  Visible: true,
  Membrane: false,
  ColorOverride: false,
  Color: '#ff0000',
  GrowthDelay: 0,
  GrowthDuration: 4,
  Emissive: false,
  EmissiveIntensity: 2,
  StructuralOverride: false,
  StartSpread: DEFAULT_START_SPREAD,
  StrandSeeding: DEFAULT_STRAND_SEEDING,
  MembraneSpan: DEFAULT_MEMBRANE_SPAN,
  CoeffRange: DEFAULT_COEFF_RANGE,
  Freq: DEFAULT_FREQ,
  FramingShape: DEFAULT_FRAMING_SHAPE,
  BoundRadius: DEFAULT_BOUND_RADIUS,
  BoundWidth: DEFAULT_BOUND_WIDTH,
  BoundHeight: DEFAULT_BOUND_HEIGHT,
};

const OVERRIDE_KEY_BY_FIELD = {
  Visible: 'visible',
  Membrane: 'membrane',
  ColorOverride: 'colorOverride',
  Color: 'color',
  GrowthDelay: 'growthDelay',
  GrowthDuration: 'growthDuration',
  Emissive: 'emissive',
  EmissiveIntensity: 'emissiveIntensity',
  StructuralOverride: 'structuralOverride',
  StartSpread: 'startSpread',
  StrandSeeding: 'strandSeeding',
  MembraneSpan: 'membraneSpan',
  CoeffRange: 'coeffRange',
  Freq: 'freq',
  FramingShape: 'framingShape',
  BoundRadius: 'boundRadius',
  BoundWidth: 'boundWidth',
  BoundHeight: 'boundHeight',
};

// Derives the nested `{ index: { visible, color, ... } }` shape
// testGenerator.js's computeStyles expects, straight from the flat
// Leva-managed bundle fields on `controls` — the single source of truth, so
// this can never drift from what the BundleEditor panel shows, on mount,
// preset switch, or a live edit alike.
//
// Kernel-side rather than scene-side because the headless renderers derive the
// same overrides from a preset's flat keys: an earlier CLI-local copy only
// mapped the fields rollConfig happens to set, so a real preset's Color
// Override and Structural Override were silently dropped.
export function buildOverridesFromControls(controls) {
  const overrides = {};
  for (let i = 0; i < MAX_BUNDLE_COUNT; i += 1) {
    if (controls[`bundle${i}Override`]) {
      const entry = {};
      Object.entries(OVERRIDE_KEY_BY_FIELD).forEach(([name, overrideKey]) => {
        entry[overrideKey] =
          controls[`bundle${i}${name}`] ?? BUNDLE_FIELD_DEFAULTS[name];
      });
      overrides[i] = entry;
    }
  }
  return overrides;
}
