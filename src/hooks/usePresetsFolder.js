import { button, folder } from 'leva';

import { useCallback, useMemo, useRef, useState } from 'react';

import { localEnv } from '../utils/appUtils';
import {
  getInitialPresetFromQuery,
  useSyncPresetQueryParam,
} from './usePresetQueryParam';

function toObjectLiteral(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
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

  const initialPreset = useMemo(() => {
    return getInitialPresetFromQuery({
      defaultPreset,
      paramKey: 'preset',
      presetValues: presetOptions,
    });
  }, [defaultPreset, presetOptions]);

  const controlsSnapshotRef = useRef(
    presets[initialPreset] || presets[defaultPreset] || {}
  );
  const selectedPresetRef = useRef(initialPreset);
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const setControlsRef = useRef(null);

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

  const attachSetControls = useCallback((setControls) => {
    setControlsRef.current = setControls;
  }, []);

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
