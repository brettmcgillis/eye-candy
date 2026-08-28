import React, { memo, useState } from 'react';
import { FiChevronRight, FiExternalLink, FiFileText } from 'react-icons/fi';

import { getSceneTargets, getStatusKey } from './catalogData';

function SceneRow({ disabled, onManageTodo, onToggle, scene, statuses }) {
  const [expanded, setExpanded] = useState(false);
  const targets = getSceneTargets(scene);
  const getTargetStatusKey = (presetName) =>
    scene.statusKey ?? getStatusKey(scene.key, presetName);
  const postedCount = targets.filter(
    (presetName) => statuses[getTargetStatusKey(presetName)]
  ).length;
  const allPosted = postedCount === targets.length;

  return (
    <article
      className={`cataloggr-scene cataloggr-scene--${scene.area}`}
      data-posted={allPosted}
    >
      <div className="cataloggr-scene__summary">
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${scene.label}`}
          className="cataloggr-scene__expand"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <FiChevronRight aria-hidden="true" />
        </button>

        <div className="cataloggr-scene__identity">
          <h2>{scene.label}</h2>
          <span>
            {scene.slug} - {scene.channelLabel}
          </span>
        </div>

        <span className={`cataloggr-badge cataloggr-badge--${scene.area}`}>
          {scene.areaLabel}
        </span>

        <div className="cataloggr-scene__progress">
          <strong>
            {postedCount}/{targets.length}
          </strong>
          <span>{scene.progressLabel ?? 'scene + presets posted'}</span>
        </div>

        <div className="cataloggr-scene__actions">
          <button
            aria-label={`Manage ${scene.label} TODO`}
            className="cataloggr-scene__todo"
            onClick={() => onManageTodo(scene.sourcePath)}
            title="Manage TODO"
            type="button"
          >
            <FiFileText aria-hidden="true" />
          </button>
          {scene.path ? (
            <a
              aria-label={`Open ${scene.label}`}
              className="cataloggr-scene__open"
              href={scene.path}
              title="Open scene"
            >
              <FiExternalLink aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="cataloggr-scene__details">
          <p className="cataloggr-scene__path">{scene.sourcePath}</p>
          <div className="cataloggr-scene__targets">
            {targets.map((presetName) => {
              const statusKey = getTargetStatusKey(presetName);
              const inputId = `cataloggr-${encodeURIComponent(statusKey)}`;

              return (
                <label
                  className="cataloggr-target"
                  htmlFor={inputId}
                  key={statusKey}
                >
                  <input
                    checked={Boolean(statuses[statusKey])}
                    disabled={disabled}
                    id={inputId}
                    onChange={(event) =>
                      onToggle(statusKey, event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>
                    {presetName ?? scene.targetLabel ?? 'Scene itself'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default memo(SceneRow);
