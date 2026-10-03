import React from 'react';

import { SchemaField } from '@dev/renderWorkbench/SchemaFields';

import { FAMILIES, FAMILY_LABELS, VIEWS, sectionsFor } from '@modules/apollian';
import { PALETTE_NAMES } from '@modules/apollianRender';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

// Fields the page lays out itself rather than as a schema section.
const HANDLED = new Set([
  'base',
  'count',
  'families',
  'height',
  'keep',
  'mode',
  'out',
  'palettes',
  'png',
  'svg',
  'views',
  'webp',
  'width',
]);

const OPEN = new Set(['output', 'video', 'svg']);

function ListPicker({ id, label, labels = {}, onChange, options, value }) {
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
        <label htmlFor={`ap-${id}-${item}`} key={item}>
          <input
            checked={selected.has(item)}
            id={`ap-${id}-${item}`}
            onChange={() => toggle(item)}
            type="checkbox"
          />
          {labels[item] ?? item}
        </label>
      ))}
    </fieldset>
  );
}

// Every option the kind accepts, grouped by its schema section. Adding a
// knob to renderOptions.mjs puts it here with no page change.
export default function OptionSections({ kind, options, setOption }) {
  const sections = sectionsFor(kind, 'workbench')
    .map((section) => ({
      ...section,
      keys: section.keys.filter((key) => !HANDLED.has(key)),
    }))
    .filter((section) => section.keys.length > 0);

  return (
    <>
      <ListPicker
        id="family"
        label="Families"
        labels={FAMILY_LABELS}
        onChange={(value) => setOption('families', value)}
        options={FAMILIES}
        value={options.families}
      />
      {kind === 'still' ? (
        <>
          <ListPicker
            id="view"
            label="Views"
            onChange={(value) => setOption('views', value)}
            options={VIEWS}
            value={options.views}
          />
          <fieldset className="rw-fieldset rw-formats">
            <legend>Image files</legend>
            {['png', 'webp', 'svg'].map((format) => (
              <label htmlFor={`ap-${format}`} key={format}>
                <input
                  checked={Boolean(options[format])}
                  disabled={
                    options[format] &&
                    !['png', 'webp', 'svg'].some(
                      (other) => other !== format && options[other]
                    )
                  }
                  id={`ap-${format}`}
                  onChange={(event) => setOption(format, event.target.checked)}
                  type="checkbox"
                />
                {format.toUpperCase()}
              </label>
            ))}
          </fieldset>
        </>
      ) : null}
      {sections.map((section) => (
        <details
          className="rw-control-section rw-advanced"
          key={section.id}
          open={OPEN.has(section.id)}
        >
          <summary>{section.label}</summary>
          <div className="rw-field-grid">
            {section.keys.map((key) => (
              <SchemaField
                choices={key === 'paletteName' ? PALETTE_CHOICES : undefined}
                key={key}
                onChange={(value) => setOption(key, value)}
                option={key}
                value={options[key]}
              />
            ))}
          </div>
        </details>
      ))}
    </>
  );
}
