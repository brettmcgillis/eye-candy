import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiCamera, FiPause, FiPlay, FiSkipForward, FiX } from 'react-icons/fi';

import {
  captureSceneFrame,
  loadFrame,
  snapshotSceneFrame,
} from './captureSceneFrame';
import { getAppUrl, uploadThumbnail } from './thumbnailApi';

const DEFAULT_SETTLE_SECONDS = 6;
const SEED_SESSION_KEY = 'cataloggr:thumbnailSeed';
const MAX_RELOAD_ATTEMPTS = 2;
const DONE_STATUSES = ['saved', 'blank', 'error', 'skipped'];
const STATUS_LABELS = {
  blank: 'Blank frame, skipped',
  capturing: 'Capturing...',
  error: 'Failed',
  pending: 'Queued',
  saved: 'Saved',
  skipped: 'Skipped',
  waiting: 'Waiting for capture',
};

export function readSeedSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SEED_SESSION_KEY));
  } catch {
    return null;
  }
}

function writeSeedSession(session) {
  try {
    window.localStorage.setItem(SEED_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Resuming after a reload is a convenience; capture still works without it.
  }
}

function clearSeedSession() {
  try {
    window.localStorage.removeItem(SEED_SESSION_KEY);
  } catch {
    // See writeSeedSession.
  }
}

function waitForVisible(signal) {
  if (document.visibilityState === 'visible') return Promise.resolve();

  return new Promise((resolve, reject) => {
    const handleChange = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', handleChange);
      resolve();
    };
    document.addEventListener('visibilitychange', handleChange);
    signal.addEventListener(
      'abort',
      () => {
        document.removeEventListener('visibilitychange', handleChange);
        reject(new DOMException('Capture cancelled.', 'AbortError'));
      },
      { once: true }
    );
  });
}

