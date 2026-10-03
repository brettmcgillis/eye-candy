import React from 'react';
import { FiSliders } from 'react-icons/fi';

import { Stat, formatDimensions } from '@dev/renderWorkbench/AssetGallery';

import { techniqueById } from '../techniques';

export default function PreviewDetails({ closePreview, metadata, onLoad }) {
  const options = metadata.preset ?? metadata.presets;
  const technique = metadata.technique
    ? techniqueById(metadata.technique)
    : null;
  const { video = {} } = metadata;

  return (
    <>
      <div className="rw-preview__actions">
        {technique && options ? (
          <button
            className="dev-button"
            onClick={() => {
              onLoad(technique.id, options);
              closePreview();
            }}
            type="button"
          >
            <FiSliders /> Load these settings
          </button>
        ) : null}
      </div>
      <h2>Recipe</h2>
      <dl>
        <Stat
          label="Technique"
          value={technique?.label ?? metadata.technique}
        />
        <Stat label="Source" value={metadata.source?.label} />
        <Stat
          label="Output"
          value={formatDimensions(video.width, video.height)}
        />
        <Stat label="Frames" value={metadata.render?.frames} />
        <Stat label="FPS" value={metadata.render?.fps} />
      </dl>
    </>
  );
}
