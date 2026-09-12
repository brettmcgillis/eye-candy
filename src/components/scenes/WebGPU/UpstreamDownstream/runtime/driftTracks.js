// A season on the reach. Discharge is the one that matters: inflow and outfall
// walking together is snowmelt giving way to low summer and back, and every
// other track here is something that follows from how much water is arriving.
//
// Spans are fractions of whatever the preset set, and every min and max
// matches its control's range.
const DRIFT_TRACKS = [
  { key: 'inflowDepth', span: 0.45, min: 0.05, max: 2.5 },
  { key: 'outfallDepth', span: 0.35, min: 0.02, max: 2 },
  { key: 'surgeAmount', span: 0.6, min: 0, max: 0.8 },
  { key: 'surgePeriod', span: 0.4, min: 2, max: 120 },
  { key: 'friction', span: 0.25 },
  { key: 'breakWeight', span: 0.3 },
  { key: 'aerationBirth', span: 0.5 },
  { key: 'churnStrength', span: 0.4 },
  { key: 'foamBirth', span: 0.45 },
  { key: 'foamDecay', span: 0.3 },
  { key: 'foamReaction', span: 0.3 },
  // Snowmelt runs cloudy and late summer runs clear, so the bed reads through
  // the pools by a different amount depending on where the cycle is.
  { key: 'absorption', span: 0.3 },
];

export default DRIFT_TRACKS;
