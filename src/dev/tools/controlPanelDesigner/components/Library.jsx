import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';

import { resolveLegacyScenePath } from '@app/sceneRegistry';

function Library({ document }) {
  const [value, setValue] = useState('');
  const [importing, setImporting] = useState(false);
  return (
    <section className="cpd-section">
      <h2>Design library {document.dirty ? '· unsaved' : ''}</h2>
      <label className="rw-field" htmlFor="cpd-name">
        Name
        <input
          id="cpd-name"
          value={document.name}
          onChange={(e) => document.setName(e.target.value)}
          placeholder="my-control-panel"
        />
      </label>
      <div className="cpd-row">
        <button
          className="dev-button dev-button--primary"
          type="button"
          disabled={document.busy}
          onClick={document.save}
        >
          Save design
        </button>
        <button className="dev-button" type="button" onClick={document.copy}>
          Copy code
        </button>
        <button
          className="dev-button"
          type="button"
          onClick={document.download}
        >
          Download JSON
        </button>
        <button
          className="dev-button"
          type="button"
          onClick={() => setImporting(!importing)}
        >
          Import code / JSON
        </button>
      </div>
      {importing ? (
        <>
          <label className="rw-field" htmlFor="cpd-import">
            Code or JSON
            <textarea
              id="cpd-import"
              rows={5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <button
            className="dev-button"
            type="button"
            onClick={() => document.importValue(value)}
          >
            Load pasted design
          </button>
        </>
      ) : null}
      <Link
        className="dev-button"
        to={`/dev/control-panel?code=${encodeURIComponent(document.code)}`}
      >
        Render in ControlPanelCLI
      </Link>
      <Link
        className="dev-button"
        to={`${resolveLegacyScenePath('controlPanel')}?panelDesign=${encodeURIComponent(document.code)}`}
      >
        Open in scene
      </Link>
      {document.library.error ? (
        <p role="status">{document.library.error}</p>
      ) : null}
      <label className="rw-field" htmlFor="cpd-saved">
        Open saved design
        <select
          id="cpd-saved"
          value=""
          onChange={(e) => {
            if (e.target.value) document.open(e.target.value);
          }}
        >
          <option value="">Choose a design…</option>
          {document.library.designs.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {entry.name} · {entry.modules} modules · {entry.controls} controls
            </option>
          ))}
        </select>
      </label>
      {!document.dirty && document.name ? (
        <code className="cpd-command">
          npm run control-panel:generate -- --panelDesign {document.name} --svg
        </code>
      ) : null}
    </section>
  );
}
export default memo(Library);
