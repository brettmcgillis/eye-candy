import React, { createContext, useContext } from 'react';

// Form controls bound to an option schema (src/modules/optionSchema). A field
// names its option; the spec supplies the range, choices and whether the dice
// may set it. Rollable fields carry a pin checkbox: ticked means "hold this
// value", which is the same rule a typed CLI flag follows.
const SchemaContext = createContext({
  pins: new Set(),
  specs: {},
  toggle: () => {},
});

export const SchemaProvider = SchemaContext.Provider;

function usePin(option) {
  const { pins, specs, toggle } = useContext(SchemaContext);
  const spec = specs[option] ?? {};
  const rollable = Boolean(spec.facet);
  return {
    enabled: !rollable || pins.has(option),
    onToggle: () => toggle(option),
    rollable,
    spec,
  };
}

export function Pinnable({ children, label, option }) {
  const { enabled, onToggle, rollable } = usePin(option);
  if (!rollable) return children;

  return (
    <div className={`rw-pinnable${enabled ? ' rw-pinnable--on' : ''}`}>
      <label className="rw-pin" htmlFor={`rw-pin-${option}`}>
        <input
          aria-label={`Pin ${label}`}
          checked={enabled}
          id={`rw-pin-${option}`}
          onChange={onToggle}
          type="checkbox"
        />
      </label>
      {children}
    </div>
  );
}

// A spec with `choices` is a fixed set, not a range, so it gets a picker
// rather than a spinner.
export function NumberField({ id, label, onChange, option, value }) {
  const { enabled, spec } = usePin(option);

  const control = spec.choices ? (
    <label className="rw-field" htmlFor={id}>
      {label}
      <select
        disabled={!enabled}
        id={id}
        onChange={(event) => onChange(Number(event.target.value))}
        value={value ?? spec.default}
      >
        {spec.choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </label>
  ) : (
    <label className="rw-field" htmlFor={id}>
      {label}
      <input
        disabled={!enabled}
        id={id}
        max={spec.max}
        min={spec.min}
        onChange={(event) => onChange(event.target.value)}
        step={spec.step}
        type="number"
        value={value ?? ''}
      />
    </label>
  );

  return (
    <Pinnable label={label} option={option}>
      {control}
    </Pinnable>
  );
}

export function TextField({ id, label, onChange, option, placeholder, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field" htmlFor={id}>
        {label}
        <input
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value ?? ''}
        />
      </label>
    </Pinnable>
  );
}

export function ChoiceField({ choices, id, label, onChange, option, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field" htmlFor={id}>
        {label}
        <select
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={value ?? ''}
        >
          {choices.map(([choiceValue, choiceLabel]) => (
            <option key={choiceValue} value={choiceValue}>
              {choiceLabel}
            </option>
          ))}
        </select>
      </label>
    </Pinnable>
  );
}

export function ToggleField({ id, label, onChange, option, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field rw-field--toggle" htmlFor={id}>
        {label}
        <input
          checked={Boolean(value)}
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </label>
    </Pinnable>
  );
}

export function ColorField({ id, label, onChange, option, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field" htmlFor={id}>
        {label}
        <input
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
      </label>
    </Pinnable>
  );
}

function titleCase(key) {
  const spaced = key.replace(/([a-z0-9])([A-Z])/gu, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Picks the control a spec asks for, so a tool whose options are plain data
// can render its whole form from the schema. `choices` overrides an option
// whose values live outside the dependency-free schema (palette names).
export function SchemaField({ choices, onChange, option, value }) {
  const { specs } = useContext(SchemaContext);
  const spec = specs[option];
  const id = `rw-${option}`;
  const label = spec.label ?? titleCase(option);
  const props = { id, label, onChange, option, value };

  if (choices || spec.type === 'enum') {
    const list =
      choices ??
      spec.choices.map((choice) => [
        choice,
        spec.choiceLabels?.[choice] ?? choice,
      ]);
    return <ChoiceField choices={list} {...props} />;
  }
  if (spec.type === 'boolean') return <ToggleField {...props} />;
  if (spec.type === 'color') return <ColorField {...props} />;
  if (spec.type === 'string' || (spec.type === 'seed' && spec.text)) {
    return <TextField placeholder={spec.placeholder} {...props} />;
  }
  return <NumberField {...props} />;
}

export function Segmented({ label, onChange, options, value }) {
  return (
    <fieldset className="rw-fieldset">
      <legend>{label}</legend>
      <div className="rw-segmented">
        {options.map((option) => (
          <button
            aria-label={option.label}
            aria-pressed={value === option.value}
            className="rw-segmented__button"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
