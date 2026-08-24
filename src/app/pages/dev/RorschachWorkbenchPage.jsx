import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFilm,
  FiFolder,
  FiImage,
  FiMaximize2,
  FiRefreshCw,
  FiSquare,
  FiStopCircle,
  FiTrash2,
  FiX,
  FiZoomIn,
  FiZoomOut,
} from 'react-icons/fi';

import DevPageHeaderBar from './DevPageHeaderBar';
import './RorschachWorkbenchPage.css';
import useRorschachJobs from './useRorschachJobs';

const PROFILES = {
  post: { height: 1350, label: 'Post', width: 1080 },
  reel: { height: 1920, label: 'Reel', width: 1080 },
  square: { height: 1080, label: 'Square', width: 1080 },
  story: { height: 1920, label: 'Story', width: 1080 },
};
const PROFILE_OPTIONS = Object.entries(PROFILES).map(([value, item]) => ({
  icon: <FiSquare />,
  label: item.label,
  value,
}));
const OUTPUT_OPTIONS = [
  { icon: <FiImage />, label: 'Stills', value: 'still' },
  { icon: <FiFilm />, label: 'Video', value: 'video' },
];

const INITIAL_OPTIONS = {
  bloom: true,
  count: 10,
  crossfade: 0.5,
  fps: 30,
  height: 2622,
  hold: 2,
  ig: 'post',
  mode: 'stills',
  overlay: true,
  renderer: 'gpu',
  seed: '',
  systems: 3,
  svg: false,
  turns: 1,
  view: 'front',
  views: 'front', // 'front,back,top,bottom',
  webp: false,
  width: 1206,
};

