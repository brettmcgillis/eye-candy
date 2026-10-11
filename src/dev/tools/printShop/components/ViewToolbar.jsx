import React from 'react';
import { FiMaximize } from 'react-icons/fi';

export const DEFAULT_VIEW = {
  backdrop: 'grey',
  explode: 0,
  folds: true,
  section: 'off',
  sectionAt: 0.5,
  shading: 'colour',
  wireframe: false,
};

const idOf = (label) => `ps-view-${label.toLowerCase().replace(/\W+/gu, '-')}`;

function Choice({ label, onChange, options, value }) {
  return (
    <label className="ps-view__field" htmlFor={idOf(label)}>
      {label}
      <select
        id={idOf(label)}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function Slider({ disabled, label, onChange, value }) {
  return (
    <label className="ps-view__field" htmlFor={idOf(label)}>
      {label}
      <input
        disabled={disabled}
        id={idOf(label)}
        max={1}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        step={0.01}
        type="range"
        value={value}
      />
    </label>
  );
}

function Toggle({ label, onChange, value }) {
  return (
    <label
      className="ps-view__field ps-view__field--toggle"
      htmlFor={idOf(label)}
    >
      <input
        checked={value}
        id={idOf(label)}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

// How the preview is drawn — nothing here changes the print.
export default function ViewToolbar({ hasStand, onFrame, setView, view }) {
  const set = (key) => (value) =>
    setView((current) => ({ ...current, [key]: value }));
  return (
    <div className="ps-view">
      <Choice
        label="Shading"
        onChange={set('shading')}
        options={[
          ['colour', 'Colour'],
          ['clay', 'Clay'],
          ['normals', 'Normals'],
        ]}
        value={view.shading}
      />
      <Choice
        label="Backdrop"
        onChange={set('backdrop')}
        options={[
          ['grey', 'Grey'],
          ['light', 'Light'],
          ['dark', 'Dark'],
        ]}
        value={view.backdrop}
      />
      <Choice
        label="Section"
        onChange={set('section')}
        options={[
          ['off', 'Off'],
          ['x', 'Cut across (X)'],
          ['z', 'Cut front–back (Z)'],
          ['y', 'Cut level (Y)'],
        ]}
        value={view.section}
      />
      <Slider
        disabled={view.section === 'off'}
        label="Cut at"
        onChange={set('sectionAt')}
        value={view.sectionAt}
      />
      <Slider
        disabled={!hasStand}
        label="Explode"
        onChange={set('explode')}
        value={view.explode}
      />
      <Toggle
        label="Wireframe"
        onChange={set('wireframe')}
        value={view.wireframe}
      />
      <Toggle label="Folds" onChange={set('folds')} value={view.folds} />
      <button className="dev-button" onClick={onFrame} type="button">
        <FiMaximize /> Frame
      </button>
    </div>
  );
}
