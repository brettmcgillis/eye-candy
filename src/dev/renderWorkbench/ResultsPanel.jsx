import React, { useCallback, useMemo, useState } from 'react';
import { FiImage, FiList, FiSave } from 'react-icons/fi';

import AssetGallery from './AssetGallery';
import JobStatus from './JobStatus';
import { countMediaItems } from './assetGroups';

const ACTIVE = ['queued', 'running', 'cancelling'];

// Saved / Transient / Jobs, over one tool's useRenderJobs() result. Tool
// specifics come in through the gallery's slots.
export default function ResultsPanel({
  collectionTitle,
  jobTitle,
  jobsApi,
  renderDetails,
  selectionActions,
}) {
  const {
    cancel,
    jobs,
    keepAsset,
    loading,
    remove,
    removeAssets,
    removeMany,
    removeSavedAssets,
    savedCollections,
  } = jobsApi;
  const [tab, setTab] = useState('transient');
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const workbenchJobs = useMemo(
    () => jobs.filter((job) => job.source === 'workbench'),
    [jobs]
  );

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

  const cancelDelete = useCallback(() => setPendingDeleteId(null), []);

  function handleQueueClick(event) {
    const button = event.target.closest('[data-cancel-job]');
    if (button) cancel(button.dataset.cancelJob);
  }

  const tabs = [
    {
      count: countMediaItems(savedCollections),
      icon: <FiSave />,
      id: 'saved',
      label: 'Saved',
    },
    {
      count: countMediaItems(jobs),
      icon: <FiImage />,
      id: 'transient',
      label: 'Transient',
    },
    { count: workbenchJobs.length, icon: <FiList />, id: 'jobs', label: 'Jobs' },
  ];

  return (
    <section className="rw-results">
      <div
        aria-label="Workbench results"
        className="rw-results__tabs"
        role="tablist"
      >
        {tabs.map((item) => (
          <button
            aria-controls={`rw-panel-${item.id}`}
            aria-selected={tab === item.id}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>
      {tab === 'saved' ? (
        <div id="rw-panel-saved" role="tabpanel">
          <AssetGallery
            collectionTitle={collectionTitle}
            emptyMessage="Kept items appear here."
            jobs={savedCollections}
            onRemoveAssets={removeSavedAssets}
            renderDetails={renderDetails}
            selectionActions={selectionActions}
            variant="saved"
          />
        </div>
      ) : null}
      {tab === 'transient' ? (
        <div id="rw-panel-transient" role="tabpanel">
          <AssetGallery
            collectionTitle={collectionTitle}
            deletingId={deletingId}
            jobs={jobs}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
            onKeepAsset={keepAsset}
            onRemoveAssets={removeAssets}
            onRemoveMany={removeMany}
            onRequestDelete={setPendingDeleteId}
            pendingDeleteId={pendingDeleteId}
            renderDetails={renderDetails}
            selectionActions={selectionActions}
          />
        </div>
      ) : null}
      {tab === 'jobs' ? (
        <div id="rw-panel-jobs" role="tabpanel">
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
              <JobStatus job={job} key={job.id} title={jobTitle} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function activeJobCount(jobs) {
  return jobs.filter((job) => ACTIVE.includes(job.status)).length;
}
