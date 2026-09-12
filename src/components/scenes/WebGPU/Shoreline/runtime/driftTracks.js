// A day at the coast. Swell height and period walk as the fetch offshore
// changes, the approach angle swings with the wind, and the foam's own terms
// follow the water rather than being posed independently -- so a set arriving
// at dusk breaks differently from the same set at noon without either being
// keyframed.
//
// Spans are fractions of whatever the preset set, except Approach, which is
// degrees: a swell that arrives square has no percentage to swing by.
// Every min and max here matches its control's range.
const DRIFT_TRACKS = [
  { key: 'swellAmplitude', span: 0.55, min: 0.1, max: 3.5 },
  { key: 'swellPeriod', span: 0.3, min: 2, max: 14 },
  { additive: true, key: 'swellAngle', span: 34, min: -60, max: 60 },
  { key: 'swellGroupRate', span: 0.55, min: 0, max: 0.6 },
  { key: 'tideAmplitude', span: 0.4, min: 0, max: 2.5 },
  { key: 'breakWeight', span: 0.3 },
  { key: 'aerationBirth', span: 0.55 },
  { key: 'churnStrength', span: 0.4 },
  { key: 'foamBirth', span: 0.5 },
  { key: 'foamDecay', span: 0.3 },
  { key: 'foamReaction', span: 0.3 },
  // The water's own clarity, which is what turns a bright afternoon shelf into
  // a murky one as the surf stirs the bed up.
  { key: 'absorption', span: 0.25 },
];

export default DRIFT_TRACKS;
