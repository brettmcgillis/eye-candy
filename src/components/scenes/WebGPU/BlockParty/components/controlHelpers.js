export function presetReader(preset) {
  return (key, fallback) => preset[key] ?? fallback;
}

export function range(label, value, min, max, step) {
  return { label, max, min, step, value };
}

export function choice(label, value, options) {
  return {
    label,
    options: Object.fromEntries(
      options.map((option) => [
        option.charAt(0).toUpperCase() + option.slice(1),
        option,
      ])
    ),
    value,
  };
}
