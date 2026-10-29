import React, { memo } from 'react';

import { SIZES } from '@modules/paperCuts';

const TOOLS = [
  ['paint', 'Place'],
  ['select', 'Select'],
  ['move', 'Move'],
  ['duplicate', 'Duplicate'],
  ['erase', 'Erase'],
  ['view', 'Pan / view'],
];
function Tools({
  design,
  tool,
  setTool,
  brush,
  setBrush,
  isolate,
  setIsolate,
  history,
  edit,
  setFrameRevision,
}) {
  return (
    <section className="pcd-section">
      <h2>Tools</h2>
      <div className="pcd-tools">
        {TOOLS.map(([value, label]) => (
          <button
            aria-pressed={tool === value}
            className="dev-button"
            key={value}
            type="button"
            onClick={() => setTool(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="rw-field" htmlFor="pcd-brush">
        Placement size
        <select
          id="pcd-brush"
          value={brush}
          onChange={(e) => setBrush(Number(e.target.value))}
        >
          {SIZES.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </label>
      <label className="pcd-check" htmlFor="pcd-rotate">
        <input
          type="checkbox"
          id="pcd-rotate"
          checked={design.rotate}
          onChange={(e) => edit({ ...design, rotate: e.target.checked })}
        />
        Rotate composition 45°
      </label>
      <label className="pcd-check" htmlFor="pcd-isolate">
        <input
          type="checkbox"
          id="pcd-isolate"
          checked={isolate}
          onChange={(e) => setIsolate(e.target.checked)}
        />
        Isolate active layer
      </label>
      <div className="pcd-row">
        <button
          className="dev-button"
          disabled={!history.canUndo}
          onClick={history.undo}
          type="button"
        >
          Undo
        </button>
        <button
          className="dev-button"
          disabled={!history.canRedo}
          onClick={history.redo}
          type="button"
        >
          Redo
        </button>
        <button
          className="dev-button"
          onClick={() => setFrameRevision((n) => n + 1)}
          type="button"
        >
          Frame design
        </button>
      </div>
    </section>
  );
}
export default memo(Tools);
