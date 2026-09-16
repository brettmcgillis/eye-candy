import React from 'react';

const sameVector = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.join() === b.join();

export default function ParamField({ bands = [], field, onChange, value }) {
  const id = `glyphs-param-${field.key}`;

  if (field.type === 'toggle') {
    return (
      <label className="glyphs-field glyphs-field--toggle" htmlFor={id}>
        <input
          checked={Boolean(value)}
          id={id}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'color') {
    return (
      <label className="glyphs-field" htmlFor={id}>
        <span>{field.label}</span>
        <span className="glyphs-field__control">
          <input
            id={id}
            onChange={(event) => onChange(event.target.value)}
            type="color"
            value={value}
          />
          <code>{value}</code>
        </span>
      </label>
    );
  }

  if (field.type === 'vector') {
    const index = field.options.findIndex((option) =>
      sameVector(option.value, value)
    );
    return (
      <label className="glyphs-field" htmlFor={id}>
        <span>{field.label}</span>
        <select
          id={id}
          onChange={(event) =>
            onChange(field.options[Number(event.target.value)].value)
          }
          value={index}
        >
          {index < 0 ? <option value={-1}>{value.join(' · ')}</option> : null}
          {field.options.map((option, optionIndex) => (
            <option key={option.label} value={optionIndex}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'band') {
    return (
      <label className="glyphs-field" htmlFor={id}>
        <span>{field.label}</span>
        <select
          disabled={!bands.length}
          id={id}
          onChange={(event) => {
            const band = bands[Number(event.target.value)];
            onChange(band.y, { cellH: band.height });
          }}
          value={Math.max(
            0,
            bands.findIndex((band) => band.y === value)
          )}
        >
          {bands.length ? (
            bands.map((band, bandIndex) => (
              <option key={band.y} value={bandIndex}>
                {`row ${band.y} · ${band.height} tall`}
              </option>
            ))
          ) : (
            <option value={0}>no ink in this pattern</option>
          )}
        </select>
      </label>
    );
  }

  return (
    <label className="glyphs-field" htmlFor={id}>
      <span>{field.label}</span>
      <span className="glyphs-field__control">
        <input
          id={id}
          max={field.max}
          min={field.min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={field.step}
          type="range"
          value={value}
        />
        <input
          aria-label={`${field.label} value`}
          className="glyphs-field__number"
          max={field.max}
          min={field.min}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(next);
          }}
          step={field.step}
          type="number"
          value={value}
        />
      </span>
    </label>
  );
}