function ThumbnailSeeder({ autoStart, onCaptured, onClose, targets }) {
  const iframeRef = useRef(null);
  const controllerRef = useRef(null);
  const actionRef = useRef(null);
  const [settleSeconds, setSettleSeconds] = useState(
    () => readSeedSession()?.settleSeconds ?? DEFAULT_SETTLE_SECONDS
  );
  const [mode, setMode] = useState(() => readSeedSession()?.mode ?? 'auto');
  const [presets, setPresets] = useState(
    () => readSeedSession()?.presets ?? {}
  );
  const [statuses, setStatuses] = useState(() => {
    const attempts = readSeedSession()?.attempts ?? {};
    return Object.fromEntries(
      targets
        .filter((target) => attempts[target.sourcePath] >= MAX_RELOAD_ATTEMPTS)
        .map((target) => [
          target.key,
          {
            message: 'The page reloaded while capturing this scene.',
            status: 'error',
          },
        ])
    );
  });
  const [running, setRunning] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const statusesRef = useRef(statuses);
  const settleSecondsRef = useRef(settleSeconds);
  const modeRef = useRef(mode);
  const presetsRef = useRef(presets);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    statusesRef.current = statuses;
    settleSecondsRef.current = settleSeconds;
    modeRef.current = mode;
    presetsRef.current = presets;
  }, [mode, presets, settleSeconds, statuses]);

  const setStatus = useCallback((key, status, message) => {
    setStatuses((current) => ({ ...current, [key]: { message, status } }));
  }, []);

  const run = useCallback(async () => {
    const controller = new AbortController();
    const { signal } = controller;
    controllerRef.current = controller;
    setRunning(true);
    const batch = targets.length > 1;
    const session = {
      attempts: readSeedSession()?.attempts ?? {},
      mode: modeRef.current,
      presets: presetsRef.current,
      settleSeconds: settleSecondsRef.current,
    };
    if (batch) writeSeedSession(session);

    const waitForAction = () =>
      new Promise((resolve, reject) => {
        actionRef.current = resolve;
        signal.addEventListener(
          'abort',
          () => reject(new DOMException('Capture cancelled.', 'AbortError')),
          { once: true }
        );
      });

    const captureTarget = async (target) => {
      await waitForVisible(signal);
      if (batch) {
        session.attempts[target.sourcePath] =
          (session.attempts[target.sourcePath] ?? 0) + 1;
        writeSeedSession(session);
      }
      setActiveKey(target.key);
      setStatus(target.key, 'capturing');
      const preset = presetsRef.current[target.key];
      const url = getAppUrl(
        target.path,
        preset ? { hideUI: '', preset } : { hideUI: '' }
      );

      try {
        let snapshot;

        if (modeRef.current === 'manual') {
          await loadFrame(iframeRef.current, url, signal);
          setStatus(target.key, 'waiting');
          const action = await waitForAction();
          actionRef.current = null;
          if (action === 'skip') {
            setStatus(target.key, 'skipped');
            return;
          }
          setStatus(target.key, 'capturing');
          snapshot = await snapshotSceneFrame(iframeRef.current);
          if (!snapshot) throw new Error('No scene canvas found.');
        } else {
          const result = await captureSceneFrame(iframeRef.current, {
            settleMs: settleSecondsRef.current * 1000,
            signal,
            url,
          });

          if (result.blank && (batch || !result.snapshot)) {
            setStatus(target.key, 'blank');
            return;
          }
          snapshot = result.snapshot;
        }

        const saved = await uploadThumbnail(target.sourcePath, snapshot);
        setStatus(target.key, 'saved');
        onCaptured(target.sourcePath, saved.updatedAt);
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        setStatus(target.key, 'error', error.message);
      }
    };

    try {
      await targets
        .filter(
          (target) =>
            !DONE_STATUSES.includes(statusesRef.current[target.key]?.status)
        )
        .reduce(
          (previous, target) => previous.then(() => captureTarget(target)),
          Promise.resolve()
        );
      clearSeedSession();
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    } finally {
      actionRef.current = null;
      if (iframeRef.current) iframeRef.current.src = 'about:blank';
      setActiveKey(null);
      setRunning(false);
    }
  }, [onCaptured, setStatus, targets]);

  const handlePause = useCallback(() => {
    controllerRef.current?.abort();
    clearSeedSession();
    setStatuses((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([, entry]) => !['capturing', 'waiting'].includes(entry.status)
        )
      )
    );
  }, []);

  const handleAction = useCallback((action) => actionRef.current?.(action), []);

  const handleStart = useCallback(() => {
    if (targets.length === 1) {
      statusesRef.current = {};
      setStatuses({});
    }
    run();
  }, [run, targets.length]);

  const handleClose = useCallback(() => {
    controllerRef.current?.abort();
    clearSeedSession();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    run();
  }, [autoStart, run]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const completedCount = targets.filter((target) =>
    DONE_STATUSES.includes(statuses[target.key]?.status)
  ).length;
  const activeTarget = targets.find((target) => target.key === activeKey);
  const waiting = statuses[activeKey]?.status === 'waiting';

  let startLabel = 'Start';
  if (completedCount) startLabel = targets.length === 1 ? 'Retake' : 'Resume';

  let stageHint =
    mode === 'manual'
      ? 'Each scene loads here with its UI hidden and keeps running; click Capture to save its canvas as thumbnail.webp.'
      : 'Each scene loads here with its UI hidden, settles, then its canvas is saved as thumbnail.webp.';
  if (waiting) {
    stageHint = `${activeTarget.label} is running. Click Capture when the frame looks right.`;
  } else if (activeTarget) {
    stageHint = `Rendering ${activeTarget.label}. Keep this tab visible; hidden tabs render blank.`;
  }

  return (
    <div
      className="cataloggr-seeder"
      role="dialog"
      aria-label="Capture thumbnails"
    >
      <div className="cataloggr-seeder__panel">
        <header className="cataloggr-seeder__header">
          <strong>
            <FiCamera aria-hidden="true" /> Capture thumbnails
          </strong>
          <span>
            {completedCount}/{targets.length}
          </span>
          <label htmlFor="cataloggr-seeder-mode">
            Mode
            <select
              disabled={running}
              id="cataloggr-seeder-mode"
              onChange={(event) => setMode(event.target.value)}
              value={mode}
            >
              <option value="auto">Auto (settle)</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          {mode === 'auto' ? (
            <label htmlFor="cataloggr-seeder-settle">
              Settle
              <input
                disabled={running}
                id="cataloggr-seeder-settle"
                min="1"
                max="60"
                onChange={(event) =>
                  setSettleSeconds(Math.max(1, Number(event.target.value) || 1))
                }
                type="number"
                value={settleSeconds}
              />
              s
            </label>
          ) : null}
          {waiting ? (
            <>
              <button
                className="dev-button dev-button--primary"
                onClick={() => handleAction('capture')}
                type="button"
              >
                <FiCamera aria-hidden="true" /> Capture
              </button>
              {targets.length > 1 ? (
                <button
                  className="dev-button"
                  onClick={() => handleAction('skip')}
                  type="button"
                >
                  <FiSkipForward aria-hidden="true" /> Skip
                </button>
              ) : null}
            </>
          ) : null}
          {running ? (
            <button className="dev-button" onClick={handlePause} type="button">
              <FiPause aria-hidden="true" /> Pause
            </button>
          ) : (
            <button
              className="dev-button dev-button--primary"
              disabled={targets.length > 1 && completedCount === targets.length}
              onClick={handleStart}
              type="button"
            >
              <FiPlay aria-hidden="true" /> {startLabel}
            </button>
          )}
          <button
            aria-label="Close capture"
            className="cataloggr-seeder__close"
            onClick={handleClose}
            type="button"
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="cataloggr-seeder__body">
          <div className="cataloggr-seeder__stage">
            <iframe
              ref={iframeRef}
              src="about:blank"
              title={
                activeTarget
                  ? `Capturing ${activeTarget.label}`
                  : 'Capture stage'
              }
            />
            <p>{stageHint}</p>
          </div>
          <ol className="cataloggr-seeder__queue">
            {targets.map((target) => {
              const entry = statuses[target.key];
              const status = entry?.status ?? 'pending';

              return (
                <li
                  data-status={status}
                  key={target.key}
                  title={entry?.message}
                >
                  <span>{target.label}</span>
                  <small>{STATUS_LABELS[status]}</small>
                  {target.presetNames?.length ? (
                    <select
                      aria-label={`Preset for ${target.label}`}
                      disabled={running}
                      onChange={(event) =>
                        setPresets((current) => ({
                          ...current,
                          [target.key]: event.target.value,
                        }))
                      }
                      value={presets[target.key] ?? ''}
                    >
                      <option value="">Default scene</option>
                      {target.presetNames.map((presetName) => (
                        <option key={presetName} value={presetName}>
                          {presetName}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default memo(ThumbnailSeeder);
