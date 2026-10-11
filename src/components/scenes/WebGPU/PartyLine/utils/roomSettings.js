const seconds = (value) => `${value}s`;
const ERASER_LABELS = { 0: 'Off', 4: 'Chaos', 8: 'Normal', 15: 'Rare' };

export const ROOM_SETTINGS = {
  collabPromptSeconds: {
    format: (value) => (value ? seconds(value) : 'Off'),
    label: 'New prompt every',
    options: [0, 30, 45, 60, 90, 120],
  },
  competeRoundSeconds: {
    format: seconds,
    label: 'Round length',
    options: [5, 10, 20, 30],
  },
  competeEraserEvery: {
    format: (value) => ERASER_LABELS[value],
    label: 'Eraser',
    options: [0, 15, 8, 4],
  },
};

export const SETTINGS_BY_PRESET = {
  ScribbleTogether: ['collabPromptSeconds'],
  ScribbleBattle: ['competeRoundSeconds', 'competeEraserEvery'],
};

function nearestOption(options, value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return options[Math.floor(options.length / 2)];
  return options.reduce((best, option) =>
    Math.abs(option - number) < Math.abs(best - number) ? option : best
  );
}

export function settingsFromConfig(config = {}) {
  return Object.fromEntries(
    Object.entries(ROOM_SETTINGS).map(([key, { options }]) => [
      key,
      nearestOption(options, config[key]),
    ])
  );
}

export function sanitizeSettings(patch) {
  return Object.fromEntries(
    Object.entries(patch ?? {}).filter(([key, value]) =>
      ROOM_SETTINGS[key]?.options.includes(value)
    )
  );
}
