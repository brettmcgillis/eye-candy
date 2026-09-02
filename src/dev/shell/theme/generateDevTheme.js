import { describeColor, hexToRgba, mix } from './colorMath';

export const CLASSIC_THEME_TOKENS = {
  '--dev-accent': '#b45309',
  '--dev-bg': '#f3f4f6',
  '--dev-border': '#d8dde5',
  '--dev-border-strong': '#b8c0cc',
  '--dev-danger': '#9f1239',
  '--dev-shadow': '0 1px 2px rgba(15, 23, 42, 0.05)',
  '--dev-surface': '#ffffff',
  '--dev-surface-subtle': '#f8fafc',
  '--dev-text': '#172033',
  '--dev-text-muted': '#6b7280',
  '--dev-text-secondary': '#4b5563',
};

const DARK_AVG_LIGHTNESS_THRESHOLD = 0.4;
const RED_HUE_MAX = 20;
const RED_HUE_MIN = 330;
const RED_SATURATION_MIN = 0.22;
const FALLBACK_DANGER_RED = '#b3261e';

function isRedHue(hue) {
  return hue <= RED_HUE_MAX || hue >= RED_HUE_MIN;
}

export function generateThemeTokens(colors) {
  if (!Array.isArray(colors) || !colors.length) return null;

  const parsed = colors.map((hex) => describeColor(hex));
  const byLightness = [...parsed].sort((a, b) => a.hsl.l - b.hsl.l);
  const darkest = byLightness[0];
  const lightest = byLightness[byLightness.length - 1];
  const avgLightness =
    parsed.reduce((sum, color) => sum + color.hsl.l, 0) / parsed.length;
  const isDark = avgLightness < DARK_AVG_LIGHTNESS_THRESHOLD;

  const bgSeed = isDark ? darkest : lightest;
  const textSeed = isDark ? lightest : darkest;
  const bg = bgSeed.hex;
  const text = textSeed.hex;

  const surface = isDark ? mix(bg, '#ffffff', 0.1) : mix(bg, '#ffffff', 0.55);
  const surfaceSubtle = isDark
    ? mix(bg, '#ffffff', 0.16)
    : mix(bg, '#ffffff', 0.3);
  const textSecondary = mix(text, bg, isDark ? 0.2 : 0.25);
  const textMuted = mix(text, bg, isDark ? 0.38 : 0.45);
  const border = isDark ? mix(bg, '#ffffff', 0.22) : mix(text, bg, 0.78);
  const borderStrong = isDark ? mix(bg, '#ffffff', 0.32) : mix(text, bg, 0.62);

  const nonSeed = parsed.filter((c) => c !== bgSeed && c !== textSeed);
  const pool = nonSeed.length ? nonSeed : parsed;

  const redCandidates = pool
    .filter((c) => c.hsl.s > RED_SATURATION_MIN && isRedHue(c.hsl.h))
    .sort((a, b) => b.hsl.s - a.hsl.s);
  const dangerColor = redCandidates[0] ?? null;

  const accentPool = pool.filter((c) => c !== dangerColor);
  const accentSourcePool = accentPool.length ? accentPool : pool;
  const accentColor = [...accentSourcePool].sort(
    (a, b) => b.hsl.s - a.hsl.s
  )[0];

  const accent = accentColor.hex;
  const danger = dangerColor
    ? dangerColor.hex
    : mix(accent, FALLBACK_DANGER_RED, 0.55);

  return {
    '--dev-accent': accent,
    '--dev-bg': bg,
    '--dev-border': border,
    '--dev-border-strong': borderStrong,
    '--dev-danger': danger,
    '--dev-shadow': `0 1px 2px ${hexToRgba(text, 0.1)}`,
    '--dev-surface': surface,
    '--dev-surface-subtle': surfaceSubtle,
    '--dev-text': text,
    '--dev-text-muted': textMuted,
    '--dev-text-secondary': textSecondary,
  };
}
