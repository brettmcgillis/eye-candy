import React from 'react';

import { SchemaField } from '@dev/renderWorkbench/SchemaFields';

import { PALETTE_NONE, VIEWS, sectionsFor } from '@modules/flora';
import { PALETTE_NAMES } from '@utils/gradientPalette';

const PALETTE_CHOICES = [PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);

// Fields the page lays out itself rather than as a schema section.
const HANDLED = new Set([
  'bouquet',
  'bouquetFill',
  'bouquetJitter',
  'bouquetSize',
  'bouquetSpread',
  'bouquetTie',
  'count',
  'height',
  'mode',
  'png',
  'svg',
  'views',
  'webp',
  'width',
]);

const OPEN = new Set(['output', 'video']);

function ViewPicker({ onChange, value }) {
  const selected = new Set(
    String(value ?? '')
      .split(',')
      .filter(Boolean)
  );
  const toggle = (view) => {
    const next = new Set(selected);
    if (next.has(view)) next.delete(view);
    else next.add(view);
    if (next.size > 0) onChange(VIEWS.filter((v) => next.has(v)).join(','));
  };
  return (
    <fieldset className="rw-fieldset rw-formats">
      <legend>Views</legend>
      {VIEWS.map((view) => (
        <label htmlFor={`fw-view-${view}`} key={view}>
          <input
            checked={selected.has(view)}
            id={`fw-view-${view}`}
            onChange={() => toggle(view)}
            type="checkbox"
          />
          {view}
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
      {kind === 'still' ? (
        <>
          <ViewPicker
            onChange={(value) => setOption('views', value)}
            value={options.views}
          />
          <fieldset className="rw-fieldset rw-formats">
            <legend>Image files</legend>
            {['png', 'webp', 'svg'].map((format) => (
              <label htmlFor={`fw-${format}`} key={format}>
                <input
                  checked={Boolean(options[format])}
                  disabled={
                    options[format] &&
                    !['png', 'webp', 'svg'].some(
                      (other) => other !== format && options[other]
                    )
                  }
                  id={`fw-${format}`}
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
