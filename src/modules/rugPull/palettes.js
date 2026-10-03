// A rug is woven from a handful of dyed yarns. Every knot holds one of these
// roles; a palette gives each role its dye.
export const ROLES = [
  'dark',
  'ivory',
  'red',
  'blue',
  'gold',
  'green',
  'rose',
  'sky',
  'camel',
  'warp',
];

export const R = Object.fromEntries(ROLES.map((role, i) => [role, i]));

const p = (colors, ground, border, medallion, extra = {}) => ({
  border,
  colors,
  ground,
  medallion,
  ...extra,
});

// Grounds are role names. `label` reads the dye tradition each echoes.
export const PALETTES = {
  tabriz: p(
    {
      dark: '#1e1a22',
      ivory: '#eee2c6',
      red: '#9c2b26',
      blue: '#1f2d58',
      gold: '#c79a42',
      green: '#4e6a4b',
      rose: '#d58e7d',
      sky: '#7e9cba',
      camel: '#a87a50',
      warp: '#ebe2d0',
    },
    'ivory',
    'red',
    'blue'
  ),
  kashan: p(
    {
      dark: '#15141f',
      ivory: '#ecdfc2',
      red: '#8d1d22',
      blue: '#172452',
      gold: '#d0a24b',
      green: '#3f5e4a',
      rose: '#c97a74',
      sky: '#6e8fb4',
      camel: '#99714c',
      warp: '#e8dfcc',
    },
    'red',
    'blue',
    'ivory'
  ),
  isfahan: p(
    {
      dark: '#22283a',
      ivory: '#f1e8d3',
      red: '#a33a32',
      blue: '#294a7c',
      gold: '#d9b25e',
      green: '#647d55',
      rose: '#e3a594',
      sky: '#93b4d2',
      camel: '#b98d63',
      warp: '#f0e9d9',
    },
    'ivory',
    'blue',
    'red'
  ),
  heriz: p(
    {
      dark: '#1b1d29',
      ivory: '#ece0c3',
      red: '#a8442c',
      blue: '#1f3358',
      gold: '#cf9f4e',
      green: '#56714f',
      rose: '#d98d6e',
      sky: '#87a9c4',
      camel: '#b07c4f',
      warp: '#e6dcc6',
    },
    'red',
    'blue',
    'ivory'
  ),
  qashqai: p(
    {
      dark: '#191520',
      ivory: '#efe3c9',
      red: '#9e2220',
      blue: '#1c2550',
      gold: '#e0a93a',
      green: '#3e6b4f',
      rose: '#cf6f63',
      sky: '#5f87b0',
      camel: '#a46f3e',
      warp: '#eadfc8',
    },
    'red',
    'blue',
    'blue'
  ),
  turkmen: p(
    {
      dark: '#1c1015',
      ivory: '#e9dcc0',
      red: '#7a1820',
      blue: '#1a2442',
      gold: '#c9893c',
      green: '#3f4f3a',
      rose: '#b25546',
      sky: '#5a7392',
      camel: '#8a5a3a',
      warp: '#e2d6c0',
    },
    'red',
    'red',
    'dark'
  ),
  baluch: p(
    {
      dark: '#140f14',
      ivory: '#e6dccb',
      red: '#6e2026',
      blue: '#1e2140',
      gold: '#b0874a',
      green: '#36463a',
      rose: '#9b5a52',
      sky: '#4c5f7c',
      camel: '#9a7350',
      warp: '#ddd2bf',
    },
    'blue',
    'red',
    'camel'
  ),
  nain: p(
    {
      dark: '#1f2a44',
      ivory: '#f3ecdc',
      red: '#8c3b39',
      blue: '#2f4f7f',
      gold: '#c9b07a',
      green: '#6f8c79',
      rose: '#d8b5a5',
      sky: '#a9c1dc',
      camel: '#c4a77f',
      warp: '#f4eee2',
    },
    'ivory',
    'sky',
    'blue'
  ),
  ziegler: p(
    {
      dark: '#3a3029',
      ivory: '#f0e6d2',
      red: '#b4573f',
      blue: '#5a6f86',
      gold: '#d6ad6a',
      green: '#8a9a72',
      rose: '#e0a88f',
      sky: '#a9bccb',
      camel: '#c09670',
      warp: '#f1ead9',
    },
    'red',
    'ivory',
    'green'
  ),
  kerman: p(
    {
      dark: '#3a2a35',
      ivory: '#f4ead8',
      red: '#b8475a',
      blue: '#4f6c95',
      gold: '#dcb874',
      green: '#7f9e86',
      rose: '#e7aab0',
      sky: '#b3c9e0',
      camel: '#c8a283',
      warp: '#f5eee1',
    },
    'ivory',
    'rose',
    'sky'
  ),
  loader: p(
    {
      dark: '#050505',
      ivory: '#f2ece0',
      red: '#e3120b',
      blue: '#141b33',
      gold: '#d9a72b',
      green: '#2f4a3a',
      rose: '#f07a68',
      sky: '#9aa7b8',
      camel: '#8c5a3c',
      warp: '#ece5d6',
    },
    'red',
    'dark',
    'ivory',
    { mine: true }
  ),
  turboflex: p(
    {
      dark: '#140f0c',
      ivory: '#f6f1e6',
      red: '#b0321f',
      blue: '#1f2a4a',
      gold: '#f2bf16',
      green: '#3e5a3a',
      rose: '#efa58a',
      sky: '#a8a8a8',
      camel: '#ce7a66',
      warp: '#efe8d8',
    },
    'dark',
    'gold',
    'ivory',
    { mine: true }
  ),
};

export const PALETTE_IDS = Object.keys(PALETTES);
export const TRADITIONAL_PALETTES = PALETTE_IDS.filter(
  (id) => !PALETTES[id].mine
);

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; // eslint-disable-line no-bitwise
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// The dyes a rug weaves with: a named palette, or the custom colour keys.
export function resolvePalette(config) {
  const named = PALETTES[config.palette];
  const colors =
    config.palette === 'custom' || !named
      ? ROLES.map(
          (role) => config[`color${role[0].toUpperCase()}${role.slice(1)}`]
        )
      : ROLES.map((role) => named.colors[role]);
  const base = named ?? PALETTES.tabriz;
  const roleOf = (key, fallback) =>
    config[key] && config[key] !== 'auto' ? R[config[key]] : R[fallback];
  return {
    colors,
    grounds: {
      border: roleOf('borderRole', base.border),
      ground: roleOf('groundRole', base.ground),
      medallion: roleOf('medallionRole', base.medallion),
    },
    lum: colors.map(luminance),
  };
}
