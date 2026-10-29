import React, { memo } from 'react';

import { PALETTE_NAMES } from '@utils/paletteRegistry';

function Colors({ config, onChange }) {
  const update = (key, value) =>
    onChange((previous) => ({ ...previous, [key]: value }));
  return (
    <details className="pcd-section">
      <summary>Preview colors and paper</summary>
      <label className="rw-field" htmlFor="pcd-palette">
        Palette
        <select
          id="pcd-palette"
          value={config.paletteName}
          onChange={(e) => update('paletteName', e.target.value)}
        >
          {['None', ...PALETTE_NAMES].map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      {['paletteExact', 'paletteReverse'].map((key) => (
        <label className="pcd-check" key={key} htmlFor={`pcd-${key}`}>
          <input
            id={`pcd-${key}`}
            type="checkbox"
            checked={config[key]}
            onChange={(e) => update(key, e.target.checked)}
          />
          {key === 'paletteExact' ? 'Exact palette colors' : 'Reverse palette'}
        </label>
      ))}
      <div className="rw-field-grid">
        {[
          ['colorRangeStart', 'Manual front'],
          ['colorRangeEnd', 'Manual back'],
          ['backgroundColor', 'Background'],
        ].map(([key, label]) => (
          <label className="rw-field" key={key} htmlFor={`pcd-${key}`}>
            {label}
            <input
              id={`pcd-${key}`}
              type="color"
              value={config[key]}
              onChange={(e) => update(key, e.target.value)}
            />
          </label>
        ))}
        {['paperDepth', 'layerGap'].map((key) => (
          <label className="rw-field" key={key} htmlFor={`pcd-${key}`}>
            {key === 'paperDepth' ? 'Thickness' : 'Layer gap'}
            <input
              id={`pcd-${key}`}
              type="number"
              min={key === 'paperDepth' ? 0.02 : 0}
              max={0.3}
              step={0.005}
              value={config[key]}
              onChange={(e) =>
                update(
                  key,
                  Math.max(
                    key === 'paperDepth' ? 0.02 : 0,
                    Math.min(0.3, Number(e.target.value))
                  )
                )
              }
            />
          </label>
        ))}
      </div>
      <p className="rw-hint">
        Colors and paper finish are preview settings. Saved designs hold the
        layout and rotation; the render bench can roll their look.
      </p>
    </details>
  );
}
export default memo(Colors);
