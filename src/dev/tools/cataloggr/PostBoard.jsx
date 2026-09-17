import React, { memo, useMemo } from 'react';

import SceneRow from './SceneRow';
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

    if (sortKey !== 'name') {
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
    }

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
  disabled,
  onManageTodo,
  onToggle,
  sortDirection,
  sortKey,
  showcaseScenes,
  statuses,
}) {
  const sortedShowcaseScenes = useMemo(
    () => sortPostEntries(showcaseScenes, statuses, sortKey, sortDirection),
    [showcaseScenes, sortDirection, sortKey, statuses]
  );
  const sortedDemoScenes = useMemo(
    () => sortPostEntries(demoScenes, statuses, sortKey, sortDirection),
    [demoScenes, sortDirection, sortKey, statuses]
  );
  const sortedDevTools = useMemo(
    () =>
      sortPostEntries(
        devTools.map(toCatalogDevTool),
        statuses,
        sortKey,
        sortDirection
      ),
    [devTools, sortDirection, sortKey, statuses]
  );

  return (
    <div className="cataloggr-post-board">
      <PostSection count={sortedShowcaseScenes.length} title="Showcase scenes">
        <div className="cataloggr-list">
          {sortedShowcaseScenes.map((scene) => (
            <SceneRow
              disabled={disabled}
              key={scene.key}
              onManageTodo={onManageTodo}
              onToggle={onToggle}
              scene={scene}
              statuses={statuses}
            />
          ))}
        </div>
      </PostSection>

      <PostSection
        count={sortedDemoScenes.length}
        title="Toolbox / Test Lab demos"
      >
        <div className="cataloggr-list">
          {sortedDemoScenes.map((scene) => (
            <SceneRow
              disabled={disabled}
              key={scene.key}
              onManageTodo={onManageTodo}
              onToggle={onToggle}
              scene={scene}
              statuses={statuses}
            />
          ))}
        </div>
      </PostSection>

      <PostSection count={sortedDevTools.length} title="Dev tools">
        <div className="cataloggr-list">
          {sortedDevTools.map((tool) => (
            <SceneRow
              disabled={disabled}
              key={tool.slug}
              onManageTodo={onManageTodo}
              onToggle={onToggle}
              scene={tool}
              statuses={statuses}
            />
          ))}
        </div>
      </PostSection>
    </div>
  );
}

export default memo(PostBoard);
