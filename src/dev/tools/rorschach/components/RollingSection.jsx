import React from 'react';

import { NumberField } from '@dev/renderWorkbench/SchemaFields';

// Blank follows the main seed; setting one holds that facet still while the
// others keep moving — the same structure through a hundred palettes, or one
// palette across a hundred blots.
export default function RollingSection({ options, setOption }) {
  return (
    <details className="rw-control-section rw-advanced">
      <summary>Rolling</summary>
      <p className="rw-hint">
        Blank follows the main seed. Set one to hold that facet still while the
        others keep moving — the same structure through a hundred palettes, or
        one palette across a hundred blots.
      </p>
      <div className="rw-field-grid">
        <NumberField
          id="rw-structure-seed"
          option="structureSeed"
          label="Structure seed"
          onChange={(value) => setOption('structureSeed', value)}
          value={options.structureSeed}
        />
        <NumberField
          id="rw-palette-seed"
          option="paletteSeed"
          label="Palette seed"
          onChange={(value) => setOption('paletteSeed', value)}
          value={options.paletteSeed}
        />
        <NumberField
          id="rw-ink-seed"
          option="inkSeed"
          label="Ink seed"
          onChange={(value) => setOption('inkSeed', value)}
          value={options.inkSeed}
        />
      </div>
    </details>
  );
}
