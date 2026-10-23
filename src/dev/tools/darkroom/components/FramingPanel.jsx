import React, { useMemo } from 'react';
import { FiMove, FiRotateCcw, FiZoomIn } from 'react-icons/fi';

import {
  SchemaField,
  SchemaProvider,
  Segmented,
} from '@dev/renderWorkbench/SchemaFields';

import { FRAMING_SPECS } from '../sources/framing';

const NO_PINS = new Set();
const MODES = [
  { icon: <FiZoomIn />, label: 'Inspect', value: 'inspect' },
  { icon: <FiMove />, label: 'Compose', value: 'compose' },
];

export default function FramingPanel({
  mode,
  onChange,
  onMode,
  onReset,
  values,
}) {
  const context = useMemo(
    () => ({ pins: NO_PINS, specs: FRAMING_SPECS, toggle: () => {} }),
    []
  );

  return (
    <SchemaProvider value={context}>
      <section className="rw-control-section">
        <h2>Framing</h2>
        <Segmented
          label="Stage gestures"
          onChange={onMode}
          options={MODES}
          value={mode}
        />
        <p className="rw-hint">
          Compose: drag to move the picture, scroll or pinch to zoom it.
          Double-click resets.
        </p>
        <div className="rw-field-grid">
          {Object.keys(FRAMING_SPECS).map((key) => (
            <SchemaField
              key={key}
              onChange={(value) => onChange(key, value)}
              option={key}
              value={values[key]}
            />
          ))}
        </div>
        <button className="dev-button" onClick={onReset} type="button">
          <FiRotateCcw /> Reset framing
        </button>
      </section>
    </SchemaProvider>
  );
}
