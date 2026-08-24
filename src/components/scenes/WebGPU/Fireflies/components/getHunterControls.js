import { folder } from 'leva';

// Hunter chase/restore behavior, ported from Floids' Hunter.js. hunterSpeed
// is the cruise speed restoreTau relaxes back toward; hunterMaxSpeed is a
// hard ceiling so a chase burst can't run away unbounded.
export default function getHunterControls(p) {
  return folder(
    {
      hunterCount: { value: p.hunterCount, min: 1, max: 3, step: 1 },
      chaseFactor: { value: p.chaseFactor, min: 0, max: 3, step: 0.05 },
      chaseEpsilon: { value: p.chaseEpsilon, min: 0.01, max: 5, step: 0.01 },
      sightRadius: { value: p.sightRadius, min: 2, max: 40, step: 1 },
      fleeRadius: { value: p.fleeRadius, min: 1, max: 30, step: 0.5 },
      fleeWeight: { value: p.fleeWeight, min: 0, max: 10, step: 0.1 },
      confusionFactor: { value: p.confusionFactor, min: 0, max: 1, step: 0.05 },
      hunterSpeed: { value: p.hunterSpeed, min: 1, max: 20, step: 0.5 },
      hunterMaxSpeed: { value: p.hunterMaxSpeed, min: 1, max: 30, step: 0.5 },
      restoreTau: { value: p.restoreTau, min: 0.05, max: 2, step: 0.05 },
      hunterSize: { value: p.hunterSize, min: 0.1, max: 2, step: 0.05 },
      hunterColor: { value: p.hunterColor, label: 'Hunter Color' },
      hunterEmissiveColor: {
        value: p.hunterEmissiveColor,
        label: 'Emissive Color',
      },
      hunterEmissiveIntensity: {
        value: p.hunterEmissiveIntensity,
        min: 0,
        max: 8,
        step: 0.1,
        label: 'Emissive Intensity',
      },
    },
    { collapsed: true }
  );
}
