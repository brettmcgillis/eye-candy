import React from 'react';
import { FiCheck, FiStopCircle } from 'react-icons/fi';

const DEFAULT_TITLES = { still: 'Still batch', video: 'Video render' };

export default function JobStatus({ job, title }) {
  const active = ['queued', 'running', 'cancelling'].includes(job.status);
  return (
    <article className="rw-job">
      <div className="rw-job__summary">
        <span className={`rw-status rw-status--${job.status}`}>
          {job.status === 'completed' ? <FiCheck /> : null}
          {job.status}
        </span>
        <strong>{title?.(job) ?? DEFAULT_TITLES[job.kind] ?? job.kind}</strong>
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
