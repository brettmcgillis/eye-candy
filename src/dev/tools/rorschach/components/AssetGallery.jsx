import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiFilm,
  FiFilter,
  FiFolder,
  FiGrid,
  FiImage,
  FiList,
  FiMaximize2,
  FiTrash2,
  FiX,
  FiZoomIn,
  FiZoomOut,
} from 'react-icons/fi';

import {
  assetFormat,
  groupMediaAssets,
  isMediaAsset,
} from '../utils/assetGroups';
import AssetActions from './AssetActions';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatAssetSize(asset) {
  return Number.isFinite(asset.size) ? formatBytes(asset.size) : null;
}

function itemKey(jobId, groupKey) {
  return `${jobId}:${groupKey}`;
}

function mediaCountLabel(count, singular) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

function collectionLabel(job, groups) {
  const videoCount = groups.filter((group) =>
    group.assets.some((asset) => assetFormat(asset) === 'mp4')
  ).length;
  const stillCount = groups.length - videoCount;
  const counts = [
    videoCount > 0 ? mediaCountLabel(videoCount, 'video') : null,
    stillCount > 0 ? mediaCountLabel(stillCount, 'still') : null,
  ].filter(Boolean);

  let title;
  if (job.source === 'curated') {
    title = 'Saved Collection';
  } else if (job.source === 'legacy') {
    title = 'Legacy Batch';
  } else if (job.kind === 'video') {
    const mode = job.options?.mode ?? 'video';
    title = `${mode[0].toUpperCase()}${mode.slice(1)} Video Render`;
  } else {
    title = 'Stills Render';
  }

  return counts.length > 0 ? `${title} · ${counts.join(' · ')}` : title;
}

function isVideoGroup(group) {
  return group.assets.some((asset) => assetFormat(asset) === 'mp4');
}

function Stat({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{String(value)}</dd>
    </div>
  );
}

function formatDimensions(width, height) {
  return width == null || height == null ? null : `${width} × ${height}`;
}

