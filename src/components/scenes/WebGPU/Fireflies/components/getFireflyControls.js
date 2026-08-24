import { folder } from 'leva';

// Flash timing (Floids Agents.js fire()/nudge()) and the matte-grey→glow
// visual response. No real point lights in this pass — the flash is an
// instanceColor lerp (bodyColor→glowColor) driving both diffuse tint and,
// via emissiveNode, actual emissive glow, plus a slight scale bump. See
// FireflySwarm.jsx.
export default function getFireflyControls(p) {
  return folder(
    {
      flashCycle: { value: p.flashCycle, min: 0.5, max: 8, step: 0.1 },
      nudgeFactor: { value: p.nudgeFactor, min: 0, max: 0.3, step: 0.01 },
      nudgeLimit: { value: p.nudgeLimit, min: 0, max: 10, step: 1 },
      flashDecayRate: { value: p.flashDecayRate, min: 0.5, max: 10, step: 0.1 },
      bodySize: { value: p.bodySize, min: 0.05, max: 1.5, step: 0.05 },
      glowSizeBoost: { value: p.glowSizeBoost, min: 0, max: 2, step: 0.05 },
      glowIntensity: {
        value: p.glowIntensity,
        min: 0,
        max: 8,
        step: 0.1,
        label: 'Glow Intensity',
      },
      bodyColor: { value: p.bodyColor, label: 'Body Color' },
      glowColor: { value: p.glowColor, label: 'Glow Color' },
    },
    { collapsed: true }
  );
}
