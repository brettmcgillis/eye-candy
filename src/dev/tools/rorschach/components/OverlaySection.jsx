import React from 'react';

import { NumberField, ToggleField } from '@dev/renderWorkbench/SchemaFields';

// Post-processing and export finishing: bloom is its own toggle row, the
// overlay burn-in gets a closure since its safe-area/viewport fields only
// matter while it's on.
export default function OverlaySection({ options, setOption }) {
  return (
    <>
      <section className="rw-toggles">
        <ToggleField
          id="rw-bloom"
          option="bloom"
          label="Bloom"
          onChange={(value) => setOption('bloom', value)}
          value={options.bloom}
        />
      </section>

      <details className="rw-control-section rw-advanced">
        <summary>Overlay</summary>
        <section className="rw-toggles">
          <ToggleField
            id="rw-overlay"
            option="overlay"
            label="Overlay"
            onChange={(value) => setOption('overlay', value)}
            value={options.overlay}
          />
        </section>

        {/* Its own grid, not inside rw-toggles: that is a no-wrap flex row of
          checkboxes, and a label-over-input field dropped into it gets
          crushed to a few characters wide. */}
        {options.overlay ? (
          <div className="rw-field-grid">
            <label className="rw-field" htmlFor="rw-ig">
              Safe area
              <select
                id="rw-ig"
                onChange={(event) => setOption('ig', event.target.value)}
                value={options.ig}
              >
                <option value="post">Post</option>
                <option value="story">Story</option>
                <option value="reel">Reel</option>
                <option value="none">None</option>
              </select>
            </label>
            <NumberField
              id="rw-viewport"
              option="viewport"
              label="Viewport"
              onChange={(value) => setOption('viewport', value)}
              value={options.viewport ?? ''}
            />
          </div>
        ) : null}
      </details>
    </>
  );
}
