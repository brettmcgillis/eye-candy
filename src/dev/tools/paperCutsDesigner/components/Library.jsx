import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';

function Library({ document }) {
  const [importValue, setImportValue] = useState('');
  const [importing, setImporting] = useState(false);
  return (
    <>
      <section className="pcd-section">
        <h2>Save design {document.dirty ? '· unsaved' : ''}</h2>
        <label className="rw-field" htmlFor="pcd-name">
          Design name
          <input
            id="pcd-name"
            value={document.name}
            onChange={(e) => document.setName(e.target.value)}
            placeholder="my-paper-layout"
          />
        </label>
        <div className="pcd-row">
          <button
            className="dev-button dev-button--primary"
            onClick={document.save}
            type="button"
          >
            Save design
          </button>
          <button className="dev-button" onClick={document.copy} type="button">
            Copy code
          </button>
          <button
            className="dev-button"
            onClick={() => setImporting((value) => !value)}
            type="button"
          >
            Import code / JSON
          </button>
        </div>
        {importing ? (
          <div className="pcd-import">
            <label className="rw-field" htmlFor="pcd-import">
              Design code or JSON
              <textarea
                id="pcd-import"
                rows={6}
                value={importValue}
                onChange={(event) => setImportValue(event.target.value)}
              />
            </label>
            <button
              className="dev-button"
              onClick={() => {
                document.importCode(importValue);
                setImporting(false);
              }}
              type="button"
            >
              Load pasted design
            </button>
          </div>
        ) : null}
        {document.name && !document.dirty ? (
          <>
            <Link
              className="dev-button"
              to={`/dev/paper-cuts?design=${encodeURIComponent(document.name)}`}
            >
              Render this design in PaperCutsCLI
            </Link>
            <code className="pcd-command">
              npm run paper-cuts:generate -- --paperDesign {document.name}
            </code>
          </>
        ) : null}
        {document.message || document.library.error ? (
          <p role="status">{document.message ?? document.library.error}</p>
        ) : null}
      </section>
      <section className="pcd-section">
        <h2>Saved designs</h2>
        {document.library.designs.length ? (
          document.library.designs.map((item) => (
            <div className="pcd-saved" key={item.name}>
              <button
                className="dev-button"
                onClick={() => document.open(item.name)}
                type="button"
              >
                {item.name} · {item.pieces} pieces
              </button>
              <button
                className="dev-button"
                aria-label={`Delete design ${item.name}`}
                onClick={() => document.remove(item.name)}
                type="button"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="rw-hint">
            Saved layouts appear here and in PaperCutsCLI.
          </p>
        )}
      </section>
      <details className="pcd-section">
        <summary>Editing help</summary>
        <p>
          Choose a layer, then place or drag pieces on the quarter-unit grid.
          Pieces on different layers may overlap; pieces on the same layer may
          not. Other layers are ghosted while editing.
        </p>
        <p>
          Wheel zooms. Pan / view, Alt-drag or middle-drag pans. Select and use
          arrow keys to move by ¼ unit, Shift-arrow for one unit, Delete to
          erase. ⌘/Ctrl-Z undoes; ⇧⌘/Ctrl-Z redoes. A drag is one undo step.
          Frame design fits only when requested.
        </p>
      </details>
    </>
  );
}
export default memo(Library);
