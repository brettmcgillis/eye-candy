import React from 'react';

import { SchemaField } from '@dev/renderWorkbench/SchemaFields';

import { sectionsFor } from '@modules/rugPull';

// Fields the page lays out itself rather than as a schema section.
const HANDLED = new Set([
  'base',
  'count',
  'height',
  'keep',
  'out',
  'png',
  'svg',
  'views',
  'webp',
  'width',
]);

const OPEN = new Set(['output', 'mine']);
const FORMATS = ['png', 'webp', 'svg'];

// Every option the CLI accepts, grouped by its schema section. Adding a knob
// to renderOptions.mjs puts it here with no page change.
export default function OptionSections({ options, setOption }) {
  const sections = sectionsFor('still', 'workbench')
    .map((section) => ({
      ...section,
      keys: section.keys.filter((key) => !HANDLED.has(key)),
    }))
    .filter((section) => section.keys.length > 0);

  return (
    <>
      <fieldset className="rw-fieldset rw-formats">
        <legend>Image files</legend>
        {FORMATS.map((format) => (
          <label htmlFor={`rp-${format}`} key={format}>
            <input
              checked={Boolean(options[format])}
              disabled={
                options[format] &&
                !FORMATS.some((other) => other !== format && options[other])
              }
              id={`rp-${format}`}
              onChange={(event) => setOption(format, event.target.checked)}
              type="checkbox"
            />
            {format.toUpperCase()}
          </label>
        ))}
      </fieldset>
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
