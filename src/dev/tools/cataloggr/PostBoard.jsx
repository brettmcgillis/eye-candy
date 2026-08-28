import React, { memo } from 'react';

import SceneRow from './SceneRow';
import { toCatalogDevTool } from './catalogData';

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
  showcaseScenes,
  statuses,
}) {
  return (
    <div className="cataloggr-post-board">
      <PostSection count={showcaseScenes.length} title="Showcase scenes">
        <div className="cataloggr-list">
          {showcaseScenes.map((scene) => (
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

      <PostSection count={demoScenes.length} title="Toolbox / Test Lab demos">
        <div className="cataloggr-list">
          {demoScenes.map((scene) => (
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

      <PostSection count={devTools.length} title="Dev tools">
        <div className="cataloggr-list">
          {devTools.map((tool) => (
            <SceneRow
              disabled={disabled}
              key={tool.slug}
              onManageTodo={onManageTodo}
              onToggle={onToggle}
              scene={toCatalogDevTool(tool)}
              statuses={statuses}
            />
          ))}
        </div>
      </PostSection>
    </div>
  );
}

export default memo(PostBoard);
