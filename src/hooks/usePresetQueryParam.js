import { useEffect, useMemo } from 'react';

import { readQueryParam, writeQueryParam } from '../utils/queryParams';

function isValidPresetValue(value, presetValues) {
  return typeof value === 'string' && presetValues.includes(value);
}

function resolvePresetValue(value, presetValues) {
  if (typeof value !== 'string') return null;

  if (isValidPresetValue(value, presetValues)) {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  return (
    presetValues.find((presetValue) => {
      return presetValue.toLowerCase() === normalized;
    }) || null
  );
}

export function getInitialPresetFromQuery({
  defaultPreset,
  paramKey = 'preset',
  presetValues,
}) {
  const requestedPreset = readQueryParam(paramKey);
  return resolvePresetValue(requestedPreset, presetValues) || defaultPreset;
}

export function useSyncPresetQueryParam({
  defaultPreset,
  paramKey = 'preset',
  presetValues,
  selectedPreset,
}) {
  const normalizedPreset = useMemo(() => {
    return resolvePresetValue(selectedPreset, presetValues) || defaultPreset;
  }, [defaultPreset, presetValues, selectedPreset]);

  useEffect(() => {
    // Always persist the active preset so bookmarks remain stable if defaults change.
    writeQueryParam(paramKey, normalizedPreset);
  }, [normalizedPreset, paramKey]);
}
