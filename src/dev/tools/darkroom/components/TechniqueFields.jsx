import React, { useMemo } from 'react';

import { SchemaField, SchemaProvider } from '@dev/renderWorkbench/SchemaFields';

const NO_PINS = new Set();

export default function TechniqueFields({ onChange, technique, values }) {
  const context = useMemo(
    () => ({ pins: NO_PINS, specs: technique.options, toggle: () => {} }),
    [technique]
  );

  return (
    <SchemaProvider value={context}>
      {technique.sections
        .filter((section) => section.keys.length)
        .map((section) => (
          <details
            className="rw-control-section rw-advanced"
            key={section.title}
            open
          >
            <summary>{section.title}</summary>
            <div className="rw-field-grid">
              {section.keys.map((key) => (
                <SchemaField
                  choices={technique.choices?.[key]}
                  key={key}
                  onChange={(value) => onChange(key, value)}
                  option={key}
                  value={values[key]}
                />
              ))}
            </div>
          </details>
        ))}
    </SchemaProvider>
  );
}
