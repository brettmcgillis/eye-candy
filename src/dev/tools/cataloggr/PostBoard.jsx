import React, { memo, useMemo } from 'react';

import SceneGrid from './SceneGrid';
import { getSceneTargets, getStatusKey, toCatalogDevTool } from './catalogData';

function getPostedCount(entry, statuses) {
  return getSceneTargets(entry).filter((presetName) =>
    Boolean(statuses[entry.statusKey ?? getStatusKey(entry.key, presetName)])
  ).length;
}

function sortPostEntries(entries, statuses, sortKey, sortDirection) {
  const direction = sortDirection === 'asc' ? 1 : -1;

  return [...entries].sort((left, right) => {
    const nameComparison = left.label.localeCompare(right.label, undefined, {
      sensitivity: 'base',
    });

    if (sortKey === 'name') return direction * nameComparison;

    const leftPosted = getPostedCount(left, statuses);
    const rightPosted = getPostedCount(right, statuses);
    const leftValue =
      sortKey === 'posted'
        ? leftPosted
        : getSceneTargets(left).length - leftPosted;
    const rightValue =
      sortKey === 'posted'
        ? rightPosted
        : getSceneTargets(right).length - rightPosted;
    const valueComparison = direction * (leftValue - rightValue);

    if (valueComparison) return valueComparison;

    return nameComparison;
  });
}

function PostSection({ children, count, title }) {
  return (
    <section className="cataloggr-post-section">
      <header>
        <h2>{title}</h2>
        <span>{count}</span>
      </header>
      {count ? children : <p className="cataloggr-post-empty">Nothing here.</p>}
    </section>
  );
}

function PostBoard({
  demoScenes,
  devTools,
  onDropImage,
  onSelect,
  selectedKey,
  showcaseScenes,
  sortDirection,
  sortKey,
  statuses,
  thumbnails,
  todosBySource,
}) {
  const sections = useMemo(
    () =>
      [
        ['Showcase scenes', showcaseScenes],
        ['Toolbox / Test Lab demos', demoScenes],
        ['Dev tools', devTools.map(toCatalogDevTool)],
      ].map(([title, entries]) => [
        title,
        sortPostEntries(entries, statuses, sortKey, sortDirection),
      ]),
    [demoScenes, devTools, showcaseScenes, sortDirection, sortKey, statuses]
  );

  return (
    <div className="cataloggr-post-board">
      {sections.map(([title, entries]) => (
        <PostSection count={entries.length} key={title} title={title}>
          <SceneGrid
            entries={entries}
            label={title}
            onDropImage={onDropImage}
            onSelect={onSelect}
            selectedKey={selectedKey}
            statuses={statuses}
            thumbnails={thumbnails}
            todosBySource={todosBySource}
          />
        </PostSection>
      ))}
    </div>
  );
}

export default memo(PostBoard);
