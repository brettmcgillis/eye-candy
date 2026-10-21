import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const newPen = (pens) => {
  const ids = new Set(pens.map((pen) => pen.id));
  let n = pens.length + 1;
  while (ids.has(`pen-${n}`)) n += 1;
  return { color: '#444444', id: `pen-${n}`, name: `Pen ${n}`, nibMm: 0.3 };
};

export default function PensEditor({ inUse, onChange, pens }) {
  const update = (id, patch) =>
    onChange(pens.map((pen) => (pen.id === id ? { ...pen, ...patch } : pen)));

  return (
    <div className="pz-pens">
      {pens.map((pen) => (
        <div className="pz-pen" key={pen.id}>
          <input
            aria-label={`${pen.name} colour`}
            onChange={(event) => update(pen.id, { color: event.target.value })}
            type="color"
            value={pen.color}
          />
          <input
            aria-label="Pen name"
            onChange={(event) => update(pen.id, { name: event.target.value })}
            value={pen.name}
          />
          <input
            aria-label={`${pen.name} nib (mm)`}
            min="0.05"
            onChange={(event) =>
              update(pen.id, { nibMm: Number(event.target.value) || 0.05 })
            }
            step="0.05"
            title="Nib width (mm)"
            type="number"
            value={pen.nibMm}
          />
          <button
            aria-label={`Remove ${pen.name}`}
            className="dev-button"
            disabled={inUse.has(pen.id)}
            onClick={() => onChange(pens.filter((p) => p.id !== pen.id))}
            title={inUse.has(pen.id) ? 'A layer uses this pen' : 'Remove'}
            type="button"
          >
            <FiTrash2 />
          </button>
        </div>
      ))}
      <button
        className="dev-button"
        onClick={() => onChange([...pens, newPen(pens)])}
        type="button"
      >
        <FiPlus /> Add pen
      </button>
    </div>
  );
}
