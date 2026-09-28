import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  FiCamera,
  FiClipboard,
  FiExternalLink,
  FiUpload,
  FiX,
} from 'react-icons/fi';

import { SceneThumbnail } from './SceneCard';
import TodoPanel from './TodoPanel';
import { getSceneTargets, getStatusKey } from './catalogData';
import { getAppUrl, getImageFile } from './thumbnailApi';

function isTypingTarget(target) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function PublishTargets({ disabled, entry, onToggle, statuses }) {
  const targets = getSceneTargets(entry);

  return (
    <ul className="cataloggr-detail__targets">
      {targets.map((presetName) => {
        const statusKey =
          entry.statusKey ?? getStatusKey(entry.key, presetName);
        const inputId = `cataloggr-detail-${encodeURIComponent(statusKey)}`;
        const posted = Boolean(statuses[statusKey]);

        return (
          <li data-posted={posted} key={statusKey}>
            <input
              checked={posted}
              disabled={disabled}
              id={inputId}
              onChange={(event) => onToggle(statusKey, event.target.checked)}
              title="Posted"
              type="checkbox"
            />
            <label htmlFor={inputId}>
              {presetName ?? entry.targetLabel ?? 'Scene itself'}
            </label>
            {entry.path ? (
              <a
                aria-label={`Open ${presetName ?? entry.label}`}
                href={getAppUrl(
                  entry.path,
                  presetName ? { preset: presetName } : {}
                )}
                rel="noopener noreferrer"
                target="_blank"
                title={
                  presetName ? `Open at preset "${presetName}"` : 'Open scene'
                }
              >
                <FiExternalLink aria-hidden="true" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function SceneDetail({
  disabled,
  entry,
  onCapture,
  onClose,
  onDropImage,
  onError,
  onToggle,
  onTodoSaved,
  statuses,
  thumbnailVersion,
}) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handlePasteClick = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      const item = items.find((candidate) =>
        candidate.types.some((type) => type.startsWith('image/'))
      );
      if (!item) {
        onError('The clipboard has no image. Copy a screenshot first.');
        return;
      }
      const type = item.types.find((candidate) =>
        candidate.startsWith('image/')
      );
      onDropImage(entry.sourcePath, await item.getType(type));
    } catch (error) {
      onError(`Clipboard read failed: ${error.message}`);
    }
  }, [entry.sourcePath, onDropImage, onError]);
  const canCapture = Boolean(entry.path) && !entry.key.startsWith('devtool:');
  const canHoldThumbnail = entry.trackPosting !== false;

  useEffect(() => {
    function handlePaste(event) {
      if (!canHoldThumbnail || isTypingTarget(event.target)) return;
      const file = getImageFile(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      onDropImage(entry.sourcePath, file);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isTypingTarget(event.target)) onClose();
    }

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canHoldThumbnail, entry.sourcePath, onClose, onDropImage]);

  return (
    <aside
      aria-label={`${entry.label} details`}
      className={`cataloggr-detail cataloggr-card--${entry.area}`}
    >
      {canHoldThumbnail ? (
        <div
          className="cataloggr-thumb cataloggr-detail__thumb"
          data-dragging={dragging || undefined}
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
        >
          <SceneThumbnail entry={entry} thumbnailVersion={thumbnailVersion} />
          <span className="cataloggr-detail__thumb-actions">
            {canCapture ? (
              <button
                onClick={() => onCapture(entry)}
                title="Load the scene and capture its canvas"
                type="button"
              >
                <FiCamera aria-hidden="true" /> Capture
              </button>
            ) : null}
            <button
              onClick={handlePasteClick}
              title="Paste an image from the clipboard (or Cmd+V, or drop a file here)"
              type="button"
            >
              <FiClipboard aria-hidden="true" /> Paste
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Choose an image file"
              type="button"
            >
              <FiUpload aria-hidden="true" /> File
            </button>
            <input
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onDropImage(entry.sourcePath, file);
                fileInputRef.current.value = '';
              }}
              ref={fileInputRef}
              type="file"
            />
          </span>
        </div>
      ) : null}

      <header className="cataloggr-detail__header">
        <div>
          <h2>{entry.label}</h2>
          <span className="cataloggr-detail__meta">
            <span className="cataloggr-badge">{entry.areaLabel}</span>
            <span>{entry.channelLabel}</span>
            <code>{entry.sourcePath}</code>
          </span>
        </div>
        {entry.path ? (
          <a
            className="dev-button dev-button--primary"
            href={getAppUrl(entry.path)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FiExternalLink aria-hidden="true" /> Open
          </a>
        ) : null}
        <button
          aria-label="Close details"
          className="cataloggr-detail__close"
          onClick={onClose}
          title="Close (Esc)"
          type="button"
        >
          <FiX aria-hidden="true" />
        </button>
      </header>

      {entry.trackPosting !== false ? (
        <section className="cataloggr-detail__section">
          <h3>
            {entry.presetNames.length
              ? `Presets (${entry.presetNames.length})`
              : 'Publishing'}
          </h3>
          <PublishTargets
            disabled={disabled}
            entry={entry}
            onToggle={onToggle}
            statuses={statuses}
          />
        </section>
      ) : null}

      <section className="cataloggr-detail__section cataloggr-detail__section--todo">
        <h3>TODO</h3>
        <TodoPanel
          key={entry.sourcePath}
          onError={onError}
          onSaved={onTodoSaved}
          sourcePath={entry.sourcePath}
        />
      </section>
    </aside>
  );
}

export default memo(SceneDetail);
