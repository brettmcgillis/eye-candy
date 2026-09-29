import React, { useState } from 'react';
import { FiBox, FiExternalLink, FiRefreshCw } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';

import { resolveLegacyScenePath } from '@app/sceneRegistry';

function Swatches({ palette = [] }) {
  return (
    <div className="sd-swatches">
      {palette.map((color, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index} style={{ background: color }} title={color} />
      ))}
    </div>
  );
}

function SavePreset({ metadata }) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (saved) {
    const scene = resolveLegacyScenePath('subdivision') ?? '/wip/subdivision';
    return (
      <a
        className="dev-button"
        href={`${scene}?preset=${encodeURIComponent(saved.name)}`}
        rel="noreferrer"
        target="_blank"
      >
        <FiExternalLink /> Open “{saved.name}” in the scene
      </a>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = await postJson('/dev-api/subdivision/presets', {
        name,
        sidecar: metadata,
      });
      setSaved(body.preset);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sd-save-preset">
      <input
        aria-label="Preset name"
        onChange={(event) => setName(event.target.value)}
        placeholder={`Seed ${metadata.preset.seed}`}
        type="text"
        value={name}
      />
      <button
        className="dev-button"
        disabled={saving}
        onClick={save}
        type="button"
      >
        <FiBox /> {saving ? 'Saving...' : 'Save as scene preset'}
      </button>
      {error ? <p className="rw-preview__actions-error">{error}</p> : null}
    </div>
  );
}

export default function PreviewDetails({
  closePreview,
  metadata,
  onUseAsBase,
}) {
  const { render = {}, stats = {} } = metadata;
  const config = metadata.preset;

  return (
    <>
      <div className="rw-preview__actions">
        {config ? (
          <button
            className="dev-button"
            onClick={() => {
              onUseAsBase(config, render);
              closePreview();
            }}
            type="button"
          >
            <FiRefreshCw /> Roll variations
          </button>
        ) : null}
        {config ? <SavePreset metadata={metadata} /> : null}
      </div>
      {config ? (
        <>
          <h2>Stats</h2>
          <dl>
            <Stat label="Seed" value={config.seed} />
            <Stat
              label="Structure"
              value={`${config.lattice} · ${config.driver} · ${config.levels} levels`}
            />
            <Stat label="Field" value={config.field} />
            <Stat
              label="Colour"
              value={`${config.palette} by ${config.colorMode}`}
            />
            {stats.leaves ? <Stat label="Cells" value={stats.leaves} /> : null}
          </dl>
          <Swatches palette={stats.palette} />
        </>
      ) : null}
    </>
  );
}
