import React from 'react';

import { NumberField, ToggleField } from '@dev/renderWorkbench/SchemaFields';

// Camera framing, flatten, stroke/simplify and bloom — the render knobs
// shared by every mode, gathered under one closure.
export default function CompositionSection({ kind, options, setOption }) {
  return (
    <details className="rw-control-section rw-advanced">
      <summary>Composition</summary>
      <div className="rw-field-grid">
        <NumberField
          id="rw-distance"
          option="distance"
          label="Distance"
          onChange={(value) => setOption('distance', value)}
          value={options.distance}
        />
        <NumberField
          id="rw-fov"
          option="fov"
          label="FOV"
          onChange={(value) => setOption('fov', value)}
          value={options.fov}
        />
        {kind === 'still' || options.mode !== 'cinematic' ? (
          <>
            <ToggleField
              id="rw-flatten-enabled"
              option="flattenEnabled"
              label="Flatten (2D)"
              onChange={(value) => setOption('flattenEnabled', value)}
              value={options.flattenEnabled}
            />
            <NumberField
              id="rw-flatten"
              option="flatten"
              label="Flatten amount"
              onChange={(value) => setOption('flatten', value)}
              value={options.flatten}
            />
          </>
        ) : null}
        <NumberField
          id="rw-stroke"
          option="stroke"
          label="Stroke"
          onChange={(value) => setOption('stroke', value)}
          value={options.stroke}
        />
        <NumberField
          id="rw-simplify"
          option="simplify"
          label="Simplify"
          onChange={(value) => setOption('simplify', value)}
          value={options.simplify}
        />
        <label className="rw-field" htmlFor="rw-flatten-axis">
          Flatten axis
          <select
            id="rw-flatten-axis"
            onChange={(event) => setOption('flattenAxis', event.target.value)}
            value={options.flattenAxis}
          >
            <option value="z">Z</option>
            <option value="y">Y</option>
          </select>
        </label>
        {options.bloom ? (
          <>
            <NumberField
              id="rw-bloom-strength"
              option="bloomStrength"
              label="Bloom strength"
              onChange={(value) => setOption('bloomStrength', value)}
              value={options.bloomStrength}
            />
            <NumberField
              id="rw-bloom-radius"
              option="bloomRadius"
              label="Bloom radius"
              onChange={(value) => setOption('bloomRadius', value)}
              value={options.bloomRadius}
            />
            <NumberField
              id="rw-bloom-threshold"
              option="bloomThreshold"
              label="Bloom threshold"
              onChange={(value) => setOption('bloomThreshold', value)}
              value={options.bloomThreshold}
            />
          </>
        ) : null}
      </div>
    </details>
  );
}
