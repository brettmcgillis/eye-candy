import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { button, folder } from 'leva';

import { localEnv } from '@utils/appUtils';
import resolvePresetControls from '@utils/presetControls';
import { readQueryParam, writeQueryParam } from '@utils/queryParams';

import { useSyncPresetQueryParam } from './usePresetQueryParam';

function toObjectLiteral(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
  );
}

function resolvePresetOption(value, options) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) ?? null;
}

export default function usePresetsFolder({
  copyTransform,
  defaultPreset,
  getPresetControls,
  preparePreset,
  presets,
}) {
  const local = localEnv();
  const presetOptions = useMemo(() => Object.keys(presets), [presets]);
  const requestedPreset = readQueryParam('preset');
  const initialPreset = useRef(
    resolvePresetOption(requestedPreset, presetOptions) || defaultPreset
  ).current;
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [requestRevision, setRequestRevision] = useState(0);
  const initialSnapshot = useMemo(
    () =>
      structuredClone(presets[initialPreset] || presets[defaultPreset] || {}),
    [defaultPreset, initialPreset, presets]
  );
  const controlsSnapshotRef = useRef(initialSnapshot);
  const selectedPresetRef = useRef(initialPreset);
  const setControlsRef = useRef(null);
  const pendingPresetRef = useRef(null);
  const initializedRef = useRef(false);
  const applyingPresetRef = useRef(false);
  const copyTransformRef = useRef(copyTransform);
  const preparePresetRef = useRef(preparePreset);
  copyTransformRef.current = copyTransform;
  preparePresetRef.current = preparePreset;

  const applyPresetByName = useCallback(
    (presetName, context = {}) => {
      const saved = presets[presetName];
      if (!saved || applyingPresetRef.current) return;
      const presetSnapshot = structuredClone(saved);
      preparePresetRef.current?.({ presetName, presetSnapshot });
      pendingPresetRef.current = { context, presetName, presetSnapshot };
      selectedPresetRef.current = presetName;
      setSelectedPreset(presetName);
      setRequestRevision((revision) => revision + 1);
    },
    [presets]
  );

  const attachSetControls = useCallback((setControls) => {
    setControlsRef.current = setControls;
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    applyPresetByName(initialPreset);
  }, [applyPresetByName, initialPreset]);

  useEffect(() => {
    let active = true;
    const request = pendingPresetRef.current;
    // Dynamic control schemas register after their prepared scene state commits.
    queueMicrotask(() => {
      if (
        !active ||
        !request ||
        pendingPresetRef.current !== request ||
        !setControlsRef.current
      )
        return;
      const { context, presetName, presetSnapshot } = request;
      const nextControls = resolvePresetControls({
        currentControls: context.currentControls || controlsSnapshotRef.current,
        getPresetControls,
        presetName,
        presetSnapshot,
      });
      if (!nextControls) return;
      applyingPresetRef.current = true;
      try {
        setControlsRef.current({ ...nextControls, preset: presetName });
        pendingPresetRef.current = null;
      } finally {
        applyingPresetRef.current = false;
      }
    });
    return () => {
      active = false;
    };
  }, [getPresetControls, requestRevision]);

  const presetsFolder = useMemo(
    () =>
      folder(
        {
          preset: {
            label: 'Preset',
            value: initialPreset,
            options: presetOptions,
            onChange: (name) => {
              if (selectedPresetRef.current !== name) applyPresetByName(name);
            },
          },
          reset: button(() => applyPresetByName(selectedPresetRef.current)),
          ...(local
            ? {
                copy: button(() => {
                  const saved = presets[selectedPresetRef.current];
                  const current = Object.fromEntries(
                    Object.entries(controlsSnapshotRef.current).filter(
                      ([key]) => Object.hasOwn(saved, key)
                    )
                  );
                  const snapshot = structuredClone({ ...saved, ...current });
                  delete snapshot.preset;
                  const transform = copyTransformRef.current;
                  navigator.clipboard.writeText(
                    transform
                      ? transform(
                          { ...snapshot, preset: selectedPresetRef.current },
                          { currentControls: controlsSnapshotRef.current }
                        )
                      : toObjectLiteral(snapshot)
                  );
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),
    [applyPresetByName, initialPreset, local, presetOptions, presets]
  );

  useEffect(() => {
    if (requestedPreset !== null && requestedPreset !== selectedPreset) {
      writeQueryParam('preset', selectedPreset);
    }
  }, [requestedPreset, selectedPreset]);

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
    initialPreset: selectedPreset,
    presetOptions,
    presetsFolder,
    selectedPreset,
  };
}
