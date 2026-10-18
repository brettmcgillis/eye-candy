import React, { useState } from 'react';
import { FiBox, FiExternalLink, FiRefreshCw } from 'react-icons/fi';

import { resolveLegacyScenePath } from '@app/sceneRegistry';

import { Stat, formatDimensions } from './AssetGallery';
import { postJson } from './useRenderJobs';

// Writes the generation into the scene's PRESETS through the tool's
// /presets route, then links to the scene with it selected.
function SavePreset({ metadata, placeholder, scene, tool }) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (saved) {
    const id = typeof scene === 'function' ? scene(saved) : scene;
    const path = resolveLegacyScenePath(id) ?? `/wip/${id}`;
    return (
      <a
        className="dev-button"
        href={`${path}?preset=${encodeURIComponent(saved.name)}`}
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
      const body = await postJson(`/dev-api/${tool}/presets`, {
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
    <div className="rw-save-preset">
      <input
        aria-label="Preset name"
        onChange={(event) => setName(event.target.value)}
        placeholder={placeholder}
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

// A generation's preview panel: roll variations from it, save it as a scene
// preset, and the tool's `stats(config, metadata)` (`after` follows the list).
export default function RollPreviewDetails({
  after,
  closePreview,
  group,
  metadata,
  onUseAsBase,
  placeholder,
  scene,
  showMode = true,
  stats,
  tool,
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
        {metadata.preset && scene ? (
          <SavePreset
            metadata={metadata}
            placeholder={placeholder?.(metadata)}
            scene={scene}
            tool={tool}
          />
        ) : null}
      </div>
      <h2>Stats</h2>
      <dl>
        {config ? stats(config, metadata) : null}
        <Stat
          label="Output"
          value={formatDimensions(render.width, render.height)}
        />
        {showMode ? <Stat label="Mode" value={render.mode} /> : null}
      </dl>
      {config && after ? after(config, metadata) : null}
    </>
  );
}
