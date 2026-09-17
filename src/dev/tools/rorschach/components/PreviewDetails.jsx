import React, { useState } from 'react';
import { FiBox, FiExternalLink, FiRefreshCw } from 'react-icons/fi';

import { Stat, formatDimensions } from '@dev/renderWorkbench/AssetGallery';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';

import { resolveLegacyScenePath } from '@app/sceneRegistry';
import { presetFromRender } from '@modules/rorschach';

const VIEW_NAMES = ['front', 'back', 'top', 'bottom'];

// A still names the view it was drawn from in its own filename; a video carries
// it in the sidecar. The scene is framed from it, so guessing wrong points the
// camera at the back of the picture.
function viewOf(group, metadata) {
  const name = group.key.split('/').pop();
  if (VIEW_NAMES.includes(name)) return name;
  return VIEW_NAMES.includes(metadata?.render?.view)
    ? metadata.render.view
    : 'front';
}

// The two things worth doing with a piece you like: make more of it, or see it
// in three dimensions. Both start from the sidecar — the exact config that drew
// the picture.
function PreviewActions({ group, metadata, onUseAsBase }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);

  const preset = metadata?.preset;
  if (!preset) return null;

  const saveScenePreset = async () => {
    setError(null);
    setSaving(true);
    try {
      const body = await postJson('/dev-api/rorschach/presets', {
        preset: presetFromRender(
          { preset, render: metadata.render, view: viewOf(group, metadata) },
          'still'
        ),
      });
      setSaved(body.preset);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rw-preview__actions">
      <button
        className="dev-button"
        onClick={() => onUseAsBase(metadata, group.name)}
        type="button"
      >
        <FiRefreshCw /> Roll variations
      </button>
      {saved ? (
        <a
          className="dev-button"
          href={`${resolveLegacyScenePath('rorschach') ?? '/wip/rorschach'}?preset=${saved.name}`}
          rel="noreferrer"
          target="_blank"
        >
          <FiExternalLink /> Open preset {saved.name} in the scene
        </a>
      ) : (
        <button
          className="dev-button"
          disabled={saving}
          onClick={saveScenePreset}
          type="button"
        >
          <FiBox /> {saving ? 'Saving...' : 'Save as scene preset'}
        </button>
      )}
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
  const { preset = {}, render = {} } = metadata;
  return (
    <>
      <PreviewActions
        group={group}
        metadata={metadata}
        onUseAsBase={(meta, name) => {
          onUseAsBase(meta, name);
          closePreview();
        }}
      />
      <h2>Stats</h2>
      <dl>
        <Stat label="Seed" value={preset.seed} />
        <Stat label="Bundles" value={preset.bundleCount} />
        <Stat label="Strands" value={preset.strandsPerBundle} />
        <Stat label="Steps" value={preset.steps} />
        <Stat label="Shape" value={preset.framingShape} />
        <Stat
          label="Bounds"
          value={formatDimensions(preset.boundWidth, preset.boundHeight)}
        />
        <Stat label="Spread" value={preset.startSpread} />
        <Stat label="Frequency" value={preset.freq} />
        <Stat
          label="Palette"
          value={preset.monochrome ? 'Monochrome' : preset.palette}
        />
        <Stat label="Ink" value={preset.inkColor} />
        <Stat label="Background" value={preset.backgroundColor} />
        <Stat
          label="Output"
          value={formatDimensions(render.width, render.height)}
        />
        <Stat label="Renderer" value={render.renderer} />
        <Stat label="Distance" value={render.distance} />
        <Stat label="FOV" value={render.fov} />
        <Stat
          label="Bloom"
          value={render.bloom ? render.bloomStrength : 'Off'}
        />
      </dl>
    </>
  );
}
