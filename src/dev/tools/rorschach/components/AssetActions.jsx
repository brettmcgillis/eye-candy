import React from 'react';
import { FiCheck, FiDownload, FiSave, FiTrash2, FiX } from 'react-icons/fi';

export default function AssetActions({
  asset,
  canDelete = false,
  canKeep = false,
  deleting = false,
  kept = false,
  keepLabel,
  keeping = false,
  onCancelDelete,
  onConfirmDelete,
  onKeep,
  onRequestDelete,
  pendingDelete = false,
}) {
  const keepTitle = keepLabel ? `Keep ${keepLabel}` : 'Keep';

  return (
    <div className="rw-asset-actions">
      <a
        aria-label={`Download ${asset.name}`}
        download
        href={asset.url}
        title={`Download ${asset.name}`}
      >
        <FiDownload />
      </a>
      {canKeep ? (
        <button
          aria-label={`${kept ? 'Kept' : 'Keep'} ${keepLabel ?? asset.name}`}
          className="rw-asset__icon-action"
          disabled={keeping || kept}
          onClick={onKeep}
          title={kept ? 'Kept' : keepTitle}
          type="button"
        >
          {kept ? <FiCheck /> : <FiSave />}
        </button>
      ) : null}
      {canDelete && pendingDelete ? (
        <>
          <button
            aria-label={`Confirm delete ${asset.name}`}
            className="rw-asset__icon-action rw-asset__confirm-delete"
            disabled={deleting}
            onClick={onConfirmDelete}
            title="Confirm delete"
            type="button"
          >
            <FiCheck />
          </button>
          <button
            aria-label={`Cancel delete ${asset.name}`}
            className="rw-asset__icon-action"
            onClick={onCancelDelete}
            title="Cancel delete"
            type="button"
          >
            <FiX />
          </button>
        </>
      ) : null}
      {canDelete && !pendingDelete ? (
        <button
          aria-label={`Delete ${asset.name}`}
          className="rw-asset__icon-action"
          onClick={onRequestDelete}
          title="Delete"
          type="button"
        >
          <FiTrash2 />
        </button>
      ) : null}
    </div>
  );
}
