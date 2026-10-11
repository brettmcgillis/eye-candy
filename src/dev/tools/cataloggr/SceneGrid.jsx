import React, { memo } from 'react';

import SceneCard from './SceneCard';
import { getProgress, needsByline } from './catalogData';

function SceneGrid({
  bylines,
  entries,
  label,
  onDropImage,
  onSelect,
  selectedKey,
  statuses,
  thumbnails,
  todosBySource,
}) {
  return (
    <section className="cataloggr-grid" aria-label={label}>
      {entries.map((entry) => {
        const progress = getProgress(entry, statuses);
        return (
          <SceneCard
            entry={entry}
            missingByline={needsByline(entry, bylines)}
            key={entry.key}
            onDropImage={onDropImage}
            onSelect={onSelect}
            postedCount={progress.postedCount}
            selected={entry.key === selectedKey}
            thumbnailVersion={thumbnails[entry.sourcePath]}
            todo={todosBySource.get(entry.sourcePath)}
            totalCount={progress.totalCount}
          />
        );
      })}
    </section>
  );
}

export default memo(SceneGrid);
