import React from 'react';
import { FiFilm, FiImage, FiX } from 'react-icons/fi';

import { Segmented } from '@dev/renderWorkbench/SchemaFields';

const FPS = [24, 25, 30, 60];

function progressText(progress) {
  if (!progress) return null;
  if (progress.phase === 'failed') return progress.error;
  if (progress.phase === 'submitted') {
    return 'Queued — the encode shows up under Jobs, then Transient.';
  }
  if (progress.phase === 'uploading') return 'Finishing uploads…';
  return `Rendering frame ${progress.done} / ${progress.total}`;
}

export default function ExportPanel({
  exporting,
  onCancel,
  onChange,
  onExport,
  progress,
  settings,
  source,
}) {
  const clip = source?.kind === 'video';
  const kind = clip ? settings.kind : 'still';
  const frames = Math.max(
    1,
    Math.round((settings.end - settings.start) * settings.fps)
  );
  const kindOptions = [
    { icon: <FiImage />, label: 'Still', value: 'still' },
    ...(clip ? [{ icon: <FiFilm />, label: 'Video', value: 'video' }] : []),
  ];

  return (
    <section className="rw-control-section dk-export">
      <h2>Export</h2>
      <Segmented
        label="Output"
        onChange={(value) => onChange('kind', value)}
        options={kindOptions}
        value={kind}
      />
      {kind === 'video' ? (
        <div className="rw-field-grid">
          <label className="rw-field" htmlFor="dk-fps">
            FPS
            <select
              id="dk-fps"
              onChange={(event) => onChange('fps', Number(event.target.value))}
              value={settings.fps}
            >
              {FPS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="rw-field rw-field--toggle" htmlFor="dk-audio">
            Source audio
            <input
              checked={settings.audio}
              id="dk-audio"
              onChange={(event) => onChange('audio', event.target.checked)}
              type="checkbox"
            />
          </label>
          <label className="rw-field" htmlFor="dk-start">
            Start (s)
            <input
              id="dk-start"
              max={source.duration}
              min={0}
              onChange={(event) =>
                onChange('start', Number(event.target.value))
              }
              step={0.1}
              type="number"
              value={settings.start}
            />
          </label>
          <label className="rw-field" htmlFor="dk-end">
            End (s)
            <input
              id="dk-end"
              max={source.duration}
              min={0}
              onChange={(event) => onChange('end', Number(event.target.value))}
              step={0.1}
              type="number"
              value={settings.end}
            />
          </label>
        </div>
      ) : null}
      {kind === 'video' ? (
        <p className="rw-hint">
          {frames} frames, each rendered from the clip at its exact time.
        </p>
      ) : (
        <p className="rw-hint">The frame in the preview, at the output size.</p>
      )}
      <div className="dk-export__actions">
        <button
          className="dev-button dev-button--primary rw-submit"
          disabled={!source || exporting}
          onClick={() => onExport(kind)}
          type="button"
        >
          {kind === 'still' ? <FiImage /> : <FiFilm />}
          {kind === 'still' ? 'Export still' : 'Render video'}
        </button>
        {exporting ? (
          <button className="dev-button" onClick={onCancel} type="button">
            <FiX /> Cancel
          </button>
        ) : null}
      </div>
      {progress ? (
        <p className={progress.phase === 'failed' ? 'rw-error' : 'rw-status'}>
          {progressText(progress)}
        </p>
      ) : null}
      {exporting && progress?.total ? (
        <progress max={progress.total} value={progress.done} />
      ) : null}
    </section>
  );
}
