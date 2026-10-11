import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiCamera,
  FiClipboard,
  FiImage,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi';

import {
  addScreenshot,
  fetchScreenshots,
  getScreenshotUrl,
  saveScreenshots,
} from './screenshotApi';
import { getImageFile, getThumbnailUrl, uploadThumbnail } from './thumbnailApi';

function ScreenshotsPanel({
  canCapture,
  onCapture,
  onError,
  onThumbnailSaved,
  revision,
  sourcePath,
  thumbnailVersion,
}) {
  const [shots, setShots] = useState([]);
  const [mainCaption, setMainCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchScreenshots(sourcePath)
      .then((next) => {
        if (cancelled) return;
        setShots(next.screenshots);
        setMainCaption(next.mainCaption);
      })
      .catch((error) => onError(`Screenshots load failed: ${error.message}`));
    return () => {
      cancelled = true;
    };
  }, [sourcePath, revision, onError]);

  const run = useCallback(
    async (task) => {
      setBusy(true);
      try {
        const next = await task();
        setShots(next.screenshots);
        setMainCaption(next.mainCaption);
      } catch (error) {
        onError(`Screenshots failed: ${error.message}`);
      } finally {
        setBusy(false);
      }
    },
    [onError]
  );

  const handleAdd = (source) => run(() => addScreenshot(sourcePath, source));
  const handleSave = (next, nextMain = mainCaption) =>
    run(() => saveScreenshots(sourcePath, nextMain, next));

  const handleMove = (index, delta) => {
    const next = [...shots];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    handleSave(next);
  };

  const handleCaption = (index, caption) => {
    if (caption.trim() === shots[index].caption) return;
    handleSave(
      shots.map((shot, i) => (i === index ? { ...shot, caption } : shot))
    );
  };

  const handleUseAsThumbnail = async (file) => {
    setBusy(true);
    try {
      const response = await fetch(getScreenshotUrl(sourcePath, file));
      const saved = await uploadThumbnail(sourcePath, await response.blob());
      onThumbnailSaved(sourcePath, saved.updatedAt);
    } catch (error) {
      onError(`Thumbnail failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePaste = async () => {
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
      await handleAdd(await item.getType(type));
    } catch (error) {
      onError(`Clipboard read failed: ${error.message}`);
    }
  };

  return (
    <div
      className="cataloggr-shots"
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
        if (file) handleAdd(file);
      }}
    >
      <div className="cataloggr-shots__actions">
        {canCapture ? (
          <button
            disabled={busy}
            onClick={onCapture}
            title="Load the scene (optionally at a preset) and capture its canvas"
            type="button"
          >
            <FiCamera aria-hidden="true" /> Capture
          </button>
        ) : null}
        <button disabled={busy} onClick={handlePaste} type="button">
          <FiClipboard aria-hidden="true" /> Paste
        </button>
        <button
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <FiUpload aria-hidden="true" /> File
        </button>
        <input
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleAdd(file);
            fileInputRef.current.value = '';
          }}
          ref={fileInputRef}
          type="file"
        />
      </div>
      {thumbnailVersion ? (
        <div className="cataloggr-shots__main">
          <img alt="" src={getThumbnailUrl(sourcePath, thumbnailVersion)} />
          <input
            aria-label="Caption for the main screenshot"
            defaultValue={mainCaption}
            disabled={busy}
            key={mainCaption}
            maxLength={200}
            onBlur={(event) => {
              if (event.target.value.trim() !== mainCaption) {
                handleSave(shots, event.target.value);
              }
            }}
            placeholder="Main screenshot caption (optional)"
            type="text"
          />
        </div>
      ) : null}
      {shots.length ? (
        <ol className="cataloggr-shots__list">
          {shots.map((shot, index) => (
            <li key={shot.file}>
              <img
                alt=""
                loading="lazy"
                src={getScreenshotUrl(sourcePath, shot.file)}
              />
              <input
                aria-label={`Caption for screenshot ${index + 1}`}
                defaultValue={shot.caption}
                disabled={busy}
                maxLength={200}
                onBlur={(event) => handleCaption(index, event.target.value)}
                placeholder="Caption (optional)"
                type="text"
              />
              <span className="cataloggr-shots__row-actions">
                <button
                  aria-label="Move up"
                  disabled={busy || index === 0}
                  onClick={() => handleMove(index, -1)}
                  type="button"
                >
                  <FiArrowUp aria-hidden="true" />
                </button>
                <button
                  aria-label="Move down"
                  disabled={busy || index === shots.length - 1}
                  onClick={() => handleMove(index, 1)}
                  type="button"
                >
                  <FiArrowDown aria-hidden="true" />
                </button>
                <button
                  aria-label="Use as card thumbnail"
                  disabled={busy}
                  onClick={() => handleUseAsThumbnail(shot.file)}
                  title="Use as card thumbnail"
                  type="button"
                >
                  <FiImage aria-hidden="true" />
                </button>
                <button
                  aria-label="Delete screenshot"
                  disabled={busy}
                  onClick={() =>
                    handleSave(shots.filter((_, i) => i !== index))
                  }
                  type="button"
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cataloggr-shots__empty">
          No extra screenshots yet. Drop images here too.
        </p>
      )}
    </div>
  );
}

export default ScreenshotsPanel;
