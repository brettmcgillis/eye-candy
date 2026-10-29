import React, { memo } from 'react';

function Sources({ document }) {
  return (
    <section className="pcd-section">
      <h2>Start from</h2>
      <div className="pcd-row">
        <button
          className="dev-button"
          onClick={() => document.start('blank')}
          type="button"
        >
          Blank
        </button>
        {['1', '2', '3'].map((name) => (
          <button
            className="dev-button"
            key={name}
            onClick={() => document.start(name)}
            type="button"
          >
            Authored {name}
          </button>
        ))}
      </div>
      <label className="rw-field" htmlFor="pcd-seed">
        Seed
        <input
          id="pcd-seed"
          value={document.seed}
          onChange={(e) => document.setSeed(e.target.value)}
        />
      </label>
      <button
        className="dev-button"
        onClick={() => document.start('seed')}
        type="button"
      >
        Generate starting layout
      </button>
    </section>
  );
}
export default memo(Sources);
