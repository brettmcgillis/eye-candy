// The lite and wild bundles as presets over the full bundle's constants:
// only what their sources change.
export const LITE = {
  variant: 'lite',
  wetCross: 1.6,
  aaJitter: 2.7,
  redDripSlots: 3,
  fleckDensity: 0.8,
  shimmer: 0.03,
};

export const WILD = {
  ...LITE,
  fieldRects: 5,
  coolThreadCut: 0.7,
  seamBreath: 0.7,
  lumSpread: 0.2,
  aaJitter: 1.7,
  crisp: 0.2,
  srcFrac: 0.8,
  dragMin: 0.6,
  lineGrain: 0.1,
  threadSpread: 8,
  taper: 0.3,
  softLines: 0.4,
  mottle: 0.6,
  linePx: 3,
  bleedP: 0.1,
  shimmer: 0.3,
};
