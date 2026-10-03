import React from 'react';

import { SchemaField } from '@dev/renderWorkbench/SchemaFields';

import { sectionsFor } from '@modules/isoLines';
import { PALETTE_NAMES } from '@modules/isoLinesRender';

const PALETTE_CHOICES = [
  ['None', 'None'],
  ...PALETTE_NAMES.map((name) => [name, name]),
];

// Fields the page lays out itself rather than as a schema section.
const HANDLED = new Set([
  'base',
  'count',
  'height',
  'keep',
  'out',
  'palettes',
  'png',
  'svg',
  'webp',
  'width',
]);

const OPEN = new Set(['output', 'video']);

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
      {kind === 'still' ? (
        <fieldset className="rw-fieldset rw-formats">
          <legend>Image files</legend>
          {['png', 'webp', 'svg'].map((format) => (
            <label htmlFor={`il-${format}`} key={format}>
              <input
                checked={Boolean(options[format])}
                disabled={
                  options[format] &&
                  !['png', 'webp', 'svg'].some(
                    (other) => other !== format && options[other]
                  )
                }
                id={`il-${format}`}
                onChange={(event) => setOption(format, event.target.checked)}
                type="checkbox"
              />
              {format.toUpperCase()}
            </label>
          ))}
        </fieldset>
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
