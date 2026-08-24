import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { button, folder } from 'leva';

import { localEnv } from '@utils/appUtils';
import { readQueryParam, writeQueryParam } from '@utils/queryParams';

import { useSyncPresetQueryParam } from './usePresetQueryParam';

function toObjectLiteral(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
  );
}

function resolvePresetOption(value, presetOptions) {
  if (typeof value !== 'string') return null;

  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) return null;

  return (
    presetOptions.find((presetOption) => {
      return presetOption.toLowerCase() === normalizedValue;
    }) || null
  );
}

export default function usePresetsFolder({
  copyTransform,
  defaultPreset,
  getPresetControls,
  presets,
}) {
  const local = localEnv();
  const presetOptions = useMemo(() => Object.keys(presets), [presets]);
  const requestedPreset = readQueryParam('preset');

  const initialPreset = useMemo(() => {
    return resolvePresetOption(requestedPreset, presetOptions) || defaultPreset;
  }, [defaultPreset, presetOptions, requestedPreset]);

  const needsPresetQueryRepair = useMemo(() => {
    return requestedPreset !== null && requestedPreset !== initialPreset;
  }, [initialPreset, requestedPreset]);

  const controlsSnapshotRef = useRef(
    presets[initialPreset] || presets[defaultPreset] || {}
  );
  const selectedPresetRef = useRef(initialPreset);
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const setControlsRef = useRef(null);
  const pendingPresetRepairRef = useRef(
    needsPresetQueryRepair ? initialPreset : null
  );

  const applyPresetByName = useCallback(
    (presetName, context = {}) => {
      const setControls = setControlsRef.current;
      const presetSnapshot = presets[presetName];

      if (!setControls || !presetSnapshot) return;

      selectedPresetRef.current = presetName;
      setSelectedPreset(presetName);

      const nextControls = getPresetControls({
        currentControls: context.currentControls || controlsSnapshotRef.current,
        presetName,
        presetSnapshot,
      });

      if (!nextControls) return;
      setControls({ ...nextControls, preset: presetName });
    },
    [getPresetControls, presets]
  );

  const presetsFolder = useMemo(() => {
    return folder(
      {
        preset: {
          label: 'Preset',
          value: initialPreset,
          options: presetOptions,
          onChange: (nextPreset) => {
            if (selectedPresetRef.current === nextPreset) return;
            selectedPresetRef.current = nextPreset;
            setSelectedPreset(nextPreset);
            applyPresetByName(nextPreset);
          },
        },
        reset: button(() => {
          applyPresetByName(selectedPresetRef.current);
        }),
        ...(local
          ? {
              copy: button(() => {
                const transform = copyTransform || toObjectLiteral;
                navigator.clipboard.writeText(
                  transform(controlsSnapshotRef.current)
                );
              }),
            }
          : {}),
      },
      { collapsed: true }
    );
  }, [applyPresetByName, copyTransform, initialPreset, local, presetOptions]);

  const attachSetControls = useCallback(
    (setControls) => {
      setControlsRef.current = setControls;
      const pendingPreset = pendingPresetRepairRef.current;

      if (!pendingPreset) return;

      pendingPresetRepairRef.current = null;
      applyPresetByName(pendingPreset, {
        currentControls: controlsSnapshotRef.current,
      });
    },
    [applyPresetByName]
  );

  useEffect(() => {
    if (!needsPresetQueryRepair) return;

    writeQueryParam('preset', initialPreset);
  }, [initialPreset, needsPresetQueryRepair]);

  useSyncPresetQueryParam({
    defaultPreset,
    paramKey: 'preset',
    presetValues: presetOptions,
    selectedPreset,
  });

  return {
    applyPresetByName,
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetOptions,
    presetsFolder,
    selectedPreset,
  };
}
