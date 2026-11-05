import { folder } from 'leva';

const SMOKE_COUNTS = [4096, 8192, 16384, 32768, 65536];

const num = (p, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: p[key] },
});
const plain = (p, key, label) => ({ [key]: { label, value: p[key] } });

export default function getSmokeControls(p) {
  return folder(
    {
      ...plain(p, 'smokeVisible', 'Visible'),
      smokeCount: {
        label: 'Particles',
        options: SMOKE_COUNTS,
        value: p.smokeCount,
      },
      ...plain(p, 'smokeColor', 'Color'),
      ...num(p, 'smokeOpacity', 'Opacity', 0, 1, 0.001),
      ...num(p, 'smokeAreaFade', 'Thinning', 0, 4, 0.01),
      ...num(p, 'smokeSize', 'Size', 0.1, 40, 0.1),
      ...num(p, 'smokeDrag', 'Run Wind', 0, 1.5, 0.01),
      ...num(p, 'smokeTrailLength', 'Trail Length', 2, 60, 0.5),
      ...num(p, 'smokeTrailLift', 'Trail Lift', 0, 1.5, 0.01),
      ...num(p, 'smokeLife', 'Life', 0.5, 24, 0.1),
      ...num(p, 'smokeLaminar', 'Laminar', 0, 4, 0.01),
      ...num(p, 'smokeCurl', 'Curl', 0, 4, 0.01),
      ...num(p, 'smokeHold', 'Hold To Path', 0, 1, 0.01),
      ...num(p, 'smokeCurlScale', 'Curl Scale', 0.05, 3, 0.01),
      ...num(p, 'smokeCurlSpeed', 'Curl Speed', 0, 1, 0.01),
      ...num(p, 'smokeSpread', 'Spread', 0, 4, 0.01),
      ...num(p, 'smokeSway', 'Sway', 0, 4, 0.01),
      ...num(p, 'smokeEmitRadius', 'Emit Radius', 0, 2, 0.01),
      ...num(p, 'smokeSeed', 'Seed', 0, 999, 1),
      ...num(p, 'smokeGlow', 'Fire Glow', 0, 6, 0.01),
      ...plain(p, 'smokeGlowColor', 'Glow Color'),
      ...num(p, 'smokeGlowReach', 'Glow Reach', 0.1, 10, 0.05),
    },
    { collapsed: true }
  );
}