function PreviewStats({ error, loading, metadata }) {
  if (loading)
    return <aside className="rw-preview__stats">Loading stats...</aside>;
  if (error)
    return (
      <aside className="rw-preview__stats rw-preview__stats--error">
        {error}
      </aside>
    );
  if (!metadata) return null;

  const { preset = {}, render = {} } = metadata;
  return (
    <aside className="rw-preview__stats">
      <h2>Stats</h2>
      <dl>
        <Stat label="Seed" value={preset.seed} />
        <Stat label="Bundles" value={preset.bundleCount} />
        <Stat label="Strands" value={preset.strandsPerBundle} />
        <Stat label="Steps" value={preset.steps} />
        <Stat label="Shape" value={preset.framingShape} />
        <Stat
          label="Bounds"
          value={formatDimensions(preset.boundWidth, preset.boundHeight)}
        />
        <Stat label="Spread" value={preset.startSpread} />
        <Stat label="Frequency" value={preset.freq} />
        <Stat
          label="Palette"
          value={preset.monochrome ? 'Monochrome' : preset.palette}
        />
        <Stat label="Ink" value={preset.inkColor} />
        <Stat label="Background" value={preset.backgroundColor} />
        <Stat
          label="Output"
          value={formatDimensions(render.width, render.height)}
        />
        <Stat label="Renderer" value={render.renderer} />
        <Stat label="Distance" value={render.distance} />
        <Stat label="FOV" value={render.fov} />
        <Stat
          label="Bloom"
          value={render.bloom ? render.bloomStrength : 'Off'}
        />
      </dl>
      <details>
        <summary>Full metadata</summary>
        <pre>{JSON.stringify(metadata, null, 2)}</pre>
      </details>
    </aside>
  );
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
        preload="metadata"
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

function PreviewDialog({
  canDelete,
  canKeep,
  deletingAssetKey,
  group,
  groupCount,
  groupIndex,
  keptAssetKeys,
  keepingAssetKey,
  onCancelDelete,
  onClose,
  onConfirmDelete,
  onKeep,
  onNext,
  onPrevious,
  onRequestDelete,
  pendingDeleteKey,
}) {
  const [assetIndex, setAssetIndex] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [metadata, setMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(
    Boolean(group.metadataAsset)
  );
  const dragRef = useRef(null);
  const mediaRef = useRef(null);
  const zoomCenterRef = useRef(null);
  const asset = group.assets[assetIndex] ?? group.assets[0];
  const currentAssetKey = itemKey(group.collectionId, asset.path);
  const hasNext = groupIndex < groupCount - 1;
  const hasPrevious = groupIndex > 0;

  useEffect(() => {
    const controller = new AbortController();
    if (!group.metadataAsset) {
      setMetadata(null);
      setMetadataLoading(false);
      return () => controller.abort();
    }

    setMetadataError(null);
    setMetadataLoading(true);
    fetch(group.metadataAsset.url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Stats could not be loaded.');
        return response.json();
      })
      .then(setMetadata)
      .catch((error) => {
        if (error.name !== 'AbortError') setMetadataError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMetadataLoading(false);
      });
    return () => controller.abort();
  }, [group.metadataAsset]);

  const changeZoom = useCallback(
    (nextZoom) => {
      const resolvedZoom = Math.min(5, Math.max(1, nextZoom));
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
      if (event.key === 'ArrowLeft' && hasPrevious) onPrevious();
      if (event.key === 'ArrowRight' && hasNext) onNext();
      if (event.key === '-' || event.key === '_') changeZoom(zoom - 0.25);
      if (event.key === '+' || event.key === '=') changeZoom(zoom + 0.25);
      if (event.key === '0') changeZoom(1);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [changeZoom, hasNext, hasPrevious, onClose, onNext, onPrevious, zoom]);

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
              {assetFormat(asset).toUpperCase()}
              {formatAssetSize(asset)
                ? ` · ${formatAssetSize(asset)}`
                : ''} · {assetIndex + 1} of {group.assets.length} formats ·
              Image {groupIndex + 1} / {groupCount}
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
                disabled={zoom === 5}
                onClick={() => changeZoom(zoom + 0.25)}
                type="button"
              >
                <FiZoomIn />
              </button>
            </div>
            <AssetActions
              asset={asset}
              canDelete={canDelete}
              canKeep={canKeep}
              deleting={deletingAssetKey === currentAssetKey}
              kept={keptAssetKeys.has(currentAssetKey)}
              keeping={keepingAssetKey === currentAssetKey}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={() => onConfirmDelete(asset)}
              onKeep={() => onKeep(asset)}
              onRequestDelete={() => onRequestDelete(asset)}
              pendingDelete={pendingDeleteKey === currentAssetKey}
            />
            <button aria-label="Close preview" onClick={onClose} type="button">
              <FiX />
            </button>
          </div>
        </header>

        <div className="rw-preview__stage">
          {hasPrevious ? (
            <button
              aria-label="Previous generated image"
              className="rw-preview__previous"
              onClick={onPrevious}
              type="button"
            >
              <FiChevronLeft />
            </button>
          ) : null}
          <div className="rw-preview__content">
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
            <PreviewStats
              error={metadataError}
              loading={metadataLoading}
              metadata={metadata}
            />
          </div>
          {hasNext ? (
            <button
              aria-label="Next generated image"
              className="rw-preview__next"
              onClick={onNext}
              type="button"
            >
              <FiChevronRight />
            </button>
          ) : null}
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

function AssetCard({
  active,
  deleting,
  flat,
  group,
  job,
  kept,
  keeping,
  onCancelDelete,
  onConfirmDelete,
  onKeep,
  onPreview,
  onRequestDelete,
  onToggle,
  pendingDelete,
  saved,
  selected,
}) {
  const asset = group.assets[0];
  const isVideo = assetFormat(asset) === 'mp4';
  const collectionName = job.outputDirectory.split('/').pop();

  return (
    <figure
      className={`rw-asset${saved ? ' rw-asset--saved' : ''} ${
        group.assets.length > 1 ? 'rw-asset--stacked' : ''
      }`}
    >
      <button
        aria-label={`Preview ${isVideo ? 'video' : 'still'} ${group.name}`}
        className="rw-asset__open"
        onClick={onPreview}
        type="button"
      >
        <span className="rw-asset__preview">
          <MediaPreview asset={asset} />
        </span>
        <span className="rw-asset__expand">
          <FiMaximize2 />
        </span>
        <span className="rw-asset__type">
          {isVideo ? <FiFilm /> : <FiImage />}
        </span>
        {flat ? (
          <span className="rw-asset__collection" title={job.outputDirectory}>
            {collectionName}
          </span>
        ) : null}
        <span className="rw-asset__format-count">
          {group.assets.length > 1
            ? `${group.assets.length} formats`
            : assetFormat(asset).toUpperCase()}
        </span>
      </button>
      <figcaption>
        <input
          aria-label={`Select ${group.name}`}
          checked={selected}
          disabled={active}
          onChange={onToggle}
          type="checkbox"
        />
        <span title={`${job.outputDirectory}/${group.key}`}>{group.name}</span>
        <AssetActions
          asset={asset}
          canDelete={!active}
          canKeep={!saved}
          deleting={deleting}
          kept={kept}
          keepLabel={
            group.assets.length > 1
              ? `all formats for ${group.name}`
              : undefined
          }
          keeping={keeping}
          onCancelDelete={onCancelDelete}
          onConfirmDelete={onConfirmDelete}
          onKeep={onKeep}
          onRequestDelete={onRequestDelete}
          pendingDelete={pendingDelete}
        />
      </figcaption>
    </figure>
  );
}

export default function AssetGallery({
  deletingId,
  emptyMessage = 'Output collections appear here.',
  jobs,
  onCancelDelete,
  onConfirmDelete,
  onKeepAsset,
  onRemoveAssets,
  onRemoveMany,
  onRequestDelete,
  pendingDeleteId,
  variant = 'transient',
}) {
  const saved = variant === 'saved';
  const [deletingItemKey, setDeletingItemKey] = useState(null);
  const [keepingAssetKey, setKeepingAssetKey] = useState(null);
  const [keptAssetKeys, setKeptAssetKeys] = useState(() => new Set());
  const [pendingBulkDelete, setPendingBulkDelete] = useState(null);
  const [pendingItemDelete, setPendingItemDelete] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedCollections, setSelectedCollections] = useState(
    () => new Set()
  );
  const [selectedItems, setSelectedItems] = useState(() => new Set());
  const [submittingBulkDelete, setSubmittingBulkDelete] = useState(false);
  const [itemTypeFilters, setItemTypeFilters] = useState({
    stills: true,
    videos: true,
  });
  const [viewMode, setViewMode] = useState('batches');
  const collections = useMemo(
    () =>
      jobs.map((job) => {
        const media = job.assets.filter(isMediaAsset);
        const metadata = job.assets.filter((asset) =>
          asset.path.endsWith('.json')
        );
        const groups = groupMediaAssets(media, metadata).map((group) => ({
          ...group,
          collectionId: job.id,
          job,
        }));
        return { groups, job };
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
  const flatEntries = collections.flatMap(({ groups, job }) =>
    groups.map((group) => ({ group, job }))
  );
  const filteredFlatEntries = flatEntries.filter(({ group }) =>
    isVideoGroup(group) ? itemTypeFilters.videos : itemTypeFilters.stills
  );
  const filteredFlatGroups = filteredFlatEntries.map(({ group }) => group);
  const allItemTypesSelected = itemTypeFilters.videos && itemTypeFilters.stills;
  const visibleCollections = collections
    .map(({ groups, job }) => ({
      groups: groups.filter((group) =>
        isVideoGroup(group) ? itemTypeFilters.videos : itemTypeFilters.stills
      ),
      job,
    }))
    .filter(({ groups }) => allItemTypesSelected || groups.length > 0);
  const selectableItemKeys = collections.flatMap(({ groups, job }) =>
    ['queued', 'running', 'cancelling'].includes(job.status)
      ? []
      : groups.map((group) => itemKey(job.id, group.key))
  );
  const selectableCollectionIds = collections
    .map(({ job }) => job)
    .filter((job) => !['queued', 'running', 'cancelling'].includes(job.status))
    .map((job) => job.id);
  const allItemsSelected =
    selectableItemKeys.length > 0 &&
    selectableItemKeys.every((key) => selectedItems.has(key));
  const allCollectionsSelected =
    selectableCollectionIds.length > 0 &&
    selectableCollectionIds.every((id) => selectedCollections.has(id));
  const totalFileCount = collections.reduce(
    (total, { job }) => total + job.assets.length,
    0
  );
  const totalStorageBytes = collections.reduce(
    (total, { job }) => total + job.storageBytes,
    0
  );

  const closePreview = useCallback(() => setPreview(null), []);
  const showNextPreview = useCallback(() => {
    setPreview((current) => ({
      ...current,
      index: Math.min(current.index + 1, current.groups.length - 1),
    }));
  }, []);
  const showPreviousPreview = useCallback(() => {
    setPreview((current) => ({
      ...current,
      index: Math.max(current.index - 1, 0),
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

  async function keepAssets(jobId, assets) {
    const key = itemKey(jobId, assets[0].path);
    setKeepingAssetKey(key);
    try {
      const keptAssets = await onKeepAsset(
        jobId,
        assets.map((asset) => asset.path)
      );
      if (keptAssets) {
        setKeptAssetKeys((current) => {
          const next = new Set(current);
          assets.forEach((asset) => next.add(itemKey(jobId, asset.path)));
          return next;
        });
      }
    } finally {
      setKeepingAssetKey(null);
    }
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

  function toggleAllItems() {
    setSelectedItems((current) => {
      const next = new Set(current);
      selectableItemKeys.forEach((key) =>
        allItemsSelected ? next.delete(key) : next.add(key)
      );
      return next;
    });
  }

  function toggleAllCollections() {
    setSelectedCollections((current) => {
      const next = new Set(current);
      selectableCollectionIds.forEach((id) =>
        allCollectionsSelected ? next.delete(id) : next.add(id)
      );
      return next;
    });
  }

  function changeViewMode(nextMode) {
    if (nextMode === viewMode) return;
    setViewMode(nextMode);
    setPendingBulkDelete(null);
    setSelectedCollections(new Set());
  }

  function toggleItemTypeFilter(type) {
    setItemTypeFilters((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  async function deletePaths(job, paths, key, closeDialog = false) {
    setDeletingItemKey(key);
    try {
      await onRemoveAssets(job.id, job.outputDirectory, paths);
      setPendingItemDelete(null);
      setSelectedItems((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      if (closeDialog) setPreview(null);
    } finally {
      setDeletingItemKey(null);
    }
  }

  function deleteGroup(job, group) {
    const key = itemKey(job.id, group.key);
    return deletePaths(
      job,
      group.assets.map((asset) => asset.path),
      key,
      preview?.groups.some(
        (item) => item.collectionId === job.id && item.key === group.key
      )
    );
  }

  function deletePreviewAsset(group, asset) {
    const key = itemKey(group.collectionId, asset.path);
    return deletePaths(group.job, [asset.path], key, true);
  }

  function renderCard({ flat = false, group, groups, index, job }) {
    const active = ['queued', 'running', 'cancelling'].includes(job.status);
    const key = itemKey(job.id, group.key);
    return (
      <AssetCard
        active={active}
        deleting={deletingItemKey === key}
        flat={flat}
        group={group}
        job={job}
        kept={group.assets.every((asset) =>
          keptAssetKeys.has(itemKey(job.id, asset.path))
        )}
        keeping={keepingAssetKey === itemKey(job.id, group.assets[0].path)}
        key={key}
        onCancelDelete={() => setPendingItemDelete(null)}
        onConfirmDelete={() => deleteGroup(job, group)}
        onKeep={() => keepAssets(job.id, group.assets)}
        onPreview={() => setPreview({ groups, index })}
        onRequestDelete={() => setPendingItemDelete(key)}
        onToggle={() => toggleItem(key)}
        pendingDelete={pendingItemDelete === key}
        saved={saved}
        selected={selectedItems.has(key)}
      />
    );
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
    return <div className="rw-empty">{emptyMessage}</div>;
  }

  let flatContent = null;
  if (viewMode === 'items') {
    flatContent =
      flatEntries.length > 0 ? (
        <section className="rw-collection">
          <header className="rw-collection__header">
            <div>
              <strong>
                <FiFolder />
                All items
              </strong>
              <span>{saved ? 'Saved collection' : 'Transient renders'}</span>
            </div>
            <div className="rw-collection__stats">
              <span>
                {totalFileCount} files · {formatBytes(totalStorageBytes)}
              </span>
            </div>
          </header>
          {filteredFlatEntries.length > 0 ? (
            <div className="rw-gallery rw-gallery--flat">
              {filteredFlatEntries.map(({ group, job }, index) =>
                renderCard({
                  flat: true,
                  group,
                  groups: filteredFlatGroups,
                  index,
                  job,
                })
              )}
            </div>
          ) : (
            <div className="rw-collection__empty">
              No items match the current filters
            </div>
          )}
        </section>
      ) : (
        <div className="rw-empty">No previewable media yet.</div>
      );
  }

  return (
    <div className="rw-library">
      <div className="rw-library__toolbar">
        <details className="rw-library__filter rw-library__select-menu">
          <summary>
            <FiCheckSquare /> Select
          </summary>
          <div>
            <button
              disabled={selectableItemKeys.length === 0}
              onClick={toggleAllItems}
              type="button"
            >
              {allItemsSelected ? 'Deselect' : 'Select'} all items
            </button>
            {!saved ? (
              <button
                disabled={selectableCollectionIds.length === 0}
                onClick={toggleAllCollections}
                type="button"
              >
                {allCollectionsSelected ? 'Deselect' : 'Select'} all folders
              </button>
            ) : null}
          </div>
        </details>
        <div
          aria-label="Library view"
          className="rw-library__view-toggle"
          role="group"
        >
          <button
            aria-pressed={viewMode === 'batches'}
            onClick={() => changeViewMode('batches')}
            type="button"
          >
            <FiGrid /> Batches
          </button>
          <button
            aria-pressed={viewMode === 'items'}
            onClick={() => changeViewMode('items')}
            type="button"
          >
            <FiList /> All items
          </button>
        </div>
        <details className="rw-library__filter">
          <summary>
            <FiFilter /> Include
          </summary>
          <div>
            <label htmlFor={`rw-${variant}-filter-videos`}>
              <input
                checked={itemTypeFilters.videos}
                id={`rw-${variant}-filter-videos`}
                onChange={() => toggleItemTypeFilter('videos')}
                type="checkbox"
              />
              Videos
            </label>
            <label htmlFor={`rw-${variant}-filter-stills`}>
              <input
                checked={itemTypeFilters.stills}
                id={`rw-${variant}-filter-stills`}
                onChange={() => toggleItemTypeFilter('stills')}
                type="checkbox"
              />
              Stills
            </label>
          </div>
        </details>
      </div>
      {selectedGroups.length > 0 || (!saved && selectedJobs.length > 0) ? (
        <div className="rw-bulk-actions">
          <span>
            {selectedGroups.length} items
            {!saved ? ` · ${selectedJobs.length} folders` : ''}
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
              {!saved ? (
                <button
                  className="dev-button"
                  disabled={selectedJobs.length === 0}
                  onClick={() => setPendingBulkDelete('collections')}
                  type="button"
                >
                  <FiTrash2 /> Delete folders
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
      {flatContent}
      {viewMode === 'batches'
        ? visibleCollections.map(({ groups, job }) => {
            const active = ['queued', 'running', 'cancelling'].includes(
              job.status
            );
            let collectionDeleteAction = null;
            if (!saved && pendingDeleteId === job.id) {
              collectionDeleteAction = (
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
              );
            } else if (!saved) {
              collectionDeleteAction = (
                <button
                  aria-label={`Delete ${job.outputDirectory}`}
                  className="dev-button rw-delete"
                  disabled={active || deletingId === job.id}
                  onClick={() => onRequestDelete(job.id)}
                  title="Delete collection from disk"
                  type="button"
                >
                  <FiTrash2 />
                </button>
              );
            }
            return (
              <section className="rw-collection" key={job.id}>
                <header className="rw-collection__header">
                  <div>
                    <strong>
                      <FiFolder />
                      {collectionLabel(job, groups)}
                    </strong>
                    <span title={job.outputDirectory}>
                      {job.outputDirectory}
                    </span>
                  </div>
                  <div className="rw-collection__stats">
                    {saved ? null : (
                      <div className="rw-collection__selection">
                        <label htmlFor={`rw-items-${job.id}`}>
                          <input
                            checked={
                              groups.length > 0 &&
                              groups.every((group) =>
                                selectedItems.has(itemKey(job.id, group.key))
                              )
                            }
                            disabled={active || groups.length === 0}
                            id={`rw-items-${job.id}`}
                            onChange={() => toggleCollectionItems(job, groups)}
                            type="checkbox"
                          />
                          Items
                        </label>
                        <label htmlFor={`rw-folder-${job.id}`}>
                          <input
                            checked={selectedCollections.has(job.id)}
                            disabled={active}
                            id={`rw-folder-${job.id}`}
                            onChange={() => toggleCollection(job.id)}
                            type="checkbox"
                          />
                          Folder
                        </label>
                      </div>
                    )}
                    <span>
                      {job.assets.length} files ·{' '}
                      {formatBytes(job.storageBytes)}
                      {active ? ` · ${job.status}` : ''}
                    </span>
                    {collectionDeleteAction}
                  </div>
                </header>
                {groups.length > 0 ? (
                  <div className="rw-gallery">
                    {groups.map((group, index) =>
                      renderCard({ group, groups, index, job })
                    )}
                  </div>
                ) : (
                  <div className="rw-collection__empty">
                    No previewable media
                  </div>
                )}
              </section>
            );
          })
        : null}
      {preview ? (
        <PreviewDialog
          canDelete={
            !['queued', 'running', 'cancelling'].includes(
              preview.groups[preview.index].job.status
            )
          }
          canKeep={!saved}
          deletingAssetKey={deletingItemKey}
          group={preview.groups[preview.index]}
          groupCount={preview.groups.length}
          groupIndex={preview.index}
          keptAssetKeys={keptAssetKeys}
          keepingAssetKey={keepingAssetKey}
          key={itemKey(
            preview.groups[preview.index].collectionId,
            preview.groups[preview.index].key
          )}
          onCancelDelete={() => setPendingItemDelete(null)}
          onClose={closePreview}
          onConfirmDelete={(asset) =>
            deletePreviewAsset(preview.groups[preview.index], asset)
          }
          onKeep={(asset) =>
            keepAssets(preview.groups[preview.index].collectionId, [asset])
          }
          onNext={showNextPreview}
          onPrevious={showPreviousPreview}
          onRequestDelete={(asset) =>
            setPendingItemDelete(
              itemKey(preview.groups[preview.index].collectionId, asset.path)
            )
          }
          pendingDeleteKey={pendingItemDelete}
        />
      ) : null}
    </div>
  );
}
