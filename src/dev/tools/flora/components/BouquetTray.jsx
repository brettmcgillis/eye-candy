import React from 'react';
import { FiX } from 'react-icons/fi';

import { SchemaField } from '@dev/renderWorkbench/SchemaFields';

const KEYS = [
  'bouquetSize',
  'bouquetFill',
  'bouquetSpread',
  'bouquetTie',
  'bouquetJitter',
];

// Generations picked for binding. Each entry is a sidecar URL the server reads;
// a bouquet's own sidecar brings all of its flowers.
export default function BouquetTray({
  entries,
  onClear,
  onRemove,
  options,
  setOption,
}) {
  return (
    <section className="rw-control-section fw-bouquet">
      <h2>Bouquet</h2>
      {entries.length === 0 ? (
        <p className="rw-hint">
          Add generations from a preview or a selection to bind them together.
          With none, Stems above 0 rolls every flower.
        </p>
      ) : (
        <ul className="fw-bouquet__list">
          {entries.map((entry) => (
            <li key={entry.url}>
              {entry.thumb ? <img alt="" src={entry.thumb} /> : null}
              <span>{entry.name}</span>
              <button
                aria-label={`Remove ${entry.name}`}
                className="rw-base__clear"
                onClick={() => onRemove(entry.url)}
                type="button"
              >
                <FiX />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="rw-field-grid">
        {KEYS.map((key) => (
          <SchemaField
            key={key}
            onChange={(value) => setOption(key, value)}
            option={key}
            value={options[key]}
          />
        ))}
      </div>
      {entries.length > 0 ? (
        <button className="rw-pin-group" onClick={onClear} type="button">
          Clear bouquet
        </button>
      ) : null}
    </section>
  );
}
