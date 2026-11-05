import React, { memo } from 'react';

import { DESIGN_CATALOGUE, UNITS } from '@modules/controlPanel';

import { NumberField, catalogueLabel } from './Inspector';

function Tools({
  editor,
  inside,
  brush,
  setBrush,
  tool,
  setTool,
  controlBrush,
  setControlBrush,
  placementRotation,
  setPlacementRotation,
  catalogueIndex,
  setCatalogueIndex,
  onNew,
  setTab,
}) {
  return (
    <>
      {' '}
      <section className="cpd-section">
        <h2>Panel</h2>
        <div className="cpd-fields">
          <NumberField
            label="Columns"
            value={editor.design.cols}
            min={4}
            max={40}
            step={1}
            onChange={(cols) => editor.change({ ...editor.design, cols })}
          />
          <NumberField
            label="Rows"
            value={editor.design.rows}
            min={3}
            max={30}
            step={1}
            onChange={(rows) => editor.change({ ...editor.design, rows })}
          />
        </div>
        <div className="cpd-row">
          <button
            className="dev-button"
            type="button"
            disabled={!editor.canUndo}
            onClick={editor.undo}
          >
            Undo
          </button>
          <button
            className="dev-button"
            type="button"
            disabled={!editor.canRedo}
            onClick={editor.redo}
          >
            Redo
          </button>
          <button className="dev-button" type="button" onClick={onNew}>
            New blank panel
          </button>
        </div>
      </section>
      <section className="cpd-section">
        <h2>{inside ? 'Place controls' : 'Place modules'}</h2>
        <div className="cpd-row">
          {['select', 'place', 'erase'].map((value) => (
            <button
              className={`dev-button ${tool === value ? 'dev-button--primary' : ''}`}
              type="button"
              key={value}
              aria-pressed={tool === value}
              onClick={() => {
                setTool(value);
                setTab('edit');
              }}
            >
              {value === 'select' ? 'Select / move' : value}
            </button>
          ))}
        </div>
        {inside ? (
          <label className="rw-field" htmlFor="cpd-catalogue">
            Control catalogue
            <select
              id="cpd-catalogue"
              value={catalogueIndex}
              onChange={(event) => {
                setCatalogueIndex(Number(event.target.value));
                setTool('place');
              }}
            >
              {DESIGN_CATALOGUE.map((entry, index) => (
                <option
                  key={`${entry.id}:${entry.variant}:${entry.w}:${entry.h}`}
                  value={index}
                >
                  {catalogueLabel(entry)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="cpd-fields">
            <NumberField
              label="New module width"
              value={brush.w}
              min={0.5}
              onChange={(w) => setBrush({ ...brush, w })}
            />
            <NumberField
              label="New module height"
              value={brush.h}
              min={0.5}
              max={30}
              onChange={(h) => setBrush({ ...brush, h })}
            />
          </div>
        )}
        {inside ? (
          <div className="cpd-fields">
            {['w', 'h'].map((key) => (
              <NumberField
                key={key}
                label={key === 'w' ? 'Control width' : 'Control height'}
                value={controlBrush[key]}
                min={0.5}
                onChange={(value) =>
                  setControlBrush((current) =>
                    UNITS[DESIGN_CATALOGUE[catalogueIndex].id]
                      ? { w: value, h: value }
                      : { ...current, [key]: value }
                  )
                }
              />
            ))}
          </div>
        ) : null}
        {inside ? (
          <label className="rw-field" htmlFor="cpd-placement-rotation">
            Placement rotation
            <select
              id="cpd-placement-rotation"
              value={placementRotation}
              onChange={(event) =>
                setPlacementRotation(Number(event.target.value))
              }
            >
              {[0, 90, 180, 270].map((angle) => (
                <option key={angle} value={angle}>
                  {angle}° clockwise
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="rw-hint">
          {inside
            ? 'Catalogue sizes are starting sizes. Set any size the control supports, then click its seat inside this module. A 4×2 patch bay can be 4×4, for example.'
            : 'Place a plate, then choose Edit controls in module. Each plate can hold several individually placed controls.'}
        </p>
      </section>
    </>
  );
}
export default memo(Tools);
