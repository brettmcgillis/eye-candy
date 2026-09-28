import React, { memo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckSquare,
  FiImage,
  FiTool,
} from 'react-icons/fi';

import { getImageFile, getThumbnailUrl } from './thumbnailApi';

export function SceneThumbnail({ entry, thumbnailVersion }) {
  const Icon = entry.icon ?? (entry.area === 'toolbox' ? FiTool : FiImage);

  if (thumbnailVersion) {
    return (
      <img
        alt=""
        className="cataloggr-thumb__image"
        decoding="async"
        loading="lazy"
        src={getThumbnailUrl(entry.sourcePath, thumbnailVersion)}
      />
    );
  }

  return (
    <span className="cataloggr-thumb__placeholder">
      <Icon aria-hidden="true" />
    </span>
  );
}

function SceneCard({
  entry,
  onDropImage,
  onSelect,
  postedCount,
  selected,
  thumbnailVersion,
  todo,
  totalCount,
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <button
      aria-pressed={selected}
      className={`cataloggr-card cataloggr-card--${entry.area}`}
      data-dragging={dragging || undefined}
      onClick={() => onSelect(entry.key)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => {
        if (![...event.dataTransfer.types].includes('Files')) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = getImageFile(event.dataTransfer);
        if (file) onDropImage(entry.sourcePath, file);
      }}
      title={entry.sourcePath}
      type="button"
    >
      <span className="cataloggr-thumb">
        <SceneThumbnail entry={entry} thumbnailVersion={thumbnailVersion} />
        <span className="cataloggr-card__area">{entry.areaLabel}</span>
      </span>
      <span className="cataloggr-card__body">
        <strong>{entry.label}</strong>
        <span className="cataloggr-card__meta">
          <span>{entry.channelLabel}</span>
          {todo?.issues.length ? (
            <FiAlertTriangle aria-label="TODO format issues" />
          ) : null}
          {todo?.openCount ? (
            <span className="cataloggr-card__chip" title="Open TODO items">
              <FiCheckSquare aria-hidden="true" />
              {todo.openCount}
            </span>
          ) : null}
          {totalCount ? (
            <span
              className="cataloggr-card__chip"
              data-complete={postedCount === totalCount}
              title="Scene + presets posted"
            >
              {postedCount}/{totalCount}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export default memo(SceneCard);
