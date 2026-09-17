import React, { useState } from 'react';
import {
  FiBox,
  FiExternalLink,
  FiPlusCircle,
  FiRefreshCw,
} from 'react-icons/fi';

import { Stat, formatDimensions } from '@dev/renderWorkbench/AssetGallery';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';

import { resolveLegacyScenePath } from '@app/sceneRegistry';

function Swatches({ config }) {
  const colors = [
    'stemColor',
    'budColor',
    'crownColor',
    'accentColor',
    'tipColor',
    'ornamentColor',
  ].map((key) => config[key]);
  return (
    <div className="fw-swatches">
      {colors.map((color, index) => (
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
    const scene = resolveLegacyScenePath('flora') ?? '/wip/flora';
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
      const body = await postJson('/dev-api/flora/presets', {
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
    <div className="fw-save-preset">
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
  group,
  metadata,
  onAddToBouquet,
  onUseAsBase,
}) {
  const { bouquet, render = {} } = metadata;
  const config = metadata.preset ?? metadata.presets?.[0];
  const thumb = group.assets[0]?.url;

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
        {metadata.preset || bouquet ? (
          <button
            className="dev-button"
            onClick={() =>
              onAddToBouquet([
                { name: group.name, thumb, url: group.metadataAsset.url },
              ])
            }
            type="button"
          >
            <FiPlusCircle /> Add to bouquet
          </button>
        ) : null}
        {metadata.preset ? <SavePreset metadata={metadata} /> : null}
      </div>
      <h2>Stats</h2>
      <dl>
        {bouquet ? (
          <>
            <Stat label="Bouquet" value={bouquet.seed} />
            <Stat label="Stems" value={bouquet.flowers.length} />
            <Stat
              label="Flowers"
              value={bouquet.flowers.map((flower) => flower.seed).join(', ')}
            />
          </>
        ) : null}
        {config ? (
          <>
            <Stat label="Seed" value={config.seed} />
            <Stat label="Tips" value={config.tips} />
            <Stat label="Forms" value={config.formCount} />
            <Stat label="Palette" value={config.paletteName} />
          </>
        ) : null}
        <Stat
          label="Output"
          value={formatDimensions(render.width, render.height)}
        />
        <Stat label="Framing" value={render.framing} />
        <Stat label="Mode" value={render.mode} />
      </dl>
      {config ? <Swatches config={config} /> : null}
    </>
  );
}
