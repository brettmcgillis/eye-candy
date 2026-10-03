import React, { useRef, useState } from 'react';
import {
  FiCamera,
  FiCircle,
  FiFilm,
  FiImage,
  FiRefreshCw,
  FiSquare,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi';

import { Segmented } from '@dev/renderWorkbench/SchemaFields';

import isMobileDevice from '@utils/isMobileDevice';

const RECORD_SECONDS = [3, 5, 10, 15, 30];
const FACING_OPTIONS = [
  { icon: <FiCamera />, label: 'Front', value: 'front' },
  { icon: <FiCamera />, label: 'Back', value: 'back' },
];

function formatBytes(bytes) {
  if (bytes > 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function LibraryItem({ active, item, onPick, onRemove }) {
  return (
    <li className={`dk-library__item${active ? ' dk-library__item--on' : ''}`}>
      <button
        className="dk-library__pick"
        onClick={() => onPick(item)}
        title={`${item.kind} · ${formatBytes(item.size)}`}
        type="button"
      >
        {item.kind === 'image' ? (
          <img alt="" loading="lazy" src={item.url} />
        ) : (
          <video
            muted
            playsInline
            preload="metadata"
            src={`${item.url}#t=0.1`}
          />
        )}
        {item.kind === 'video' ? (
          <span className="dk-library__badge">
            <FiFilm />
          </span>
        ) : null}
      </button>
      <button
        aria-label="Delete source"
        className="dk-library__remove"
        onClick={() => onRemove(item.name)}
        type="button"
      >
        <FiTrash2 />
      </button>
    </li>
  );
}

export default function SourcePanel({
  busy,
  error,
  facing,
  info,
  library,
  onFacing,
  onFile,
  onPick,
  onRecord,
  onStopRecording,
  onStartCamera,
  onMirror,
  recording,
  source,
}) {
  const fileRef = useRef(null);
  const [seconds, setSeconds] = useState(5);
  const mobile = isMobileDevice();

  return (
    <section className="rw-control-section dk-source">
      <h2>Source</h2>
      <div className="dk-source__actions">
        <button
          className="dev-button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          <FiUpload /> Image or clip
        </button>
        <button
          className="dev-button"
          disabled={busy}
          onClick={onStartCamera}
          type="button"
        >
          <FiCamera /> Camera
        </button>
        <input
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          hidden
          onChange={(event) => {
            const [file] = event.target.files;
            if (file) onFile(file);
            Object.assign(event.target, { value: '' });
          }}
          ref={fileRef}
          type="file"
        />
      </div>
      {mobile ? (
        <Segmented
          label="Camera"
          onChange={onFacing}
          options={FACING_OPTIONS}
          value={facing}
        />
      ) : null}

      {source ? (
        <div className="dk-source__current">
          <span className="dk-source__kind">
            {source.kind === 'still' ? <FiImage /> : null}
            {source.kind === 'video' ? <FiFilm /> : null}
            {source.kind === 'live' ? <FiCamera /> : null}
          </span>
          <span className="dk-source__label">
            {source.label}
            <small>
              {source.frame.width}×{source.frame.height}
              {source.duration ? ` · ${source.duration.toFixed(1)}s` : ''}
              {info?.uploading ? ' · uploading…' : ''}
            </small>
          </span>
          <label className="rw-field rw-field--toggle" htmlFor="dk-mirror">
            Mirror
            <input
              checked={source.mirrored}
              id="dk-mirror"
              onChange={(event) => onMirror(event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
      ) : (
        <p className="rw-hint">
          Pick a photo or a clip, or start the camera. Everything you pick is
          kept below, so a take shot on the phone is here on the desktop too.
        </p>
      )}

      {source?.kind === 'live' ? (
        <div className="dk-record">
          <label className="rw-field" htmlFor="dk-record-seconds">
            Record
            <select
              disabled={Boolean(recording)}
              id="dk-record-seconds"
              onChange={(event) => setSeconds(Number(event.target.value))}
              value={seconds}
            >
              {RECORD_SECONDS.map((value) => (
                <option key={value} value={value}>
                  {value}s
                </option>
              ))}
            </select>
          </label>
          {recording ? (
            <button
              className="dev-button dk-record__stop"
              onClick={onStopRecording}
              type="button"
            >
              <FiSquare /> {Math.round(recording.progress * 100)}%
            </button>
          ) : (
            <button
              className="dev-button"
              disabled={busy}
              onClick={() => onRecord(seconds)}
              type="button"
            >
              <FiCircle /> Record a clip
            </button>
          )}
        </div>
      ) : null}

      {error ? <p className="rw-error">{error}</p> : null}

      {library.sources.length ? (
        <>
          <div className="dk-library__head">
            <h3>Library</h3>
            <button
              aria-label="Refresh library"
              className="dev-button"
              onClick={library.refresh}
              type="button"
            >
              <FiRefreshCw />
            </button>
          </div>
          <ul className="dk-library">
            {library.sources.map((item) => (
              <LibraryItem
                active={info?.name === item.name}
                item={item}
                key={item.name}
                onPick={onPick}
                onRemove={library.remove}
              />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
