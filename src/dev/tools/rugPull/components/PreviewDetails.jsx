import React, { useState } from 'react';
import { FiBox, FiExternalLink, FiRefreshCw } from 'react-icons/fi';

import { Stat, formatDimensions } from '@dev/renderWorkbench/AssetGallery';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';

import { resolveLegacyScenePath } from '@app/sceneRegistry';

function SavePreset({ metadata }) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (saved) {
    const scene = resolveLegacyScenePath('rugPull') ?? '/wip/rugPull';
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
      const body = await postJson('/dev-api/rugPull/presets', {
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
    <div className="rp-save-preset">
      <input
        aria-label="Preset name"
        onChange={(event) => setName(event.target.value)}
        placeholder={metadata.name ?? `Rug ${metadata.preset.rugSeed}`}
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
  group,
  metadata,
  onUseAsBase,
}) {
  const { render = {} } = metadata;
  const config = metadata.preset ?? metadata.presets?.[0];

  return (
    <>
      <div className="rw-preview__actions">
        {config ? (
          <button
            className="dev-button"
            onClick={() => {
              onUseAsBase(config, render, group.name);
              closePreview();
            }}
            type="button"
          >
            <FiRefreshCw /> Roll variations
          </button>
        ) : null}
        {metadata.preset ? <SavePreset metadata={metadata} /> : null}
      </div>
      <h2>Stats</h2>
      <dl>
        {config ? (
          <>
            <Stat label="Design" value={config.design} />
            <Stat label="Palette" value={config.palette} />
            <Stat label="Seed" value={config.rugSeed} />
            {metadata.weave ? (
              <>
                <Stat
                  label="Knots"
                  value={`${metadata.weave.cols} × ${metadata.weave.rows}`}
                />
                <Stat label="Bands" value={metadata.weave.bands.join(', ')} />
                <Stat
                  label="House motifs"
                  value={metadata.weave.house ? 'woven in' : 'none'}
                />
              </>
            ) : null}
          </>
        ) : null}
        <Stat
          label="Output"
          value={formatDimensions(render.width, render.height)}
        />
        <Stat label="Views" value={render.views} />
      </dl>
    </>
  );
}
