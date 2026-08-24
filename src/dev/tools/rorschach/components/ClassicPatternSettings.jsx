import React from 'react';
import { FiRotateCcw, FiX } from 'react-icons/fi';

export const DEFAULT_CLASSIC_PATTERN_SETTINGS = {
  backgroundColor: '#fefbf7',
  density: 0.5,
  details: 3.75,
  highDpi: true,
  inkColor: '#1a1a33',
  scale: 1,
  sharpness: 0.95,
  speed: 1,
  symmetry: 0.5,
};

const RANGE_CONTROLS = [
  { key: 'speed', label: 'Speed', max: 10, min: 0, step: 0.1 },
  { key: 'scale', label: 'Scale', max: 10, min: 0.5, step: 0.5 },
  { key: 'details', label: 'Details', max: 5, min: 1, step: 0.01 },
  { key: 'sharpness', label: 'Sharpness', max: 1, min: 0, step: 0.01 },
  { key: 'density', label: 'Density', max: 1, min: 0, step: 0.01 },
  { key: 'symmetry', label: 'Symmetry', max: 1, min: 0.5, step: 0.01 },
];

function PatternRange({ control, onChange, value }) {
  const id = `rw-pattern-${control.key}`;

  return (
    <label className="rw-pattern-settings__range" htmlFor={id}>
      <span>{control.label}</span>
      <output htmlFor={id}>{value}</output>
      <input
        id={id}
        max={control.max}
        min={control.min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={control.step}
        type="range"
        value={value}
      />
    </label>
  );
}

function PatternColor({ colorKey, label, onChange, value }) {
  const id = `rw-pattern-${colorKey}`;

  return (
    <label className="rw-pattern-settings__color" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value}
      />
      <output htmlFor={id}>{value.toUpperCase()}</output>
    </label>
  );
}

export default function ClassicPatternSettings({
  onChange,
  onClose,
  onReset,
  settings,
}) {
  return (
    <dialog
      aria-labelledby="rw-pattern-settings-title"
      className="rw-pattern-settings"
      onCancel={onClose}
      open
    >
      <div className="rw-pattern-settings__panel">
        <header className="rw-pattern-settings__header">
          <div>
            <span>Classic mode</span>
            <h2 id="rw-pattern-settings-title">Background pattern</h2>
          </div>
          <button
            aria-label="Close pattern settings"
            className="rw-pattern-settings__icon-button"
            onClick={onClose}
            type="button"
          >
            <FiX />
          </button>
        </header>

        <section className="rw-pattern-settings__section">
          <h3>Simulation</h3>
          {RANGE_CONTROLS.slice(0, 2).map((control) => (
            <PatternRange
              control={control}
              key={control.key}
              onChange={(value) => onChange(control.key, value)}
              value={settings[control.key]}
            />
          ))}
          {window.devicePixelRatio > 1 ? (
            <label
              className="rw-pattern-settings__toggle"
              htmlFor="rw-pattern-high-dpi"
            >
              <span>High DPI</span>
              <input
                checked={settings.highDpi}
                id="rw-pattern-high-dpi"
                onChange={(event) => onChange('highDpi', event.target.checked)}
                type="checkbox"
              />
            </label>
          ) : null}
        </section>

        <section className="rw-pattern-settings__section">
          <h3>Appearance</h3>
          {RANGE_CONTROLS.slice(2).map((control) => (
            <PatternRange
              control={control}
              key={control.key}
              onChange={(value) => onChange(control.key, value)}
              value={settings[control.key]}
            />
          ))}
          <div className="rw-pattern-settings__colors">
            <PatternColor
              colorKey="ink-color"
              label="Ink"
              onChange={(value) => onChange('inkColor', value)}
              value={settings.inkColor}
            />
            <PatternColor
              colorKey="background-color"
              label="Paper"
              onChange={(value) => onChange('backgroundColor', value)}
              value={settings.backgroundColor}
            />
          </div>
        </section>

        <footer className="rw-pattern-settings__footer">
          <span />
          <button className="dev-button" onClick={onReset} type="button">
            <FiRotateCcw /> Reset
          </button>
        </footer>
      </div>
    </dialog>
  );
}
