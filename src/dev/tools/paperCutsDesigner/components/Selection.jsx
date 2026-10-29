import React, { memo, useState } from 'react';

import { SIZES, editPieces, removePieces, snap } from '@modules/paperCuts';

function Selection({ design, selected, onChange, onSelect }) {
  const [error, setError] = useState(null);
  const piece = design.pieces.find((p) => p.id === selected[0]);
  if (!piece)
    return (
      <p className="rw-hint">
        Select a piece on the active layer to edit its coordinates, size or
        depth.
      </p>
    );
  const patch = (key, value) => {
    const next = editPieces(design, selected, () => ({ [key]: value }));
    if (next) {
      onChange(next);
      setError(null);
    } else
      setError(
        'That edit overlaps another piece on the same layer or leaves the editable grid.'
      );
  };
  const duplicate = () => {
    const next = editPieces(
      design,
      selected,
      (p) => ({ x: snap(p.x + p.size + 0.25) }),
      { duplicate: true }
    );
    if (next) {
      onChange(next);
      onSelect(
        next.pieces
          .filter((p) => !design.pieces.some((q) => q.id === p.id))
          .map((p) => p.id)
      );
      setError(null);
    } else
      setError(
        'No room beside this piece. Use the Duplicate tool to drag a copy elsewhere.'
      );
  };
  return (
    <section className="pcd-section">
      <h2>Selected piece</h2>
      <div className="rw-field-grid">
        {['x', 'y'].map((key) => (
          <label className="rw-field" htmlFor={`pcd-${key}`} key={key}>
            {key.toUpperCase()}
            <input
              id={`pcd-${key}`}
              type="number"
              min={-64}
              max={64}
              step={0.25}
              value={piece[key]}
              onChange={(e) => patch(key, snap(Number(e.target.value)))}
            />
          </label>
        ))}
        <label className="rw-field" htmlFor="pcd-piece-size">
          Piece size
          <select
            id="pcd-piece-size"
            value={piece.size}
            onChange={(e) => patch('size', Number(e.target.value))}
          >
            {SIZES.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <label className="rw-field" htmlFor="pcd-piece-layer">
          Piece layer
          <select
            id="pcd-piece-layer"
            value={piece.layer}
            onChange={(e) => patch('layer', Number(e.target.value))}
          >
            {Array.from({ length: design.layerCount }, (_, i) => (
              <option key={i} value={i}>
                Layer {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pcd-row">
        <button className="dev-button" onClick={duplicate} type="button">
          Duplicate piece
        </button>
        <button
          className="dev-button"
          onClick={() => {
            onChange(removePieces(design, selected));
            onSelect([]);
          }}
          type="button"
        >
          Delete piece
        </button>
      </div>
      {error ? <p role="status">{error}</p> : null}
    </section>
  );
}
export default memo(Selection);
