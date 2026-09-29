import React from 'react';

import { SchemaField } from '@dev/renderWorkbench/SchemaFields';

import { PALETTE_NONE, sectionsFor } from '@modules/subdivision';
import { PALETTE_NAMES } from '@utils/gradientPalette';

import SourceImageField from './SourceImageField';

const PALETTE_CHOICES = [PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);
const FORMATS = ['png', 'webp', 'svg'];

// Fields the page lays out itself, the Hold buttons own, or the job runner
// owns.
const HANDLED = new Set([
  'base',
  'count',
  'height',
  'keep',
  'mode',
  'out',
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
          {FORMATS.map((format) => (
            <label htmlFor={`sd-${format}`} key={format}>
              <input
                checked={Boolean(options[format])}
                disabled={
                  options[format] &&
                  !FORMATS.some((other) => other !== format && options[other])
                }
                id={`sd-${format}`}
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
            {section.keys.map((key) =>
              key === 'sourceImage' ? (
                <SourceImageField
                  key={key}
                  onChange={(value) => setOption(key, value)}
                  value={options[key]}
                />
              ) : (
                <SchemaField
                  choices={key === 'palette' ? PALETTE_CHOICES : undefined}
                  key={key}
                  onChange={(value) => setOption(key, value)}
                  option={key}
                  value={options[key]}
                />
              )
            )}
          </div>
        </details>
      ))}
    </>
  );
}