function Segmented({ label, onChange, options, value }) {
  return (
    <fieldset className="rw-fieldset">
      <legend>{label}</legend>
      <div className="rw-segmented">
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className="rw-segmented__button"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NumberField({ id, label, max, min, onChange, step = 1, value }) {
  return (
    <label className="rw-field" htmlFor={id}>
      {label}
      <input
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function JobStatus({ job }) {
  const active = ['queued', 'running', 'cancelling'].includes(job.status);
  return (
    <article className="rw-job">
      <div className="rw-job__summary">
        <span className={`rw-status rw-status--${job.status}`}>
          {job.status === 'completed' ? <FiCheck /> : null}
          {job.status}
        </span>
        <strong>{job.kind === 'still' ? 'Still batch' : 'Video render'}</strong>
        <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
      </div>
      <div className="rw-progress" aria-label={`${job.progress}% complete`}>
        <span style={{ width: `${job.progress}%` }} />
      </div>
      <div className="rw-job__meta">
        <span>{job.phase}</span>
        <span>{job.progress}%</span>
        <span>{job.outputDirectory}</span>
      </div>
      {job.error ? <p className="rw-error">{job.error}</p> : null}
      {active ? (
        <button
          className="dev-button rw-job__cancel"
          data-cancel-job={job.id}
          type="button"
        >
          <FiStopCircle /> Cancel
        </button>
      ) : null}
      {job.logs.length > 0 ? (
        <details className="rw-log">
          <summary>Render log</summary>
          <pre>
            {job.logs
              .map(
                (entry) =>
                  `[${new Date(entry.time).toLocaleTimeString()}] ` +
                  `${entry.source}: ${entry.text}`
              )
              .join('\n')}
          </pre>
        </details>
      ) : null}
    </article>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

const FORMAT_ORDER = ['png', 'webp', 'svg', 'mp4'];

function assetFormat(asset) {
  return asset.path.split('.').pop().toLowerCase();
}

function groupMediaAssets(assets) {
  const groups = new Map();
  assets.forEach((asset) => {
    const format = assetFormat(asset);
    const key =
      format === 'mp4' ? asset.path : asset.path.slice(0, -(format.length + 1));
    const group = groups.get(key) ?? {
      assets: [],
      key,
      name: key.split('/').slice(-2).join(' / '),
    };
    group.assets.push(asset);
    groups.set(key, group);
  });
  return [...groups.values()].map((group) => ({
    ...group,
    assets: group.assets.sort(
      (left, right) =>
        FORMAT_ORDER.indexOf(assetFormat(left)) -
        FORMAT_ORDER.indexOf(assetFormat(right))
    ),
  }));
}

function itemKey(jobId, groupKey) {
  return `${jobId}:${groupKey}`;
}

function MediaPreview({ asset, controls = false, eager = false }) {
  if (assetFormat(asset) === 'mp4') {
    const source = controls ? asset.url : `${asset.url}#t=0.001`;
    return (
      // Generated clips currently have no audio track to caption.
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        controls={controls}
        draggable={false}
        muted={!controls}
        playsInline
        preload={controls ? 'metadata' : 'auto'}
        src={source}
        tabIndex={controls ? 0 : -1}
      />
    );
  }
  return (
    <img
      alt="Generated Rorschach output"
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      src={asset.url}
    />
  );
}

function PreviewDialog({ group, groupCount, onClose, onNext, onPrevious }) {
  const [assetIndex, setAssetIndex] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef(null);
  const mediaRef = useRef(null);
  const zoomCenterRef = useRef(null);
  const asset = group.assets[assetIndex] ?? group.assets[0];

  const changeZoom = useCallback(
    (nextZoom) => {
      const resolvedZoom = Math.min(3, Math.max(1, nextZoom));
      if (resolvedZoom === zoom) return;

      const viewport = mediaRef.current;
      if (viewport) {
        zoomCenterRef.current = {
          x:
            (viewport.scrollLeft + viewport.clientWidth / 2) /
            viewport.scrollWidth,
          y:
            (viewport.scrollTop + viewport.clientHeight / 2) /
            viewport.scrollHeight,
        };
      }
      setZoom(resolvedZoom);
    },
    [zoom]
  );

  useLayoutEffect(() => {
    const center = zoomCenterRef.current;
    const viewport = mediaRef.current;
    if (!center || !viewport) return;

    viewport.scrollLeft =
      center.x * viewport.scrollWidth - viewport.clientWidth / 2;
    viewport.scrollTop =
      center.y * viewport.scrollHeight - viewport.clientHeight / 2;
    zoomCenterRef.current = null;
  }, [zoom]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious();
      if (event.key === 'ArrowRight') onNext();
      if (event.key === '-' || event.key === '_') {
        changeZoom(zoom - 0.25);
      }
      if (event.key === '+' || event.key === '=') {
        changeZoom(zoom + 0.25);
      }
      if (event.key === '0') changeZoom(1);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [changeZoom, onClose, onNext, onPrevious, zoom]);

  function startPan(event) {
    if (zoom === 1 || event.button !== 0) return;

    const viewport = event.currentTarget;
    dragRef.current = {
      pointerId: event.pointerId,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      x: event.clientX,
      y: event.clientY,
    };
    viewport.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }

  function pan(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const viewport = event.currentTarget;
    viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    viewport.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  }

  function stopPan(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPanning(false);
  }

  return (
    <dialog aria-label={`Preview ${group.name}`} className="rw-preview" open>
      <button
        aria-label="Close preview"
        className="rw-preview__backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="rw-preview__panel">
        <header className="rw-preview__header">
          <div>
            <strong>{group.name}</strong>
            <span>
              {assetFormat(asset).toUpperCase()} · {assetIndex + 1} of{' '}
              {group.assets.length} formats
            </span>
          </div>
          <div>
            <div className="rw-preview__zoom-controls">
              <button
                aria-label="Zoom out"
                disabled={zoom === 1}
                onClick={() => changeZoom(zoom - 0.25)}
                type="button"
              >
                <FiZoomOut />
              </button>
              <button
                aria-label="Reset zoom"
                onClick={() => changeZoom(1)}
                type="button"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                aria-label="Zoom in"
                disabled={zoom === 3}
                onClick={() => changeZoom(zoom + 0.25)}
                type="button"
              >
                <FiZoomIn />
              </button>
            </div>
            <a download href={asset.url}>
              <FiDownload /> Download
            </a>
            <button aria-label="Close preview" onClick={onClose} type="button">
              <FiX />
            </button>
          </div>
        </header>

        <div className="rw-preview__stage">
          <button
            aria-label="Previous generated image"
            disabled={groupCount < 2}
            onClick={onPrevious}
            type="button"
          >
            <FiChevronLeft />
          </button>
          <div
            className={`rw-preview__media${zoom > 1 ? ' rw-preview__media--pannable' : ''}${isPanning ? ' rw-preview__media--panning' : ''}`}
            onLostPointerCapture={() => {
              dragRef.current = null;
              setIsPanning(false);
            }}
            onPointerCancel={stopPan}
            onPointerDown={startPan}
            onPointerMove={pan}
            onPointerUp={stopPan}
            ref={mediaRef}
          >
            <div
              className="rw-preview__zoom"
              style={{ height: `${zoom * 100}%`, width: `${zoom * 100}%` }}
            >
              <MediaPreview asset={asset} controls eager />
            </div>
          </div>
          <button
            aria-label="Next generated image"
            disabled={groupCount < 2}
            onClick={onNext}
            type="button"
          >
            <FiChevronRight />
          </button>
        </div>

        <footer className="rw-preview__formats">
          {group.assets.map((formatAsset, index) => (
            <button
              aria-pressed={index === assetIndex}
              key={formatAsset.path}
              onClick={() => setAssetIndex(index)}
              type="button"
            >
              <span>{assetFormat(formatAsset).toUpperCase()}</span>
              <MediaPreview asset={formatAsset} />
            </button>
          ))}
        </footer>
      </div>
    </dialog>
  );
}

function AssetGallery({
  deletingId,
  jobs,
  onCancelDelete,
  onConfirmDelete,
  onRemoveAssets,
  onRemoveMany,
  onRequestDelete,
  pendingDeleteId,
}) {
  const [deletingItemKey, setDeletingItemKey] = useState(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(null);
  const [pendingItemDelete, setPendingItemDelete] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedCollections, setSelectedCollections] = useState(
    () => new Set()
  );
  const [selectedItems, setSelectedItems] = useState(() => new Set());
  const [submittingBulkDelete, setSubmittingBulkDelete] = useState(false);
  const collections = useMemo(
    () =>
      jobs
        .filter((job) =>
          ['cancelled', 'completed', 'failed'].includes(job.status)
        )
        .map((job) => {
          const media = job.assets.filter((asset) =>
            /\.(png|svg|webp|mp4)$/u.test(asset.path)
          );
          return { groups: groupMediaAssets(media), job };
        }),
    [jobs]
  );
  const selectedGroups = collections.flatMap(({ groups, job }) =>
    groups
      .filter((group) => selectedItems.has(itemKey(job.id, group.key)))
      .map((group) => ({ group, job }))
  );
  const selectedJobs = collections
    .map(({ job }) => job)
    .filter((job) => selectedCollections.has(job.id));

  const closePreview = useCallback(() => setPreview(null), []);
  const showNextPreview = useCallback(() => {
    setPreview((current) => ({
      ...current,
      index: (current.index + 1) % current.groups.length,
    }));
  }, []);
  const showPreviousPreview = useCallback(() => {
    setPreview((current) => ({
      ...current,
      index:
        (current.index - 1 + current.groups.length) % current.groups.length,
    }));
  }, []);

  function toggleItem(key) {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCollectionItems(job, groups) {
    const keys = groups.map((group) => itemKey(job.id, group.key));
    const allSelected = keys.every((key) => selectedItems.has(key));
    setSelectedItems((current) => {
      const next = new Set(current);
      keys.forEach((key) => (allSelected ? next.delete(key) : next.add(key)));
      return next;
    });
  }

  function toggleCollection(id) {
    setSelectedCollections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteItem(job, group) {
    const key = itemKey(job.id, group.key);
    setDeletingItemKey(key);
    try {
      await onRemoveAssets(
        job.id,
        job.outputDirectory,
        group.assets.map((asset) => asset.path)
      );
      setPendingItemDelete(null);
      setSelectedItems((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      if (preview?.groups.some((item) => item.key === group.key)) {
        setPreview(null);
      }
    } finally {
      setDeletingItemKey(null);
    }
  }

  async function deleteSelectedItems() {
    setSubmittingBulkDelete(true);
    try {
      const byJob = new Map();
      selectedGroups.forEach(({ group, job }) => {
        const entry = byJob.get(job.id) ?? { job, paths: [] };
        entry.paths.push(...group.assets.map((asset) => asset.path));
        byJob.set(job.id, entry);
      });
      await Promise.all(
        [...byJob.values()].map(({ job, paths }) =>
          onRemoveAssets(job.id, job.outputDirectory, paths)
        )
      );
      setPendingBulkDelete(null);
      setSelectedItems(new Set());
      setPreview(null);
    } finally {
      setSubmittingBulkDelete(false);
    }
  }

  async function deleteSelectedCollections() {
    setSubmittingBulkDelete(true);
    try {
      await onRemoveMany(
        selectedJobs.map((job) => ({
          id: job.id,
          outputDirectory: job.outputDirectory,
        }))
      );
      setPendingBulkDelete(null);
      setSelectedCollections(new Set());
      setPreview(null);
    } finally {
      setSubmittingBulkDelete(false);
    }
  }

  if (collections.length === 0) {
    return <div className="rw-empty">Output collections appear here.</div>;
  }

  return (
    <div className="rw-library">
      {selectedGroups.length > 0 || selectedJobs.length > 0 ? (
        <div className="rw-bulk-actions">
          <span>
            {selectedGroups.length} items · {selectedJobs.length} folders
          </span>
          {pendingBulkDelete ? (
            <div>
              <strong>
                Delete selected{' '}
                {pendingBulkDelete === 'items' ? 'items' : 'folders'}?
              </strong>
              <button
                className="dev-button"
                disabled={submittingBulkDelete}
                onClick={
                  pendingBulkDelete === 'items'
                    ? deleteSelectedItems
                    : deleteSelectedCollections
                }
                type="button"
              >
                Delete
              </button>
              <button
                className="dev-button"
                onClick={() => setPendingBulkDelete(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <button
                className="dev-button"
                disabled={selectedGroups.length === 0}
                onClick={() => setPendingBulkDelete('items')}
                type="button"
              >
                <FiTrash2 /> Delete items
              </button>
              <button
                className="dev-button"
                disabled={selectedJobs.length === 0}
                onClick={() => setPendingBulkDelete('collections')}
                type="button"
              >
                <FiTrash2 /> Delete folders
              </button>
            </div>
          )}
        </div>
      ) : null}
      {collections.map(({ groups, job }) => {
        return (
          <section className="rw-collection" key={job.id}>
            <header className="rw-collection__header">
              <div>
                <strong>
                  <FiFolder />
                  {job.source === 'legacy'
                    ? 'Legacy batch'
                    : 'Workbench render'}
                </strong>
                <span title={job.outputDirectory}>{job.outputDirectory}</span>
              </div>
              <div className="rw-collection__stats">
                <div className="rw-collection__selection">
                  <label htmlFor={`rw-items-${job.id}`}>
                    <input
                      checked={
                        groups.length > 0 &&
                        groups.every((group) =>
                          selectedItems.has(itemKey(job.id, group.key))
                        )
                      }
                      disabled={groups.length === 0}
                      id={`rw-items-${job.id}`}
                      onChange={() => toggleCollectionItems(job, groups)}
                      type="checkbox"
                    />
                    Items
                  </label>
                  <label htmlFor={`rw-folder-${job.id}`}>
                    <input
                      checked={selectedCollections.has(job.id)}
                      id={`rw-folder-${job.id}`}
                      onChange={() => toggleCollection(job.id)}
                      type="checkbox"
                    />
                    Folder
                  </label>
                </div>
                <span>
                  {job.assets.length} files · {formatBytes(job.storageBytes)}
                </span>
                {pendingDeleteId === job.id ? (
                  <div className="rw-delete-confirmation">
                    <span>Delete folder?</span>
                    <button
                      className="dev-button"
                      disabled={deletingId === job.id}
                      onClick={() => onConfirmDelete(job)}
                      type="button"
                    >
                      Delete
                    </button>
                    <button
                      aria-label="Cancel deletion"
                      className="dev-button"
                      onClick={onCancelDelete}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label={`Delete ${job.outputDirectory}`}
                    className="dev-button rw-delete"
                    disabled={deletingId === job.id}
                    onClick={() => onRequestDelete(job.id)}
                    title="Delete collection from disk"
                    type="button"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </header>
            {groups.length > 0 ? (
              <div className="rw-gallery">
                {groups.map((group, index) => {
                  const isVideo = assetFormat(group.assets[0]) === 'mp4';
                  return (
                    <figure
                      className={`rw-asset ${
                        group.assets.length > 1 ? 'rw-asset--stacked' : ''
                      }`}
                      key={`${job.id}:${group.key}`}
                    >
                      <button
                        aria-label={`Preview ${isVideo ? 'video' : 'still'} ${
                          group.name
                        }`}
                        className="rw-asset__open"
                        onClick={() => setPreview({ groups, index })}
                        type="button"
                      >
                        <span className="rw-asset__preview">
                          <MediaPreview asset={group.assets[0]} />
                        </span>
                        <span className="rw-asset__expand">
                          <FiMaximize2 />
                        </span>
                        <span className="rw-asset__type">
                          {isVideo ? <FiFilm /> : <FiImage />}
                          <span>{isVideo ? 'Video' : 'Still'}</span>
                        </span>
                        {group.assets.length > 1 ? (
                          <span className="rw-asset__format-count">
                            {group.assets.length} formats
                          </span>
                        ) : null}
                      </button>
                      <figcaption>
                        <input
                          aria-label={`Select ${group.name}`}
                          checked={selectedItems.has(
                            itemKey(job.id, group.key)
                          )}
                          onChange={() =>
                            toggleItem(itemKey(job.id, group.key))
                          }
                          type="checkbox"
                        />
                        <span title={group.key}>{group.name}</span>
                        <div>
                          <a
                            aria-label={`Download ${group.assets[0].name}`}
                            download
                            href={group.assets[0].url}
                          >
                            <FiDownload />
                          </a>
                          {pendingItemDelete === itemKey(job.id, group.key) ? (
                            <>
                              <button
                                aria-label={`Confirm delete ${group.name}`}
                                className="rw-asset__confirm-delete"
                                disabled={
                                  deletingItemKey === itemKey(job.id, group.key)
                                }
                                onClick={() => deleteItem(job, group)}
                                type="button"
                              >
                                Delete
                              </button>
                              <button
                                aria-label={`Cancel delete ${group.name}`}
                                className="rw-asset__icon-action"
                                onClick={() => setPendingItemDelete(null)}
                                type="button"
                              >
                                <FiX />
                              </button>
                            </>
                          ) : (
                            <button
                              aria-label={`Delete ${group.name}`}
                              className="rw-asset__icon-action"
                              onClick={() =>
                                setPendingItemDelete(itemKey(job.id, group.key))
                              }
                              type="button"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <div className="rw-collection__empty">No previewable media</div>
            )}
          </section>
        );
      })}
      {preview ? (
        <PreviewDialog
          group={preview.groups[preview.index]}
          groupCount={preview.groups.length}
          key={preview.groups[preview.index].key}
          onClose={closePreview}
          onNext={showNextPreview}
          onPrevious={showPreviousPreview}
        />
      ) : null}
    </div>
  );
}

export default function RorschachWorkbenchPage() {
  const {
    cancel,
    error,
    jobs,
    loading,
    refresh,
    remove,
    removeAssets,
    removeMany,
    submit,
  } = useRorschachJobs();
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [kind, setKind] = useState('still');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [profile, setProfile] = useState('post');
  const [submitting, setSubmitting] = useState(false);

  const activeCount = useMemo(
    () =>
      jobs.filter((job) =>
        ['queued', 'running', 'cancelling'].includes(job.status)
      ).length,
    [jobs]
  );
  const workbenchJobs = useMemo(
    () => jobs.filter((job) => job.source === 'workbench'),
    [jobs]
  );

  function setOption(key, value) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  const selectProfile = useCallback((nextProfile) => {
    const dimensions = PROFILES[nextProfile];
    setProfile(nextProfile);
    setOptions((current) => ({
      ...current,
      height: dimensions.height,
      ig: nextProfile === 'square' ? 'none' : nextProfile,
      width: dimensions.width,
    }));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submit({ kind, options });
    } finally {
      setSubmitting(false);
    }
  }

  function handleQueueClick(event) {
    const button = event.target.closest('[data-cancel-job]');
    if (button) cancel(button.dataset.cancelJob);
  }

  const confirmDelete = useCallback(
    async (job) => {
      setDeletingId(job.id);
      try {
        await remove(job.id, job.outputDirectory);
        setPendingDeleteId(null);
      } finally {
        setDeletingId(null);
      }
    },
    [remove]
  );

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  return (
    <main className="dev-page rw-page">
      <DevPageHeaderBar
        eyebrow=""
        icon="rorschach.webp"
        title="Rorschach Workbench"
      />

      <div className="rw-toolbar">
        <p />
        <div className="rw-toolbar__status">
          <span>{activeCount} active</span>
          <button className="dev-button" onClick={refresh} type="button">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      <div className="rw-layout">
        <form className="dev-panel rw-controls" onSubmit={handleSubmit}>
          <Segmented
            label="Output"
            onChange={setKind}
            options={OUTPUT_OPTIONS}
            value={kind}
          />

          <Segmented
            label="Format"
            onChange={selectProfile}
            options={PROFILE_OPTIONS}
            value={profile}
          />

          <section className="rw-control-section">
            <h2>Frame</h2>
            <div className="rw-field-grid">
              <NumberField
                id="rw-width"
                label="Width"
                max={8192}
                min={64}
                onChange={(value) => setOption('width', value)}
                value={options.width}
              />
              <NumberField
                id="rw-height"
                label="Height"
                max={8192}
                min={64}
                onChange={(value) => setOption('height', value)}
                value={options.height}
              />
              <NumberField
                id="rw-seed"
                label="Seed"
                max={999999}
                min={0}
                onChange={(value) => setOption('seed', value)}
                value={options.seed}
              />
              <label className="rw-field" htmlFor="rw-renderer">
                Renderer
                <select
                  id="rw-renderer"
                  onChange={(event) =>
                    setOption('renderer', event.target.value)
                  }
                  value={options.renderer}
                >
                  <option value="gpu">WebGPU</option>
                  <option value="svg">SVG fallback</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rw-control-section">
            <h2>{kind === 'still' ? 'Batch' : 'Motion'}</h2>
            <div className="rw-field-grid">
              {kind === 'still' ? (
                <>
                  <NumberField
                    id="rw-count"
                    label="Count"
                    max={100}
                    min={1}
                    onChange={(value) => setOption('count', value)}
                    value={options.count}
                  />
                  <label className="rw-field rw-field--wide" htmlFor="rw-views">
                    Views
                    <select
                      id="rw-views"
                      onChange={(event) =>
                        setOption('views', event.target.value)
                      }
                      value={options.views}
                    >
                      <option value="front,back,top,bottom">All views</option>
                      <option value="front">Front</option>
                      <option value="back">Back</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="rw-field rw-field--wide" htmlFor="rw-mode">
                    Mode
                    <select
                      id="rw-mode"
                      onChange={(event) =>
                        setOption('mode', event.target.value)
                      }
                      value={options.mode}
                    >
                      <option value="stills">Stills montage</option>
                      <option value="turntable">Turntable</option>
                      <option value="cinematic">Cinematic</option>
                    </select>
                  </label>
                  <NumberField
                    id="rw-fps"
                    label="FPS"
                    max={120}
                    min={1}
                    onChange={(value) => setOption('fps', value)}
                    value={options.fps}
                  />
                  <NumberField
                    id="rw-hold"
                    label="Seconds"
                    max={120}
                    min={0.1}
                    onChange={(value) => setOption('hold', value)}
                    step={0.1}
                    value={options.hold}
                  />
                  {options.mode === 'stills' ? (
                    <>
                      <NumberField
                        id="rw-shots"
                        label="Shots"
                        max={100}
                        min={1}
                        onChange={(value) => setOption('count', value)}
                        value={options.count}
                      />
                      <NumberField
                        id="rw-crossfade"
                        label="Crossfade"
                        max={30}
                        min={0}
                        onChange={(value) => setOption('crossfade', value)}
                        step={0.1}
                        value={options.crossfade}
                      />
                    </>
                  ) : null}
                  {options.mode === 'turntable' ? (
                    <NumberField
                      id="rw-turns"
                      label="Turns"
                      max={100}
                      min={0.1}
                      onChange={(value) => setOption('turns', value)}
                      step={0.1}
                      value={options.turns}
                    />
                  ) : null}
                  {options.mode === 'cinematic' ? (
                    <NumberField
                      id="rw-systems"
                      label="Systems"
                      max={100}
                      min={1}
                      onChange={(value) => setOption('systems', value)}
                      value={options.systems}
                    />
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className="rw-toggles">
            <label htmlFor="rw-bloom">
              <input
                checked={options.bloom}
                id="rw-bloom"
                onChange={(event) => setOption('bloom', event.target.checked)}
                type="checkbox"
              />
              Bloom
            </label>
            <label htmlFor="rw-overlay">
              <input
                checked={options.overlay}
                id="rw-overlay"
                onChange={(event) => setOption('overlay', event.target.checked)}
                type="checkbox"
              />
              Burn overlay
            </label>
          </section>

          {kind === 'still' ? (
            <fieldset className="rw-fieldset rw-formats">
              <legend>Image files</legend>
              <label htmlFor="rw-png">
                <input checked disabled id="rw-png" type="checkbox" />
                PNG
              </label>
              <label htmlFor="rw-svg">
                <input
                  checked={options.svg}
                  id="rw-svg"
                  onChange={(event) => setOption('svg', event.target.checked)}
                  type="checkbox"
                />
                SVG
              </label>
              <label htmlFor="rw-webp">
                <input
                  checked={options.webp}
                  id="rw-webp"
                  onChange={(event) => setOption('webp', event.target.checked)}
                  type="checkbox"
                />
                WebP
              </label>
            </fieldset>
          ) : null}

          <button
            className="dev-button dev-button--primary rw-submit"
            disabled={submitting}
            type="submit"
          >
            {kind === 'still' ? <FiImage /> : <FiFilm />}
            {submitting
              ? 'Submitting...'
              : `Render ${kind === 'still' ? 'stills' : 'video'}`}
          </button>
          {error ? <p className="rw-error">{error}</p> : null}
        </form>

        <section className="rw-results">
          <div className="rw-section-heading">
            <div>
              <span>Output library</span>
              <h2>Recent renders</h2>
            </div>
            <span>
              {jobs.reduce((total, job) => total + job.assets.length, 0)} files
            </span>
          </div>
          <AssetGallery
            deletingId={deletingId}
            jobs={jobs}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
            onRemoveAssets={removeAssets}
            onRemoveMany={removeMany}
            onRequestDelete={setPendingDeleteId}
            pendingDeleteId={pendingDeleteId}
          />

          <div className="rw-section-heading rw-section-heading--queue">
            <div>
              <span>Process</span>
              <h2>Render queue</h2>
            </div>
            <span>{workbenchJobs.length} jobs</span>
          </div>
          <div
            className="rw-queue"
            onClick={handleQueueClick}
            role="presentation"
          >
            {loading ? <div className="rw-empty">Loading queue...</div> : null}
            {!loading && workbenchJobs.length === 0 ? (
              <div className="rw-empty">
                No render jobs in this server session.
              </div>
            ) : null}
            {workbenchJobs.map((job) => (
              <JobStatus job={job} key={job.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
