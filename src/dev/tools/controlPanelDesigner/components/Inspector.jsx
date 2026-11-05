import React, { memo, useId } from 'react';

import { DESIGN_CATALOGUE } from '@modules/controlPanel';

export const catalogueLabel = (entry) =>
  `${entry.id}${entry.variant ? ` / ${entry.variant}` : ''} · starts ${entry.w}×${entry.h}`;

const NumberField = memo(function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 40,
  step = 0.25,
}) {
  const id = useId();
  return (
    <label className="rw-field" htmlFor={id}>
      {label}
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          if (event.target.value !== '') onChange(Number(event.target.value));
        }}
      />
    </label>
  );
});
export { NumberField };

function Inspector({ editor, mode, setMode }) {
  const { item, module, control } = editor;
  if (!item)
    return (
      <section className="cpd-section">
        <h2>Selection</h2>
        <p className="rw-hint">
          Place or select a module to arrange its controls.
        </p>
      </section>
    );
  const variants = control
    ? DESIGN_CATALOGUE.filter(
        (entry, index, entries) =>
          entry.id === control.type &&
          entries.findIndex(
            (other) => other.id === entry.id && other.variant === entry.variant
          ) === index
      )
    : [];
  return (
    <section className="cpd-section">
      <h2>{control ? control.type : `Module ${module.id}`}</h2>
      <div className="cpd-fields">
        {['x', 'y', 'w', 'h'].map((key) => (
          <NumberField
            key={key}
            label={{ x: 'X', y: 'Y', w: 'Width', h: 'Height' }[key]}
            value={item[key]}
            min={key === 'w' || key === 'h' ? 0.5 : 0}
            onChange={(value) => editor.updateItem({ [key]: value })}
          />
        ))}
      </div>
      {variants.length > 1 ? (
        <label className="rw-field" htmlFor="cpd-variant">
          Variant
          <select
            id="cpd-variant"
            value={control.variant ?? ''}
            onChange={(event) =>
              editor.updateItem({ variant: event.target.value || null })
            }
          >
            {variants.map((entry) => (
              <option
                key={`${entry.variant}:${entry.w}:${entry.h}`}
                value={entry.variant ?? ''}
              >
                {entry.variant ?? 'Seeded variation'}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <NumberField
        label="Detail seed"
        value={item.seed}
        max={99999}
        step={1}
        onChange={(value) => editor.updateItem({ seed: value })}
      />
      {!control ? (
        <label className="cpd-check" htmlFor="cpd-zone">
          <input
            id="cpd-zone"
            type="checkbox"
            checked={module.zone}
            onChange={(event) =>
              editor.updateModule({ zone: event.target.checked })
            }
          />{' '}
          Zone plate colour
        </label>
      ) : null}
      {control ? (
        <p className="rw-hint">Rotation: {control.rotation ?? 0}° clockwise</p>
      ) : null}
      <div className="cpd-row">
        <button
          className="dev-button"
          type="button"
          onClick={() => editor.rotate()}
        >
          Rotate 90° ↻
        </button>
        <button
          className="dev-button"
          type="button"
          onClick={() =>
            editor.updateItem({ seed: Math.floor(Math.random() * 100000) })
          }
        >
          Reroll details
        </button>
        <button className="dev-button" type="button" onClick={editor.duplicate}>
          Duplicate
        </button>
        <button className="dev-button" type="button" onClick={editor.remove}>
          Delete selected
        </button>
        {mode === 'modules' ? (
          <button
            className="dev-button dev-button--primary"
            type="button"
            onClick={() => setMode('controls')}
          >
            Edit controls in module
          </button>
        ) : (
          <button
            className="dev-button"
            type="button"
            onClick={() => {
              editor.select({ module: module.id, control: null });
              setMode('modules');
            }}
          >
            Back to panel layout
          </button>
        )}
      </div>
    </section>
  );
}
export default memo(Inspector);
