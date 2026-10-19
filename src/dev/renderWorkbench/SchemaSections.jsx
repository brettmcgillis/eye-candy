import React from 'react';

import { SchemaField } from './SchemaFields';

const FORMATS = ['png', 'webp', 'svg', 'dxf'];

// Laid out by RollWorkbench itself.
const PAGE_KEYS = [
  'base',
  'count',
  'height',
  'keep',
  'mode',
  'out',
  'palettes',
  'views',
  'width',
  ...FORMATS,
];

export function ListPicker({
  id,
  label,
  labels = {},
  onChange,
  options,
  value,
}) {
  const selected = new Set(
    String(value ?? '')
      .split(',')
      .filter(Boolean)
  );
  const toggle = (item) => {
    const next = new Set(selected);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    if (next.size > 0) onChange(options.filter((o) => next.has(o)).join(','));
  };
  return (
    <fieldset className="rw-fieldset rw-formats">
      <legend>{label}</legend>
      {options.map((item) => (
        <label htmlFor={`rw-${id}-${item}`} key={item}>
          <input
            checked={selected.has(item)}
            id={`rw-${id}-${item}`}
            onChange={() => toggle(item)}
            type="checkbox"
          />
          {labels[item] ?? item}
        </label>
      ))}
    </fieldset>
  );
}

// At least one format stays ticked: the server rejects a still with none.
function FormatPicker({ formats, options, setOption }) {
  return (
    <fieldset className="rw-fieldset rw-formats">
      <legend>Image files</legend>
      {formats.map((format) => (
        <label htmlFor={`rw-format-${format}`} key={format}>
          <input
            checked={Boolean(options[format])}
            disabled={
              options[format] &&
              !formats.some((other) => other !== format && options[other])
            }
            id={`rw-format-${format}`}
            onChange={(event) => setOption(format, event.target.checked)}
            type="checkbox"
          />
          {format.toUpperCase()}
        </label>
      ))}
    </fieldset>
  );
}

const followsWhen = (spec, options) =>
  Object.entries(spec.when ?? {}).every(([name, allowed]) =>
    allowed.includes(options[name])
  );

// Every option the kind accepts, grouped by its schema section, so a knob
// added to the kernel's renderOptions.mjs appears here with no page change.
export default function SchemaSections({
  choices = {},
  fields = {},
  followWhen = false,
  handled = [],
  kind,
  open = ['output', 'video'],
  options,
  pickers = [],
  schema,
  setOption,
}) {
  const { RENDER_OPTIONS, VIEWS, sectionsFor } = schema;
  const skip = new Set([
    ...PAGE_KEYS,
    ...handled,
    ...pickers.map((picker) => picker.key),
  ]);
  const formats = FORMATS.filter((key) => RENDER_OPTIONS[key]?.scope === kind);
  const sections = sectionsFor(kind, 'workbench')
    .map((section) => ({
      ...section,
      keys: section.keys.filter(
        (key) =>
          !skip.has(key) &&
          !RENDER_OPTIONS[key].cliOnly &&
          (!followWhen || followsWhen(RENDER_OPTIONS[key], options))
      ),
    }))
    .filter((section) => section.keys.length > 0);

  return (
    <>
      {pickers.map((picker) => (
        <ListPicker
          id={picker.key}
          key={picker.key}
          label={picker.label}
          labels={picker.labels}
          onChange={(value) => setOption(picker.key, value)}
          options={picker.options}
          value={options[picker.key]}
        />
      ))}
      {VIEWS && RENDER_OPTIONS.views?.scope === kind ? (
        <ListPicker
          id="view"
          label="Views"
          onChange={(value) => setOption('views', value)}
          options={VIEWS}
          value={options.views}
        />
      ) : null}
      {formats.length > 0 ? (
        <FormatPicker
          formats={formats}
          options={options}
          setOption={setOption}
        />
      ) : null}
      {sections.map((section) => (
        <details
          className="rw-control-section rw-advanced"
          key={section.id}
          open={open.includes(section.id)}
        >
          <summary>{section.label}</summary>
          <div className="rw-field-grid">
            {section.keys.map((key) => {
              const Field = fields[key];
              const onChange = (value) => setOption(key, value);
              return Field ? (
                <Field key={key} onChange={onChange} value={options[key]} />
              ) : (
                <SchemaField
                  choices={choices[key]}
                  key={key}
                  onChange={onChange}
                  option={key}
                  value={options[key]}
                />
              );
            })}
          </div>
        </details>
      ))}
    </>
  );
}
