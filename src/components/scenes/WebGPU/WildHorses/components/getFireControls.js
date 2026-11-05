import { folder } from 'leva';

const num = (p, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: p[key] },
});
const plain = (p, key, label) => ({ [key]: { label, value: p[key] } });

export default function getFireControls(p) {
  return folder(
    {
      ...plain(p, 'fireEnabled', 'Enabled'),
      Volume: folder(
        {
          ...num(p, 'fireResolution', 'Resolution', 0.4, 2, 0.05),
          ...num(p, 'fireTrail', 'Trail Room', 0.5, 6, 0.1),
          ...num(p, 'fireDrag', 'Run Wind', 0, 1, 0.01),
          ...num(p, 'fireForceHeight', 'Force Height', 0.2, 10, 0.1),
          ...num(p, 'fireBuoyancy', 'Buoyancy', 0, 10, 0.05),
          ...num(p, 'fireWeight', 'Soot Weight', 0, 2, 0.01),
          ...num(p, 'fireTurbulence', 'Turbulence', 0, 4, 0.01),
          ...num(p, 'fireTurbFrequency', 'Turb Frequency', 1, 12, 0.1),
          ...num(p, 'fireDamping', 'Damping', 0, 3, 0.01),
        },
        { collapsed: true }
      ),
      Emitters: folder(
        {
          ...num(p, 'fireMane', 'Mane', 0, 3, 0.01),
          ...num(p, 'fireTail', 'Tail', 0, 3, 0.01),
          ...num(p, 'fireManeLift', 'Mane Lift', 0, 0.4, 0.005),
          ...num(p, 'fireEmitRadius', 'Radius', 0.01, 0.4, 0.005),
          ...num(p, 'fireTemperature', 'Temperature', 1, 60, 0.5),
          ...num(p, 'fireCooling', 'Cooling', 0.1, 8, 0.05),
          ...num(p, 'fireSoot', 'Soot', 0, 3, 0.01),
          ...num(p, 'fireDissipation', 'Soot Fade', 0.02, 4, 0.01),
          ...num(p, 'fireFlicker', 'Flicker', 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Look: folder(
        {
          ...num(p, 'fireSteps', 'March Steps', 16, 160, 1),
          ...num(p, 'fireIntensity', 'Intensity', 0, 6, 0.01),
          ...num(p, 'fireGlow', 'Glow', 0.1, 120, 0.1),
          ...num(p, 'fireSootDensity', 'Soot Density', 0, 30, 0.1),
          ...num(p, 'fireBlue', 'Blue Base', 0, 2, 0.01),
          ...plain(p, 'fireStartColor', 'Hot'),
          ...plain(p, 'fireMidColor', 'Mid'),
          ...plain(p, 'fireEndColor', 'Cool'),
          ...plain(p, 'fireLightColor', 'Light Color'),
          ...num(p, 'fireLightIntensity', 'Light Intensity', 0, 80, 0.1),
          ...num(p, 'fireLightDistance', 'Light Distance', 1, 40, 0.1),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
