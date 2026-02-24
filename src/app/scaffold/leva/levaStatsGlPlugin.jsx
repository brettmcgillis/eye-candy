import { Components, createPlugin, useInputContext } from 'leva/plugin';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';

const { Label, Row } = Components;

const listeners = new Set();
const defaultOptions = {
  trackGPU: true,
  logsPerSecond: 8,
  samplesLog: 60,
  samplesGraph: 30,
  precision: 1,
  minimal: false,
  horizontal: false,
  mode: 0,
};

let state = {
  enabled: false,
  parent: null,
  showPanel: 0,
  options: defaultOptions,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useLevaStatsGlState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function setLevaStatsGlState(nextState) {
  const enabled =
    typeof nextState.enabled === 'boolean' ? nextState.enabled : state.enabled;
  const parent = 'parent' in nextState ? nextState.parent : state.parent;
  const showPanel =
    Number.isInteger(nextState.showPanel) && nextState.showPanel >= 0
      ? nextState.showPanel
      : state.showPanel;
  const options = nextState.options
    ? { ...state.options, ...nextState.options }
    : state.options;

  state = {
    enabled,
    parent,
    showPanel,
    options,
  };
  emit();
}

function LevaStatsGlInput() {
  const { label, settings } = useInputContext();
  const mountRef = useRef(null);

  useEffect(() => {
    const parent = { current: mountRef.current };
    const showPanel = Number.isInteger(settings?.showPanel)
      ? settings.showPanel
      : 0;
    const options = {
      trackGPU:
        typeof settings?.trackGPU === 'boolean'
          ? settings.trackGPU
          : defaultOptions.trackGPU,
      logsPerSecond:
        Number.isFinite(settings?.logsPerSecond) && settings.logsPerSecond > 0
          ? Number(settings.logsPerSecond)
          : defaultOptions.logsPerSecond,
      samplesLog:
        Number.isFinite(settings?.samplesLog) && settings.samplesLog > 0
          ? Number(settings.samplesLog)
          : defaultOptions.samplesLog,
      samplesGraph:
        Number.isFinite(settings?.samplesGraph) && settings.samplesGraph > 0
          ? Number(settings.samplesGraph)
          : defaultOptions.samplesGraph,
      precision:
        Number.isFinite(settings?.precision) && settings.precision >= 0
          ? Number(settings.precision)
          : defaultOptions.precision,
      minimal:
        typeof settings?.minimal === 'boolean'
          ? settings.minimal
          : defaultOptions.minimal,
      horizontal:
        typeof settings?.horizontal === 'boolean'
          ? settings.horizontal
          : defaultOptions.horizontal,
      mode:
        Number.isInteger(settings?.mode) && settings.mode >= 0
          ? Number(settings.mode)
          : defaultOptions.mode,
    };

    setLevaStatsGlState({ enabled: true, parent, showPanel, options });

    return () => {
      if (getSnapshot().parent === parent) {
        setLevaStatsGlState({ enabled: false, parent: null });
      }
    };
  }, [
    settings?.showPanel,
    settings?.trackGPU,
    settings?.logsPerSecond,
    settings?.samplesLog,
    settings?.samplesGraph,
    settings?.precision,
    settings?.minimal,
    settings?.horizontal,
    settings?.mode,
  ]);

  return (
    <Row input>
      <Label align="top">{label}</Label>
      <div ref={mountRef} />
    </Row>
  );
}

export const levaStatsGlPlugin = createPlugin({
  component: LevaStatsGlInput,
  normalize: (input) => ({
    value: 0,
    settings: {
      showPanel:
        typeof input === 'object' && input !== null && 'showPanel' in input
          ? Number(input.showPanel) || 0
          : 0,
      trackGPU:
        typeof input === 'object' && input !== null && 'trackGPU' in input
          ? !!input.trackGPU
          : defaultOptions.trackGPU,
      logsPerSecond:
        typeof input === 'object' && input !== null && 'logsPerSecond' in input
          ? Number(input.logsPerSecond) || defaultOptions.logsPerSecond
          : defaultOptions.logsPerSecond,
      samplesLog:
        typeof input === 'object' && input !== null && 'samplesLog' in input
          ? Number(input.samplesLog) || defaultOptions.samplesLog
          : defaultOptions.samplesLog,
      samplesGraph:
        typeof input === 'object' && input !== null && 'samplesGraph' in input
          ? Number(input.samplesGraph) || defaultOptions.samplesGraph
          : defaultOptions.samplesGraph,
      precision:
        typeof input === 'object' && input !== null && 'precision' in input
          ? Number(input.precision) || 0
          : defaultOptions.precision,
      minimal:
        typeof input === 'object' && input !== null && 'minimal' in input
          ? !!input.minimal
          : defaultOptions.minimal,
      horizontal:
        typeof input === 'object' && input !== null && 'horizontal' in input
          ? !!input.horizontal
          : defaultOptions.horizontal,
      mode:
        typeof input === 'object' && input !== null && 'mode' in input
          ? Number(input.mode) || 0
          : defaultOptions.mode,
    },
  }),
  sanitize: (value) => value,
});
